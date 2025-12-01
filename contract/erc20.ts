import { ethers } from 'ethers';
import z from 'zod';
import { dustManagerWallet } from '../wallet';

const SUMMARY_WALLET_ADDRESS = dustManagerWallet;

export function erc20(tokenAddress: string, wallet: ethers.Wallet) {
    const contract = new ethers.Contract(
        tokenAddress,
        [
            'function balanceOf(address owner) view returns (uint256)',
            'function transfer(address to, uint256 amount) returns (bool)',
        ],
        wallet
    );

    return {
        transferTo: (to: string, amount: bigint) =>
            contract.transfer(to, amount),
        transferToSummary: async () => {
            const balance = await contract.balanceOf(wallet.address);
            const parsedBalance = z.bigint().parse(balance);

            if (parsedBalance > 0n) {
                await contract.transfer(SUMMARY_WALLET_ADDRESS, parsedBalance);
                return parsedBalance;
            }

            return 0n;
        },
    };
}
