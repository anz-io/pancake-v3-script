const pancakeV3ABI = require('./pancakev3.json');
const { Interface } = require('ethers');

const { } = require('@uniswap/v3-sdk')

const pcv3 = new Interface(pancakeV3ABI);

function decodeCalldata(calldata) {
  try {
    const decodedData = pcv3.parseTransaction({ data: calldata });
    console.log('Function name:', decodedData.name);
    console.log('Function signature:', decodedData.signature);
    console.log('Function arguments:', decodedData.args);
    return decodedData;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

const sampleCalldata = '0x883164560000000000000000000000000a222c8255e4462b91a3ae22d61a0de48bb743e8000000000000000000000000b31ff0188118a615aebc106fecb3f5596d5d61e300000000000000000000000000000000000000000000000000000000000009c4fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffbfecefffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc0e6e00000000000000000000000000000000000000000000006c6b935b67dd4f711400000000000000000000000000000000000000000000000000000002e015651d0000000000000000000000000000000000000000000000661907da8ee04ab48b00000000000000000000000000000000000000000000000000000002bcfa49770000000000000000000000007b7c993c3c283aaca86913e1c27db054ce5fa1430000000000000000000000000000000000000000000000000000000067e628c8';
decodeCalldata(sampleCalldata);
