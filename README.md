# Adding Multiple-Range Liquidity to PancakeSwap V3

## Setup Environment

```bash
yarn
cp .env.example .env
```

Then fill in the `.env` file with your own values.

## Deploy ERC20

Deploy the ERC20 token that you want to add liquidity to.

```bash
node scripts/deploy-erc20.js
```

## Add multiple-range liquidity

Modify the following variables in `scripts/add-liquidity.js`:

- `token0`
- `token1`
- `token0IsBase`
- `ranges`
- `initialPrice`

And then run the script:

```bash
node scripts/add-liquidity.js
```
