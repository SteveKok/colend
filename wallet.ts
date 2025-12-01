import { jsonRpcProvider } from './provider/coredao';
import { ethers } from 'ethers';

export const dustManagerWallet = {
    name: 'Dust Manager Account',
    wallet: new ethers.Wallet(process.env.DUST_MANAGER!, jsonRpcProvider),
};

export const dustBorrowWallets = [
    {
        name: 'Dust Borrower 2',
        wallet: new ethers.Wallet(process.env.DUST_KEY_2!, jsonRpcProvider),
    },
];

export const junkWallets = [
    {
        name: 'Edward Account 1',
        wallet: new ethers.Wallet(process.env.EDWARD_KEY_1!, jsonRpcProvider),
    },
    {
        name: 'Edward Account 2',
        wallet: new ethers.Wallet(process.env.EDWARD_KEY_2!, jsonRpcProvider),
    },
    {
        name: 'Edward Account 3',
        wallet: new ethers.Wallet(process.env.EDWARD_KEY_3!, jsonRpcProvider),
    },
    {
        name: 'Edward Account 4',
        wallet: new ethers.Wallet(process.env.EDWARD_KEY_4!, jsonRpcProvider),
    },
    {
        name: 'Edward Account 5',
        wallet: new ethers.Wallet(process.env.EDWARD_KEY_5!, jsonRpcProvider),
    },
    {
        name: 'Steve Account 1',
        wallet: new ethers.Wallet(process.env.STEVE_KEY_1!, jsonRpcProvider),
    },
    {
        name: 'Aescobar Account 1',
        wallet: new ethers.Wallet(process.env.AESCOBAR_KEY_1!, jsonRpcProvider),
    },
    {
        name: 'Aescobar Account 2',
        wallet: new ethers.Wallet(process.env.AESCOBAR_KEY_2!, jsonRpcProvider),
    },
    {
        name: 'Dust Borrower 1',
        wallet: new ethers.Wallet(process.env.DUST_KEY_1!, jsonRpcProvider),
    },
];
