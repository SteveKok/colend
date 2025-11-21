import { jsonRpcProvider } from './provider/coredao';
import { ethers } from 'ethers';

export const edwardWallets = [
    {
        name: 'Edward Account 1',
        wallet: new ethers.Wallet(process.env.EDWARD_KEY_1!, jsonRpcProvider),
    },
    {
        name: 'Edward Account 2',
        wallet: new ethers.Wallet(process.env.EDWARD_KEY_2!, jsonRpcProvider),
    },
];

export const steveWallets = [
    {
        name: 'Steve Account 1',
        wallet: new ethers.Wallet(process.env.STEVE_KEY_1!, jsonRpcProvider),
    },
];
