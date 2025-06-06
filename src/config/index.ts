import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

export const CONFIG = {
    AVAX_RPC_URL: process.env.AVAX_RPC_URL!,
    PRIVATE_KEY: process.env.PRIVATE_KEY!,
    SLIPPAGE: parseFloat(process.env.SLIPPAGE || "0.005"), // default 0.5%
    PHARAOH_ROUTER: process.env.PHARAOH_ROUTER || "0x062c62cA66E50Cfe277A95564Fe5bB504db1Fab8",
    WAVAX: process.env.WAVAX || "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
    TARGET_TOKEN: process.env.TARGET_TOKEN || "0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a"
};
