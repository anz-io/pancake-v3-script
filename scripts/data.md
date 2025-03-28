# Pancake V3

## Add initial liquidity

$MTK & $USDT, 0.25%, initial price ~5, range 4.0042 ~ 5.9734, 2000 $MTK & 12340 $USDT
https://sepolia.etherscan.io/tx/0x346c3faa5c664984a5b42db4d883ae0c35ddbf09a81ebbc008150e4adb2620c6

1. createAndInitializePoolIfNecessary
```log
Function name: createAndInitializePoolIfNecessary
Function signature: createAndInitializePoolIfNecessary(address,address,uint24,uint160)
Function arguments: Result(4) [
  '0x0a222c8255E4462B91A3AE22d61A0de48Bb743E8', // $MTK
  '0xb31ff0188118a615AebC106FeCb3f5596D5d61E3', // $USDT
  2500n,    // fee 0.25%
  177158163029785428684544n   // y = √p * 2^96, p = (y / 2^96) ^ 2   ===>  p = 4.999921309408992e-12
]
```

2. mint
```log
Function name: mint
Function signature: mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))
Function arguments: Result(1) [
  Result(11) [
    '0x0a222c8255E4462B91A3AE22d61A0de48Bb743E8', // $MTK
    '0xb31ff0188118a615AebC106FeCb3f5596D5d61E3', // $USDT
    2500n,    // fee 0.25%
    -262450n, // lower tick, 1.0001 ** (-262450) = 4.004157828785322e-12
    -258450n, // upper tick, 1.0001 ** (-258450) = 5.973382081363084e-12
    1999999999845919060244n,
    12349433117n,
    1883371546001342641291n,
    11760454007n,
    '0x7b7C993c3c283aaca86913e1c27DB054Ce5fA143',
    1743136968n
  ]
]
```

```solidity
function createAndInitializePoolIfNecessary(
    address token0,
    address token1,
    uint24 fee,
    uint160 sqrtPriceX96
)

mint: struct MintParams {
    address token0;
    address token1;
    uint24 fee;
    int24 tickLower;
    int24 tickUpper;
    uint256 amount0Desired;
    uint256 amount1Desired;
    uint256 amount0Min;
    uint256 amount1Min;
    address recipient;
    uint256 deadline;
}
```

- 如何决定 token 0 和 token 1 的顺序：需满足 token0 < token1
- price = amount1 / amount0，amount 指添加初始流动性时的资金量