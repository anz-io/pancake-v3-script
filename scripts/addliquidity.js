const { Contract, JsonRpcProvider, parseUnits } = require('ethers')
const { config, abi } = require('./constants')
const { priceToPx, priceToTick } = require('./utils')

const network = config.sepolia

const token0 = '0x0a222c8255E4462B91A3AE22d61A0de48Bb743E8'   // $X
const token1 = '0xb31ff0188118a615AebC106FeCb3f5596D5d61E3'   // $Y
const poolFee = 2500

/**
 * @type {boolean}
 */
const token0IsBase = false   // It means using `1 $Y = p $X` to represent the price

/**
 * @type {[
 *  string,  // lower price, $Y/$X if `token0IsBase` is true, $X/$Y if `token0IsBase` is false
 *  string,  // upper price
 *  string,  // amount of token0 expected (in $X)
 *  string,  // amount of token1 expected (in $Y)
 * ][]}
 */
const ranges = [
  ['2.4', '3.2', '1000', '3000'],
  ['3.2', '4.0', '2000', '8000'],
  ['4.0', '4.8', '5000', '22000'],
  ['4.8', '5.6', '5000', '25000'],
  ['5.6', '6.4', '3000', '18000'],
  ['6.4', '7.2', '1000', '7000'],
]


const { positionManagerAddress, factoryAddress } = network.addresses
const { erc20ABI, poolABI, factoryABI, positionManagerABI } = abi


async function main() {

  // Prepare
  const provider = new JsonRpcProvider(network.rpc)
  const factory = new Contract(factoryAddress, factoryABI, provider)
  const positionManager = new Contract(positionManagerAddress, positionManagerABI, provider)
  const token0Decimals = await (new Contract(token0, erc20ABI, provider)).decimals()
  const token1Decimals = await (new Contract(token1, erc20ABI, provider)).decimals()
  const multicallDataList = []


  // Calculate pool address
  const poolAddress = await factory.getPool(token0, token1, poolFee)
  console.log(`Pool address: ${poolAddress}`)

  const deployed = (await provider.getCode(poolAddress)).length > 0
  console.log(`Pool status: ${deployed ? 'deployed ✅' : 'not deployed ⬜️'}`)


  // Create pool
  if (!deployed) {
    console.log('Pool not deployed, exiting...')
    const initialPrice = priceToPx('1', '5', token0Decimals, token1Decimals)
    const dataCreateAndInitializePool = positionManager.interface
      .encodeFunctionData('createAndInitializePoolIfNecessary', [
        token0,
        token1,
        poolFee,
        initialPrice,
      ])
    console.log(`🟦 \`createAndInitializePoolIfNecessary\` data: ${
      dataCreateAndInitializePool.slice(0, 14)
    }...`)
    multicallDataList.push(dataCreateAndInitializePool)
  }


  // Fetch pool status
  const pool = new Contract(poolAddress, poolABI, provider)
  const tickSpacing = parseInt(await pool.tickSpacing())



  // Calculate ticks
  for (const range of ranges) {
    const [lowerPrice, upperPrice, amount0, amount1] = range
    const tick0 = priceToTick(
      token0IsBase ? lowerPrice : '1', token0IsBase ? '1' : lowerPrice,
      token0Decimals, token1Decimals, tickSpacing,
    )
    const tick1 = priceToTick(
      token0IsBase ? upperPrice : '1', token0IsBase ? '1' : upperPrice,
      token0Decimals, token1Decimals, tickSpacing,
    )
    const [tickLower, tickUpper] = [tick0, tick1].sort((a, b) => a - b)

    const dataAddLiquidity = positionManager.interface.encodeFunctionData('mint', [{
      token0,
      token1,
      fee: poolFee,
      tickLower,
      tickUpper,
      amount0Desired: parseUnits(amount0, token0Decimals),
      amount1Desired: parseUnits(amount1, token1Decimals),
      amount0Min: 0n,
      amount1Min: 0n,
      recipient: network.lp,
      deadline: parseInt(Date.now() / 1e3) + 60 * 20,   // 20 minutes from now
    }])
    console.log(`🟦 Add liquidity data: ${dataAddLiquidity.slice(0, 14)}...`)
    multicallDataList.push(dataAddLiquidity)
  }


  // Encode multicall data
  const multicallData = positionManager.interface.encodeFunctionData(
    'multicall', [multicallDataList],
  ) 
  console.log(`🟧 Multicall data: ${multicallData.slice(0, 14)}...`)

}

main()
