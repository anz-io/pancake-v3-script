const { JsonRpcProvider, Wallet, ContractFactory } = require("ethers");
const { readFileSync } = require('fs');
const { config } = require('./constants');
require('dotenv').config()

const network = config.bsc

async function main() {
  const provider = new JsonRpcProvider(network.rpc)
  const wallet = new Wallet(process.env.PAYER_PK, provider)
  const bytecode = readFileSync('./scripts/bytecode/erc20.bytecode', 'utf-8')
  const factory = new ContractFactory([
    "constructor(string memory name, string memory symbol)",
  ], bytecode, wallet)

  const tokenName = "My Token"
  const tokenSymbol = "MTK"

  const erc20 = await factory.deploy(tokenName, tokenSymbol)
  console.log(`🟩 Token \$${tokenSymbol} deployed to: ${await erc20.getAddress()}`)
}

main()