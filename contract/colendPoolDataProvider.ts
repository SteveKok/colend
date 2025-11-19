import { ethers } from 'ethers';
import { provider } from '../provider/coredao.js';
import z from 'zod';

const colendPoolDataProvider = new ethers.Contract(
    '0x567af83d912c85c7a66d093e41d92676fa9076e3',
    [
        'function getAllReservesTokens() view returns (tuple(string symbol, address tokenAddress)[])',
        'function getAllATokens() view returns (tuple(string symbol, address tokenAddress)[])',
        'function getReserveCaps(address asset) view returns (uint256 borrowCap, uint256 supplyCap)',
        'function getReserveConfigurationData(address asset) view returns (uint256 decimals, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus, uint256 reserveFactor, bool usageAsCollateralEnabled, bool borrowingEnabled, bool stableBorrowRateEnabled, bool isActive, bool isFrozen)',
        'function getReserveData(address asset) view returns (uint256 unbacked, uint256 accruedToTreasuryScaled, uint256 totalAToken, uint256 totalStableDebt, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 lastUpdateTimestamp)',
    ],
    provider
);

const reserveTokenLiquidityChecker = (
    reserveTokenAddress: string,
    aTokenAddress: string
) => {
    const aToken = new ethers.Contract(
        aTokenAddress,
        ['function balanceOf(address account) view returns (uint256)'],
        provider
    );

    async function getLiquidity() {
        const balance: bigint = await aToken.balanceOf(reserveTokenAddress);
        return balance;
    }

    return getLiquidity;
};

const allTokensSchema = z.array(
    z.tuple([
        z.string(),
        z.string().refine((addr) => ethers.isAddress(addr), {
            message: 'Invalid address',
        }),
    ])
);

const reserveCapsSchema = z
    .tuple([z.bigint(), z.bigint()])
    .transform(([borrowCap, supplyCap]) => ({
        borrowCap,
        supplyCap,
    }));

const reserveConfigurationDataSchema = z
    .tuple([
        z.bigint(),
        z.bigint(),
        z.bigint(),
        z.bigint(),
        z.bigint(),
        z.boolean(),
        z.boolean(),
        z.boolean(),
        z.boolean(),
        z.boolean(),
    ])
    .transform(
        ([
            decimals,
            ltv,
            liquidationThreshold,
            liquidationBonus,
            reserveFactor,
            usageAsCollateralEnabled,
            borrowingEnabled,
            stableBorrowRateEnabled,
            isActive,
            isFrozen,
        ]) => ({
            decimals,
            ltv,
            liquidationThreshold,
            liquidationBonus,
            reserveFactor,
            usageAsCollateralEnabled,
            borrowingEnabled,
            stableBorrowRateEnabled,
            isActive,
            isFrozen,
        })
    );

const reserveDataSchema = z
    .tuple([
        z.bigint(),
        z.bigint(),
        z.bigint(),
        z.bigint(),
        z.bigint(),
        z.bigint(),
        z.bigint(),
        z.bigint(),
        z.bigint(),
        z.bigint(),
        z.bigint(),
        z.bigint(),
    ])
    .transform(
        ([
            unbacked,
            accruedToTreasuryScaled,
            totalAToken,
            totalStableDebt,
            totalVariableDebt,
            liquidityRate,
            variableBorrowRate,
            stableBorrowRate,
            averageStableBorrowRate,
            liquidityIndex,
            variableBorrowIndex,
            lastUpdateTimestamp,
        ]) => ({
            unbacked,
            accruedToTreasuryScaled,
            totalAToken,
            totalStableDebt,
            totalVariableDebt,
            liquidityRate,
            variableBorrowRate,
            stableBorrowRate,
            averageStableBorrowRate,
            liquidityIndex,
            variableBorrowIndex,
            lastUpdateTimestamp,
        })
    );

type TokenData = {
    symbol: string;
    tokenAddress: string;
    reserveCap: z.infer<typeof reserveCapsSchema>;
    reserveConfig: z.infer<typeof reserveConfigurationDataSchema>;
    borrowCap: bigint;
    getLiquidity: () => Promise<bigint>;
};

const tokenData: TokenData[] = [];

async function init() {
    const tokens = await colendPoolDataProvider
        .getAllReservesTokens()
        .then((tokens) => allTokensSchema.parse(tokens));

    const aTokens = await colendPoolDataProvider
        .getAllATokens()
        .then((tokens) => allTokensSchema.parse(tokens));

    for (const [index, [symbol, tokenAddress]] of tokens.entries()) {
        const reserveCap = await colendPoolDataProvider
            .getReserveCaps(tokenAddress)
            .then((data) => reserveCapsSchema.parse(data));

        const reserveConfig = await colendPoolDataProvider
            .getReserveConfigurationData(tokenAddress)
            .then((data) => reserveConfigurationDataSchema.parse(data));

        const borrowCap = reserveCap.borrowCap * 10n ** reserveConfig.decimals;

        const [, aTokenAddress] = aTokens[index];

        tokenData.push({
            symbol,
            tokenAddress,
            reserveCap,
            reserveConfig,
            borrowCap,
            getLiquidity: reserveTokenLiquidityChecker(
                tokenAddress,
                aTokenAddress
            ),
        });
    }
}

function humanReadableAmount(amount: bigint, decimals: bigint): string {
    return (Number(amount) / 10 ** Number(decimals)).toString();
}

async function borrowableTokens(excludedTokenSymbol: string[] = []) {
    const borrowable = tokenData.filter(
        (token) =>
            token.reserveConfig.borrowingEnabled &&
            token.reserveConfig.isActive &&
            !token.reserveConfig.isFrozen &&
            !excludedTokenSymbol.includes(token.symbol)
    );

    const results = [];

    for (const token of borrowable) {
        const reserveData = await colendPoolDataProvider
            .getReserveData(token.tokenAddress)
            .then((data) => reserveDataSchema.parse(data));

        const totalSupplied = reserveData.totalAToken;

        const totalBorrowed =
            reserveData.totalVariableDebt + reserveData.totalStableDebt;

        const liquidity = await token.getLiquidity();

        if (
            totalBorrowed >=
            token.reserveCap.borrowCap * 10n ** token.reserveConfig.decimals
        ) {
            results.push({
                symbol: token.symbol,
                totalSupplied: humanReadableAmount(
                    totalSupplied,
                    token.reserveConfig.decimals
                ),
                totalBorrowed: humanReadableAmount(
                    totalBorrowed,
                    token.reserveConfig.decimals
                ),
                borrowCap: humanReadableAmount(
                    token.borrowCap,
                    token.reserveConfig.decimals
                ),
                liquidity: humanReadableAmount(
                    liquidity,
                    token.reserveConfig.decimals
                ),
                borrowableAmount: humanReadableAmount(
                    0n,
                    token.reserveConfig.decimals
                ),
                address: token.tokenAddress,
                bigintBorrowableAmount: 0n,
                decimals: token.reserveConfig.decimals,
                status: 'Reached borrow cap',
            });

            continue;
        }

        if (totalSupplied <= totalBorrowed) {
            results.push({
                symbol: token.symbol,
                totalSupplied: humanReadableAmount(
                    totalSupplied,
                    token.reserveConfig.decimals
                ),
                totalBorrowed: humanReadableAmount(
                    totalBorrowed,
                    token.reserveConfig.decimals
                ),
                borrowCap: humanReadableAmount(
                    token.borrowCap,
                    token.reserveConfig.decimals
                ),
                liquidity: humanReadableAmount(
                    liquidity,
                    token.reserveConfig.decimals
                ),
                borrowableAmount: humanReadableAmount(
                    0n,
                    token.reserveConfig.decimals
                ),
                address: token.tokenAddress,
                bigintBorrowableAmount: 0n,
                decimals: token.reserveConfig.decimals,
                status: 'No liquidity',
            });

            continue;
        }

        const maxBorrowableBasedOnBorrowCap =
            token.reserveCap.borrowCap * 10n ** token.reserveConfig.decimals -
            totalBorrowed;

        const borrowableAmount =
            maxBorrowableBasedOnBorrowCap < liquidity
                ? maxBorrowableBasedOnBorrowCap
                : liquidity;

        results.push({
            symbol: token.symbol,
            totalSupplied: humanReadableAmount(
                totalSupplied,
                token.reserveConfig.decimals
            ),
            totalBorrowed: humanReadableAmount(
                totalBorrowed,
                token.reserveConfig.decimals
            ),
            borrowCap: humanReadableAmount(
                token.borrowCap,
                token.reserveConfig.decimals
            ),
            liquidity: humanReadableAmount(
                liquidity,
                token.reserveConfig.decimals
            ),
            borrowableAmount: humanReadableAmount(
                borrowableAmount,
                token.reserveConfig.decimals
            ),
            address: token.tokenAddress,
            bigintBorrowableAmount: borrowableAmount,
            decimals: token.reserveConfig.decimals,
            status: 'Available to borrow',
        });
    }

    return results;
}

async function withdrawableTokens(filterByTokenSymbol: string[] = []) {
    const withdrawableTokens = tokenData.filter(
        (token) =>
            !token.reserveConfig.isFrozen &&
            (filterByTokenSymbol.length === 0 ||
                filterByTokenSymbol.includes(token.symbol))
    );

    const results = [];

    for (const token of withdrawableTokens) {
        const reserveData = await colendPoolDataProvider
            .getReserveData(token.tokenAddress)
            .then((data) => reserveDataSchema.parse(data));

        const totalSupplied = reserveData.totalAToken;

        const totalBorrowed =
            reserveData.totalVariableDebt + reserveData.totalStableDebt;

        const liquidity = await token.getLiquidity();

        const withdrawableAmount = liquidity > 0n ? liquidity : 0n;

        results.push({
            symbol: token.symbol,
            totalSupplied: humanReadableAmount(
                totalSupplied,
                token.reserveConfig.decimals
            ),
            totalBorrowed: humanReadableAmount(
                totalBorrowed,
                token.reserveConfig.decimals
            ),
            liquidity: humanReadableAmount(
                liquidity,
                token.reserveConfig.decimals
            ),
            withdrawableAmount: humanReadableAmount(
                withdrawableAmount,
                token.reserveConfig.decimals
            ),
            address: token.tokenAddress,
            bigintWithdrawableAmount: withdrawableAmount,
            decimals: token.reserveConfig.decimals,
            status:
                withdrawableAmount > 0n
                    ? 'Available to withdraw'
                    : 'No liquidity',
        });
    }

    return results;
}

const Colend = {
    tokenData,
    init,
    borrowableTokens,
    withdrawableTokens,
};

export default Colend;
