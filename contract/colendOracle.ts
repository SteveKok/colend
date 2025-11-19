import { ethers } from 'ethers';
import { provider } from '../provider/coredao.js';
import z from 'zod';

const colendOracle = new ethers.Contract(
    '0x6b994Bdf6DFf79dB2Dac6eE1475b4d91B4AC1D97',
    ['function getAssetPrice(address asset) view returns (uint256)'],
    provider
);

const assetPriceSchema = z.bigint().transform((price) => Number(price) / 1e8);

export async function getAssetPrice(tokenAddress: string) {
    const result = await colendOracle.getAssetPrice(tokenAddress);
    return assetPriceSchema.parse(result);
}
