import { jsonRpcProvider } from './provider/coredao';
import { ethers } from 'ethers';

export const edwardWallets = [
    new ethers.Wallet(process.env.EDWARD_KEY_1!, jsonRpcProvider),
];
