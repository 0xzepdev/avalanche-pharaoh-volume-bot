import { ethers } from 'ethers';
import { SwapConfig } from '../types';
import { wait } from '../utils/wait';
import { log } from '../utils/logger';
import { swapAVAXForToken, swapTokenToAVAX } from './swap';
import { getAVAXPrice} from '../utils/price';

export async function calculateSwapRequirements(config: SwapConfig): Promise<number> {
    const avaxPrice = await getAVAXPrice();
    const firstSwapAVAX = Number(config.firstSwapUSD) / avaxPrice;
    const thirdSwapAVAX = Number(config.thirdSwapUSD) / avaxPrice;
    const gasFees = 0.003;
    const totalAVAX = firstSwapAVAX + thirdSwapAVAX + gasFees;
    return totalAVAX;
}

export async function runSwapCycle(config: SwapConfig, provider: ethers.JsonRpcProvider, wallet: ethers.Wallet): Promise<void> {
    const requiredAVAX = await calculateSwapRequirements(config);
    const balance = await provider.getBalance(wallet.address);
    if (balance < ethers.parseEther(requiredAVAX.toFixed(6))) {
        throw new Error(`INSUFFICIENT AVAX BALANCE FOR CYCLE: Required ${requiredAVAX.toFixed(6)} AVAX, Have ${ethers.formatEther(balance)} AVAX`);
    }

    log('info', "=== Starting First Swap: AVAX to Token ===");
    await swapAVAXForToken(config.firstSwapUSD, provider, wallet);
    log('info', `Waiting ${config.waitTimeBeforeSwaps}s before next swap...`);
    await wait(config.waitTimeBeforeSwaps);

    log('info', "=== Starting Second Swap: Token to AVAX ===");
    await swapTokenToAVAX(config.secondSwapUSD, provider, wallet);
    log('info', `Waiting ${config.waitTimeBetweenSwaps}s before next swap...`);
    await wait(config.waitTimeBetweenSwaps);

    log('info', "=== Starting Third Swap: AVAX to Token ===");
    await swapAVAXForToken(config.thirdSwapUSD, provider, wallet);
    log('info', `Waiting ${config.waitTimeAfterCycle}s before next cycle...`);
    await wait(config.waitTimeAfterCycle);

    log('info', "=== Swap Cycle Completed ===");
}
