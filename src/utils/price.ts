import axios from 'axios';
import { TARGET_TOKEN } from '../contracts/addresses';
import { log } from './logger';

export async function getAVAXPrice(): Promise<number> {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd');
        const data = response.data as Record<string, { usd: number }>;
        const price = data['avalanche-2']?.usd;
        if (price) return price;
        log('warn', "AVAX price not found, using fallback.");
        return 18.50;
    } catch {
        log('warn', "Failed to fetch AVAX price, using fallback.");
        return 18.50;
    }
}

export async function getTokenPrice(): Promise<number> {
    try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/avalanche?contract_addresses=${TARGET_TOKEN}&vs_currencies=usd`);
        const data = response.data as Record<string, { usd: number }>;
        const price = data[TARGET_TOKEN.toLowerCase()]?.usd;
        if (price) return price;
        log('warn', "Token price not found, using fallback.");
        return 0.9992;
    } catch {
        log('warn', "Failed to fetch token price, using fallback.");
        return 0.9992;
    }
}
