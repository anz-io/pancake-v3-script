require('dotenv').config()

const config = {
  sepolia: {
    addresses: {
      factoryAddress: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
      positionManagerAddress: '0x46A15B0b27311cedF172AB29E4f4766fbE7F4364',
    },
    rpc: process.env.RPC_SEPOLIA,
    lp: process.env.SEPOLIA_LP,
  },
  bsc: {
    addresses: {},
    rpc: '',
    lp: '',
  }
}

const abi = {
  erc20ABI: require('./abi/erc20.json'),
  poolABI: require('./abi/pool.json'),
  factoryABI: require('./abi/factory.json'),
  positionManagerABI: require('./abi/position.json'),
}

module.exports = { config, abi }