import { jsonRpcProvider } from './provider/coredao';
import { ethers } from 'ethers';

export const dustManagerWallet = {
    name: 'Dust Manager Account',
    wallet: new ethers.Wallet(process.env.DUST_MANAGER!, jsonRpcProvider),
};

export const dustBorrowWallets = [
    {
        name: 'Dust Borrower 8',
        wallet: new ethers.Wallet(process.env.DUST_KEY_8!, jsonRpcProvider),
    },
];

export const junkWallets = [
    {
        name: 'Dust Borrower 6',
        wallet: new ethers.Wallet(process.env.DUST_KEY_6!, jsonRpcProvider),
    },
    {
        name: 'Dust Borrower 7',
        wallet: new ethers.Wallet(process.env.DUST_KEY_7!, jsonRpcProvider),
    },
];
