import { ethers, parseEther, parseUnits, Contract } from 'ethers';
import { ROUTER_ABI, WAVAX_ABI, TOKEN_ABI } from '../contracts/abis';
import { PHARAOH_ROUTER, WAVAX, TARGET_TOKEN } from '../contracts/addresses';
import { getAVAXPrice, getTokenPrice } from '../utils/price';
import { log, logTable } from '../utils/logger';
import { checkGasFeeBalance } from '../utils/gas';

const GAS_LIMIT = 500_000;

export async function swapAVAXForToken(amountUSD: string, provider: ethers.JsonRpcProvider, wallet: ethers.Wallet) {
    await checkGasFeeBalance(amountUSD, provider, wallet);

    const avaxPrice = await getAVAXPrice();
    const amountAVAX = (Number(amountUSD) / avaxPrice).toFixed(6);
    const balance = await provider.getBalance(wallet.address);
    const requiredAVAX = parseEther(amountAVAX);
    if (balance < requiredAVAX) {
        throw new Error(`INSUFFICIENT AVAX BALANCE: Required ${ethers.formatEther(requiredAVAX)} AVAX, Have ${ethers.formatEther(balance)} AVAX`);
    }
    const router = new Contract(PHARAOH_ROUTER, ROUTER_ABI, wallet);
    const wavax = new Contract(WAVAX, WAVAX_ABI, wallet);
    const token = new Contract(TARGET_TOKEN, TOKEN_ABI, wallet);
    const initialTokenBalance = await token.balanceOf(wallet.address);
    logTable('Initial State', {
        'Swap Amount (USD)': `$${amountUSD}`,
        'AVAX Price': `$${avaxPrice}`,
        'AVAX Amount': `${amountAVAX} AVAX`,
        'Current AVAX Balance': `${ethers.formatEther(balance)} AVAX`,
        'Current Token Balance': `${ethers.formatUnits(initialTokenBalance, await token.decimals())} Tokens`
    });
    // Wrap AVAX
    log('info', "Wrapping AVAX to WAVAX...");
    const wrapTx = await wavax.deposit({ value: requiredAVAX, gasLimit: GAS_LIMIT });
    await wrapTx.wait();
    log('info', "AVAX wrapped.");
    // Approve router
    const wavaxBalance = await wavax.balanceOf(wallet.address);
    log('info', "Approving router to spend WAVAX...");
    await approveTx.wait();
    log('info', "Router approved.");
    // Swap
    log('info', "Swapping WAVAX for Token...");
    const receipt = await swapTx.wait();
    // Final balances
    
    logTable('Swap Summary', {
        'Token In': `$${amountUSD} AVAX`,
        'Token Out': `${ethers.formatUnits(tokenReceived, await token.decimals())} Tokens`,
        'Token Out Value': `$${tokenValueUSD.toFixed(6)}`,
        'Transaction Hash': receipt.hash
    });
    return receipt.hash;
}

export async function swapTokenToAVAX(amountUSD: string, provider: ethers.JsonRpcProvider, wallet: ethers.Wallet) {
    await checkGasFeeBalance(amountUSD, provider, wallet);

    const tokenPrice = await getTokenPrice();
    
    if (initialTokenBalance < requiredTokens) {
        throw new Error(`INSUFFICIENT TOKEN BALANCE: Required ${ethers.formatUnits(requiredTokens, await token.decimals())} Tokens`);
    }
    // Approve
    log('info', "Approving router to spend Tokens...");
    await approveTx.wait();
    // Swap
    
    log('info', "Swapping Token for WAVAX...");
    const receipt = await swapTx.wait();
    logTable('Swap Summary', {
        'Token In': `$${amountUSD} worth of Tokens`,
        'Transaction Hash': receipt.hash
    });
    return receipt.hash;
}
