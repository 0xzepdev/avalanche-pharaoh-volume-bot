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
    const approveTx = await wavax.approve(PHARAOH_ROUTER, wavaxBalance);
    await approveTx.wait();
    log('info', "Router approved.");
    // Swap
    const deadline = Math.floor(Date.now() / 1000) + 600;
    const path = ethers.solidityPacked(
        ['address', 'uint24', 'address'],
        [WAVAX, 3000, TARGET_TOKEN]
    );
    const params = { path, recipient: wallet.address, deadline, amountIn: wavaxBalance, amountOutMinimum: 0 };
    log('info', "Swapping WAVAX for Token...");
    const swapTx = await router.exactInput(params, { gasLimit: GAS_LIMIT });
    const receipt = await swapTx.wait();
    // Final balances
    const finalTokenBalance = await token.balanceOf(wallet.address);
    const tokenReceived = finalTokenBalance - initialTokenBalance;
    const tokenPrice = await getTokenPrice();
    const tokenValueUSD = Number(ethers.formatUnits(tokenReceived, await token.decimals())) * tokenPrice;
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
    const requiredTokenAmount = (Number(amountUSD) / tokenPrice).toFixed(6);

    const router = new Contract(PHARAOH_ROUTER, ROUTER_ABI, wallet);
    // const wavax = new Contract(WAVAX, WAVAX_ABI, wallet);
    const token = new Contract(TARGET_TOKEN, TOKEN_ABI, wallet);

    const initialTokenBalance = await token.balanceOf(wallet.address);
    const requiredTokens = parseUnits(requiredTokenAmount, await token.decimals());
    if (initialTokenBalance < requiredTokens) {
        throw new Error(`INSUFFICIENT TOKEN BALANCE: Required ${ethers.formatUnits(requiredTokens, await token.decimals())} Tokens`);
    }
    // Approve
    log('info', "Approving router to spend Tokens...");
    const approveTx = await token.approve(PHARAOH_ROUTER, requiredTokens, { gasLimit: GAS_LIMIT });
    await approveTx.wait();
    // Swap
    const block = await provider.getBlock('latest');
    const deadline = (block?.timestamp || Math.floor(Date.now() / 1000)) + 300;
    const params = {
        tokenIn: TARGET_TOKEN,
        tokenOut: WAVAX,
        fee: 3000,
        recipient: wallet.address,
        deadline,
        amountIn: requiredTokens,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0
    };
    log('info', "Swapping Token for WAVAX...");
    const swapTx = await router.exactInputSingle(params, { gasLimit: GAS_LIMIT });
    const receipt = await swapTx.wait();
    logTable('Swap Summary', {
        'Token In': `$${amountUSD} worth of Tokens`,
        'Transaction Hash': receipt.hash
    });
    return receipt.hash;
}
