import { ethers, JsonRpcProvider, Wallet } from "ethers";
import { CONFIG } from "./config";
import { SwapConfig } from "./types";
import { log, logTable } from "./utils/logger";
import { runSwapCycle, calculateSwapRequirements } from "./core/bot";

async function main() {
    const swapConfig: SwapConfig = {
        firstSwapUSD: "0.02",
        secondSwapUSD: "0.0086",
        thirdSwapUSD: "0.01",
        waitTimeBeforeSwaps: 5,
        waitTimeBetweenSwaps: 8,
        waitTimeAfterCycle: 12
    };

    log('info', "=== Bot Configuration ===");
    logTable('Bot Configuration', swapConfig);

    const provider = new JsonRpcProvider(CONFIG.AVAX_RPC_URL);
    const wallet = new Wallet(CONFIG.PRIVATE_KEY, provider);

    const requiredAVAX = await calculateSwapRequirements(swapConfig);
    const balance = await provider.getBalance(wallet.address);

    logTable('Funds Status', {
        'Minimum Required': `${requiredAVAX.toFixed(6)} AVAX`,
        'Current Balance': `${ethers.formatEther(balance)} AVAX`,
        'Status': balance >= ethers.parseEther(requiredAVAX.toFixed(6)) ? '✅ Sufficient' : '❌ Insufficient'
    });

    if (balance < ethers.parseEther(requiredAVAX.toFixed(6))) {
        log('error', "Insufficient AVAX balance. Please fund your wallet.");
        process.exit(1);
    }

    log('info', "Bot starting with sufficient funds...");
    while (true) {
        try {
            await runSwapCycle(swapConfig, provider, wallet);
        } catch (err) {
            log('error', "Error in swap cycle:", err);
            await new Promise(res => setTimeout(res, 30 * 1000));
        }
    }
}

main().catch(err => {
    log('error', "FATAL ERROR IN BOT!", err);
    process.exit(1);
});
