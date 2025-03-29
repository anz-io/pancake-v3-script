const { encodeSqrtRatioX96, nearestUsableTick, TickMath } = require('@uniswap/v3-sdk')
const { parseUnits } = require('ethers')

/**
 * @param {string} amount0 
 * @param {string} amount1 
 * @param {number} token0Decimals 
 * @param {number} token1Decimals 
 * @returns {string}
 */
function priceToPx(amount0, amount1, token0Decimals, token1Decimals) {
  const px = encodeSqrtRatioX96(
    parseUnits(amount1, token1Decimals).toString(),  // token 1 amount
    parseUnits(amount0, token0Decimals).toString(),  // token 0 amount
  )
  return px.toString()
}

/**
 * @param {string} amount0 
 * @param {string} amount1 
 * @param {number} token0Decimals 
 * @param {number} token1Decimals 
 * @param {number} tickSpacing 
 * @returns {number}
 */
function priceToTick(amount0, amount1, token0Decimals, token1Decimals, tickSpacing) {
  const px = encodeSqrtRatioX96(
    parseUnits(amount1, token1Decimals).toString(),  // token 1 amount
    parseUnits(amount0, token0Decimals).toString(),  // token 0 amount
  )
  const tick = nearestUsableTick(TickMath.getTickAtSqrtRatio(px), tickSpacing)
  return tick
}

module.exports = { priceToPx, priceToTick }
