import { jsonRpcProvider } from './provider/coredao';
import { ethers } from 'ethers';

export const dustManagerWallet = {
    name: 'Dust Manager Account',
    wallet: new ethers.Wallet(process.env.DUST_MANAGER!, jsonRpcProvider),
};

export const dustBorrowWallets = [];

export const junkWallets = [
    {
        name: 'Edward Account 3',
        wallet: new ethers.Wallet(process.env.EDWARD_KEY_3!, jsonRpcProvider),
    },
    {
        name: 'Dust Borrower 5',
        wallet: new ethers.Wallet(process.env.DUST_KEY_5!, jsonRpcProvider),
    },
];
