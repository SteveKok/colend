import { jsonRpcProvider } from './provider/coredao';
import { ethers } from 'ethers';

export const edwardWallets = [
    new ethers.Wallet(process.env.EDWARD_KEY_1!, jsonRpcProvider),
];

export const steveWallets = [
    new ethers.Wallet(process.env.STEVE_KEY_1!, jsonRpcProvider),
];
