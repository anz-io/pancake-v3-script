require('dotenv').config()
const { Token } = require('@uniswap/sdk-core')
const { 
  Pool, Position, TickMath, 
  nearestUsableTick, encodeSqrtRatioX96 
} = require('@uniswap/v3-sdk')
const { Contract, JsonRpcProvider } = require('ethers')

const owner = process.env.SEPOLIA_OWNER
const token0 = '0x0a222c8255E4462B91A3AE22d61A0de48Bb743E8'
const token1 = '0xb31ff0188118a615AebC106FeCb3f5596D5d61E3'
const poolFee = 2500

const positionManagerAddress = process.env.SEPOLIA_PCV3_POSITION_MANAGER
const factoryAddress = process.env.SEPOLIA_PCV3_FACTORY

const factoryABI = require('./abi/factory.json')
const poolABI = require('./abi/pool.json')
const erc20ABI = require('./abi/erc20.json')
const positionManagerABI = require('./abi/position.json')

async function main() {
  // Prepare
  const provider = new JsonRpcProvider(process.env.RPC_SEPOLIA)
  const token0Decimals = await (new Contract(token0, erc20ABI, provider)).decimals()
  const token1Decimals = await (new Contract(token1, erc20ABI, provider)).decimals()

  // Calculate pool address
  const factory = new Contract(factoryAddress, factoryABI, provider)
  const positionManager = new Contract(positionManagerAddress, positionManagerABI, provider)
  const poolAddress = await factory.getPool(token0, token1, poolFee)
  console.log(`Pool address: ${poolAddress}`)

  const deployed = (await provider.getCode(poolAddress)).length > 0 
  console.log(`Pool status: ${deployed ? '✅ deployed' : '⬜️ not deployed'}`)

  if (!deployed) {
    console.log('Pool not deployed, exiting...')
    return      // TODO
  }

  // Fetch pool status
  const pool = new Contract(poolAddress, poolABI, provider)
  // const [liquidity, slot0, tickSpacing] = await Promise.all([
  //   pool.liquidity(),
  //   pool.slot0(),
  //   pool.tickSpacing(),
  // ])
  // console.log(`Slot0: ${slot0}`)
  const tickSpacing = parseInt(await pool.tickSpacing())
  console.log(`Tick spacing: ${tickSpacing}`)

  const px0 = encodeSqrtRatioX96(
    (2n * 10n ** token1Decimals).toString(),  // token 1 amount
    (1n * 10n ** token0Decimals).toString(),  // token 0 amount
  )
  const px1 = encodeSqrtRatioX96(
    (3n * 10n ** token1Decimals).toString(),  // token 1 amount
    (1n * 10n ** token0Decimals).toString(),  // token 0 amount
  )
  
  const tick0 = nearestUsableTick(TickMath.getTickAtSqrtRatio(px0), tickSpacing)
  const tick1 = nearestUsableTick(TickMath.getTickAtSqrtRatio(px1), tickSpacing)

  const [tickLower, tickUpper] = [tick0, tick1].sort((a, b) => a - b)

  // Mint
  console.log(positionManager.interface.encodeFunctionData('mint', [{
    token0, 
    token1,
    fee: poolFee,
    tickLower,
    tickUpper,
    amount0Desired: 10n * 10n ** token0Decimals,
    amount1Desired: 25n * 10n ** token1Decimals,
    amount0Min: 0n,
    amount1Min: 0n,
    recipient: owner,
    deadline: parseInt(Date.now() / 1e3) + 60 * 20,   // 20 minutes from now
  }]))


  // Function arguments: Result(1) [
  //   Result(11) [
  //     '0x0a222c8255E4462B91A3AE22d61A0de48Bb743E8', // $MTK
  //     '0xb31ff0188118a615AebC106FeCb3f5596D5d61E3', // $USDT
  //     2500n,    // fee 0.25%
  //     -262450n, // lower tick, 1.0001 ** (-262450) = 4.004157828785322e-12
  //     -258450n, // upper tick, 1.0001 ** (-258450) = 5.973382081363084e-12
  //     1999999999845919060244n,
  //     12349433117n,
  //     1883371546001342641291n,
  //     11760454007n,
  //     '0x7b7C993c3c283aaca86913e1c27DB054Ce5fA143',
  //     1743136968n
  //   ]
  // ]

  // mint: struct MintParams {
  //   address token0;
  //   address token1;
  //   uint24 fee;
  //   int24 tickLower;
  //   int24 tickUpper;
  //   uint256 amount0Desired;
  //   uint256 amount1Desired;
  //   uint256 amount0Min;
  //   uint256 amount1Min;
  //   address recipient;
  //   uint256 deadline;
  // }
  
  // // Configure pool
  // const configuredPool = new Pool(
  //   token0,
  //   token1,
  //   poolFee,
  //   slot0.sqrtPriceX96.toString(),
  //   liquidity.toString(),
  //   slot0.tick,
  // )
  // console.log(`Tick: ${configuredPool.tick}`)
  // console.log(`Tick current: ${configuredPool.tickCurrent}`)
  // console.log(`Tick spacing: ${configuredPool.tickSpacing}`)

  // // Calculate position
  // const position = Position.fromAmounts({
  //   pool: configuredPool,
  //   tickLower:
  //     nearestUsableTick(configuredPool.tickCurrent, configuredPool.tickSpacing) -
  //     configuredPool.tickSpacing * 2,
  //   tickUpper:
  //     nearestUsableTick(configuredPool.tick, configuredPool.tickSpacing) +
  //     configuredPool.tickSpacing * 2,
  //   amount0: amount0,
  //   amount1: amount1,
  //   useFullPrecision: true,
  // })
}

main()
