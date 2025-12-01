import { ethers } from 'ethers';
import { z } from 'zod';

const userAccountDataSchema = z
    .tuple([
        z.bigint(), // totalCollateralBase
        z.bigint(), // totalDebtBase
        z.bigint(), // availableBorrowsBase
        z.bigint(), // currentLiquidationThreshold
        z.bigint(), // ltv
        z.bigint(), // healthFactor
    ])
    .transform(
        ([
            totalCollateralBase,
            totalDebtBase,
            availableBorrowsBase,
            currentLiquidationThreshold,
            ltv,
            healthFactor,
        ]) => {
            return {
                totalCollateralBase,
                totalDebtBase,
                availableBorrowsBase,
                currentLiquidationThreshold,
                ltv,
                healthFactor,
            };
        }
    );

function colendPoolProxy(wallet: ethers.Wallet) {
    const contract = new ethers.Contract(
        '0x0CEa9F0F49F30d376390e480ba32f903B43B19C5',
        [
            'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)',
            'function getUserAccountData(address user) view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
            'function withdraw(address asset, uint256 amount, address to)',
        ],
        wallet
    );

    async function getWithdrawableUsdt() {
        const data = await contract
            .getUserAccountData(wallet.address)
            .then((data) => userAccountDataSchema.parse(data));

        const withdrawableCollateral =
            (data.totalCollateralBase * data.currentLiquidationThreshold) /
                10000n -
            data.totalDebtBase;

        return withdrawableCollateral / 100n;
    }

    function borrow(asset: string, amount: bigint) {
        return contract.borrow(asset, amount, 2n, 0, wallet.address);
    }

    function withdraw(asset: string, amount: bigint) {
        return contract.withdraw(asset, amount, wallet.address);
    }

    return {
        borrow,
        withdraw,
        getWithdrawableUsdt,
    };
}

export { colendPoolProxy };
