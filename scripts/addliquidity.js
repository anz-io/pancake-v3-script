const { Contract, JsonRpcProvider, Wallet, parseUnits, ZeroAddress, parseEther } = require('ethers')
const { priceToPx, priceToTick } = require('./utils')
const { config, abi } = require('./constants')
require('dotenv').config()

const network = config.bsc

const token0 = '0x32E2E55197ef6aF8c11E2bBEf5f2B8300A17060e'   // [$X] $Mock USDC
const token1 = '0x9854B03C299Db3324aFbD854E262940DF3F469ab'   // [$Y] $Mock BNB

const poolFee = 2500
const enoughAllownace = parseEther('1000000000000')

/**
 * @type {boolean}
 */
const token0IsBase = true

/**
 * @type {[
 *  string,  // lower price, $Y/$X if `token0IsBase` is true, $X/$Y if `token0IsBase` is false
 *  string,  // upper price
 *  string,  // amount of token0 expected (in $X)
 *  string,  // amount of token1 expected (in $Y)
 * ][]}
 */
const ranges = [
  ['250', '350', '1000', '4.5'],
  ['350', '450', '2000', '5'],
  ['450', '550', '5000', '10'],
  ['550', '650', '2400', '4'],
  ['650', '750', '1000', '1.5'],
]

const initialPrice = '500'      // available only when pool is not deployed


const { positionManagerAddress, factoryAddress } = network.addresses
const { erc20ABI, poolABI, factoryABI, positionManagerABI } = abi


async function main() {

  // Prepare
  const provider = new JsonRpcProvider(network.rpc)
  const wallet = new Wallet(process.env.PAYER_PK, provider)
  const factory = new Contract(factoryAddress, factoryABI, provider)
  const positionManager = new Contract(positionManagerAddress, positionManagerABI, provider)
  const token0Contract = new Contract(token0, erc20ABI, provider)
  const token1Contract = new Contract(token1, erc20ABI, provider)
  const token0Decimals = await token0Contract.decimals()
  const token1Decimals = await token1Contract.decimals()
  const multicallDataList = []


  // Calculate pool address
  const poolAddress = await factory.getPool(token0, token1, poolFee)
  console.log(`Pool address: ${poolAddress}`)

  const deployed = poolAddress != ZeroAddress && (await provider.getCode(poolAddress)).length > 0
  console.log(`Pool status: ${deployed ? 'deployed ✅' : 'not deployed ⬜️'}`)


  // Create pool
  if (!deployed) {
    console.log('Pool not deployed, creating...')
    const dataCreateAndInitializePool = positionManager.interface
      .encodeFunctionData('createAndInitializePoolIfNecessary', [
        token0,
        token1,
        poolFee,
        priceToPx(
          token0IsBase ? initialPrice : '1', token0IsBase ? '1' : initialPrice, 
          token0Decimals, token1Decimals,
        ),
      ])
    console.log(`🟦 \`createAndInitializePoolIfNecessary\` data: ${
      dataCreateAndInitializePool.slice(0, 14)
    }...`)
    multicallDataList.push(dataCreateAndInitializePool)
  }


  // Fetch pool status
  const pool = new Contract(poolAddress, poolABI, provider)
  const tickSpacing = parseInt(deployed ? await pool.tickSpacing() : 50)


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


  // Approve tokens
  const [allowance0, allowance1] = await Promise.all([
    token0Contract.allowance(wallet.address, network.lp),
    token1Contract.allowance(wallet.address, network.lp),
  ])
  console.log(`⬜️ Allowance of ${wallet.address} to ${network.lp}:`)
  console.log(`  - ${token0}: ${allowance0}`)
  console.log(`  - ${token1}: ${allowance1}`)

  if (allowance0 < enoughAllownace || allowance1 < enoughAllownace) {
    console.log('\nNot enough allowance, approving...')
    const dataApprove = token0Contract.interface.encodeFunctionData(
      'approve', [positionManagerAddress, enoughAllownace]
    )
    const tx0 = await wallet.sendTransaction({
      to: token0,
      data: dataApprove,
    })
    await tx0.wait()
    console.log(`🟩 Approved token0 at tx: ${tx0.hash}`)
    const tx1 = await wallet.sendTransaction({
      to: token1,
      data: dataApprove,
    })
    await tx1.wait()
    console.log(`🟩 Approved token1 at tx: ${tx1.hash}`)
  }


  // Add liquidity
  const tx = await wallet.sendTransaction({
    to: positionManagerAddress,
    data: multicallData,
  })
  await tx.wait()
  console.log(`\n🟩 Added liquidity at tx: ${tx.hash}`)

}

main()
