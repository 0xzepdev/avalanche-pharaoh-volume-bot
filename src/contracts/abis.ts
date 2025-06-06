export const WAVAX_ABI = [
    "function deposit() payable",
    "function approve(address,uint256) returns (bool)",
    "function balanceOf(address) view returns (uint256)",
    "function withdraw(uint256) external",
];

export const TOKEN_ABI = [
    "function approve(address,uint256) returns (bool)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)",
];

export const ROUTER_ABI = [
    "function exactInput((bytes path,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum)) external payable returns (uint256)",
    "function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96)) external payable returns (uint256)",
];
