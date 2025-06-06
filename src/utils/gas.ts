import { ethers, parseEther } from 'ethers';
import { getAVAXPrice } from './price';
import { logTable } from './logger';

export async function checkGasFeeBalance(amountUSD: string, provider: ethers.JsonRpcProvider, wallet: ethers.Wallet) {
    const balance = await provider.getBalance(wallet.address);
    const avaxPrice = await getAVAXPrice();
    const swapAmountAVAX = Number(amountUSD) / avaxPrice;
    const gasFee = Math.max(swapAmountAVAX * 0.01, 0.001);
    logTable('Gas Fee Check', {
        'Swap Amount (USD)': `$${amountUSD}`,
        'Swap Amount (AVAX)': `${swapAmountAVAX.toFixed(6)} AVAX`,
        'Current Balance': `${ethers.formatEther(balance)} AVAX`,
        'Required Gas Fee': `${gasFee.toFixed(6)} AVAX`
    });
    if (balance < parseEther(gasFee.toFixed(6))) {
        throw new Error(`INSUFFICIENT GAS FEE BALANCE: Required ${gasFee.toFixed(6)} AVAX, Have ${ethers.formatEther(balance)} AVAX`);
    }
}
