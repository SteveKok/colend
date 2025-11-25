import { ethers } from 'ethers';
import z from 'zod';

export function wcore(wallet: ethers.Wallet) {
    const contract = new ethers.Contract(
        '0x40375C92d9FAf44d2f9db9Bd9ba41a3317a2404f',
        [
            'function balanceOf(address owner) view returns (uint256)',
            'function withdraw(uint256 wad) public',
        ],
        wallet
    );

    return {
        unwrap: async () => {
            const balance = await contract.balanceOf(wallet.address);
            const parsedBalance = z.bigint().parse(balance);

            if (parsedBalance > 0n) {
                await contract.withdraw(parsedBalance);
                return parsedBalance;
            }

            return 0n;
        },
    };
}
