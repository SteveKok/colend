import { ethers } from 'ethers';

function colendPoolProxy(wallet: ethers.Wallet) {
    const contract = new ethers.Contract(
        '0x0CEa9F0F49F30d376390e480ba32f903B43B19C5',
        [
            'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)',
        ],
        wallet
    );

    function borrow(asset: string, amount: bigint) {
        return contract.borrow(asset, amount, 2n, 0, wallet.address);
    }

    return {
        borrow,
    };
}

export { colendPoolProxy };
