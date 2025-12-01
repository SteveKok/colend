import Colend from './contract/colendPoolDataProvider';
import Telegram from './output/telegram';
import { colendPoolProxy } from './contract/colendPoolProxy';
import { dustBorrowWallets, dustManagerWallet, junkWallets } from './wallet';
import { getAssetPrice } from './contract/colendOracle';
import { erc20 } from './contract/erc20';
import { wcore } from './contract/wcore';

await Colend.init();
await Telegram.init([
    '/alive',
    '/menu',
    '/summary',
    '/fullDetail',
    '/collect',
    '/unwrap',
    '/junkSummary',
]);

const junkColendPoolProxyInstances = junkWallets.map((wallet) => ({
    name: wallet.name,
    wallet: wallet.wallet,
    proxy: colendPoolProxy(wallet.wallet),
}));

const borrowColendPoolProxyInstances = dustBorrowWallets.map((wallet) => ({
    name: wallet.name,
    wallet: wallet.wallet,
    proxy: colendPoolProxy(wallet.wallet),
}));

const withdrawColendPoolProxyInstances = dustBorrowWallets.map((wallet) => ({
    name: wallet.name,
    wallet: wallet.wallet,
    proxy: colendPoolProxy(wallet.wallet),
}));

async function loop() {
    try {
        const borrowableTokens = await Colend.borrowableTokens([
            'USDC',
            'WBTC',
            'SolvBTC.b',
            'WETH',
            'BTCB',
            'USDT',
            'COREBTC',
            'stCORE',
        ]);
        const withdrawableTokens = await Colend.withdrawableTokens(['USDT']);

        const detectedCommmands = await Telegram.getUpdate();

        if (borrowableTokens.some((t) => t.bigintBorrowableAmount > 0n)) {
            const filteredTokens = borrowableTokens.filter(
                (t) => t.bigintBorrowableAmount > 0n
            );

            for (const token of filteredTokens) {
                const tokenPrice = await getAssetPrice(token.address);

                for (const colendPoolProxyInstance of borrowColendPoolProxyInstances) {
                    let bigintBorrowableAmount =
                        (token.bigintBorrowableAmount * 98n) / 100n;
                    let tx;

                    while (
                        (Number(bigintBorrowableAmount) /
                            10 ** Number(token.decimals)) *
                            tokenPrice >
                        10
                    ) {
                        try {
                            tx = await colendPoolProxyInstance.proxy.borrow(
                                token.address,
                                bigintBorrowableAmount
                            );

                            break;
                        } catch (error) {
                            const randomFactor = BigInt(
                                Math.floor(Math.random() * 20) + 70
                            );

                            bigintBorrowableAmount =
                                (bigintBorrowableAmount * randomFactor) / 100n;
                        }
                    }

                    if (!tx) {
                        continue;
                    }

                    const txReceipt = await tx.wait().catch((err: unknown) => {
                        // await Telegram.sendTelegram(JSON.stringify(err));
                        return { status: 0 };
                    });

                    if (txReceipt.status !== 1) {
                        continue;
                    }

                    let message = `🔥🔥🔥🔥🔥🔥🔥 <b>Borrowed ${Telegram.escapeHtml(
                        token.symbol
                    )}</b>\n`;
                    message += `💳 <b>Account:</b> <code>${Telegram.escapeHtml(
                        colendPoolProxyInstance.name
                    )}</code>\n`;
                    message += `➡️ <b>Amount:</b> <code>${Telegram.escapeHtml(
                        Number(bigintBorrowableAmount) /
                            10 ** Number(token.decimals)
                    )}</code>\n`;
                    message += `💰 Worth: <code>${Telegram.escapeHtml(
                        (Number(bigintBorrowableAmount) /
                            10 ** Number(token.decimals)) *
                            tokenPrice
                    )} USD</code>\n\n`;
                    message += `🆔 <b>Transaction Hash:</b> https://scan.coredao.org/tx/${Telegram.escapeHtml(
                        tx.hash
                    )}\n\n`;

                    await Telegram.sendTelegram(message);
                }
            }
        }

        if (withdrawableTokens.some((t) => t.bigintWithdrawableAmount > 0n)) {
            const filteredTokens = withdrawableTokens.filter(
                (t) => t.bigintWithdrawableAmount > 0n
            );

            for (const token of filteredTokens) {
                const tokenPrice = await getAssetPrice(token.address);

                for (const colendPoolProxyInstance of withdrawColendPoolProxyInstances) {
                    let bigintWithdrawableAmount =
                        (token.bigintWithdrawableAmount * 98n) / 100n;
                    let tx;

                    while (
                        (Number(bigintWithdrawableAmount) /
                            10 ** Number(token.decimals)) *
                            tokenPrice >
                        10
                    ) {
                        try {
                            tx = await colendPoolProxyInstance.proxy.withdraw(
                                token.address,
                                bigintWithdrawableAmount
                            );

                            break;
                        } catch (error) {
                            const randomFactor = BigInt(
                                Math.floor(Math.random() * 20) + 70
                            );

                            bigintWithdrawableAmount =
                                (bigintWithdrawableAmount * randomFactor) /
                                100n;
                        }
                    }

                    if (!tx) {
                        continue;
                    }

                    const txReceipt = await tx.wait().catch((err: unknown) => {
                        // await Telegram.sendTelegram(JSON.stringify(err));
                        return { status: 0 };
                    });

                    if (txReceipt.status !== 1) {
                        continue;
                    }

                    let message = `🔥🔥🔥🔥🔥🔥🔥 <b>Withdrawn ${Telegram.escapeHtml(
                        token.symbol
                    )}</b>\n`;
                    message += `💳 <b>Account:</b> <code>${Telegram.escapeHtml(
                        colendPoolProxyInstance.name
                    )}</code>\n`;
                    message += `➡️ <b>Amount:</b> <code>${Telegram.escapeHtml(
                        Number(bigintWithdrawableAmount) /
                            10 ** Number(token.decimals)
                    )}</code>\n`;
                    message += `💰 Worth: <code>${Telegram.escapeHtml(
                        (Number(bigintWithdrawableAmount) /
                            10 ** Number(token.decimals)) *
                            tokenPrice
                    )} USD</code>\n\n`;
                    message += `🆔 <b>Transaction Hash:</b> https://scan.coredao.org/tx/${Telegram.escapeHtml(
                        tx.hash
                    )}\n\n`;

                    await Telegram.sendTelegram(message);
                }
            }
        }

        for (const token of withdrawableTokens) {
            for (const colendPoolProxyInstance of junkColendPoolProxyInstances) {
                let bigintWithdrawableAmount =
                    await colendPoolProxyInstance.proxy.getWithdrawableUsdt();

                bigintWithdrawableAmount =
                    (bigintWithdrawableAmount * 98n) / 100n;

                let tx;

                let erc20Instance = erc20(
                    token.aTokenAddress,
                    colendPoolProxyInstance.wallet
                );

                while (bigintWithdrawableAmount > 10n * 10n ** 6n) {
                    try {
                        tx = await erc20Instance.transferTo(
                            dustManagerWallet.wallet.address,
                            bigintWithdrawableAmount
                        );
                    } catch (error) {
                        const randomFactor = BigInt(
                            Math.floor(Math.random() * 20) + 70
                        );

                        bigintWithdrawableAmount =
                            (bigintWithdrawableAmount * randomFactor) / 100n;
                    }
                }

                if (!tx) {
                    continue;
                }

                const txReceipt = await tx.wait().catch((err: unknown) => {
                    // await Telegram.sendTelegram(JSON.stringify(err));
                    return { status: 0 };
                });

                if (txReceipt.status !== 1) {
                    continue;
                }

                let message = `🏧🏧🏧🏧🏧🏧🏧 <b>Withdrawn aCoreUsdt from junk</b>\n`;
                message += `💳 <b>Account:</b> <code>${Telegram.escapeHtml(
                    colendPoolProxyInstance.name
                )}</code>\n`;
                message += `➡️ <b>Amount:</b> <code>${Telegram.escapeHtml(
                    Number(bigintWithdrawableAmount) / 1e6
                )}</code>\n\n`;
                message += `💳 <b>To Account:</b> <code>${Telegram.escapeHtml(
                    dustManagerWallet.name
                )}</code>\n`;
                message += `🆔 <b>Transaction Hash:</b> https://scan.coredao.org/tx/${Telegram.escapeHtml(
                    tx.hash
                )}\n\n`;

                await Telegram.sendTelegram(message);
            }
        }

        if (detectedCommmands.includes('/junkSummary')) {
            let message = '📥 <b>Withdrawable aCoreUSDT from junks</b>\n\n';

            for (const colendPoolProxyInstance of junkColendPoolProxyInstances) {
                const withdrawable =
                    await colendPoolProxyInstance.proxy.getWithdrawableUsdt();

                message += `💳 <b>Account:</b> <code>${Telegram.escapeHtml(
                    colendPoolProxyInstance.name
                )}</code>\n`;
                message += `➡️ <b>Amount:</b> <code>${Telegram.escapeHtml(
                    Math.max(Number(withdrawable) / 1e6, 0)
                )}</code>\n\n`;
            }

            await Telegram.sendTelegram(message);
        }

        if (detectedCommmands.includes('/unwrap')) {
            for (const wallet of dustBorrowWallets) {
                const wcoreInstance = wcore(wallet.wallet);
                const unwrap_amount = await wcoreInstance.unwrap();

                if (unwrap_amount > 0n) {
                    let message = `📥 <b>Unwrapped wCORE to CORE</b>\n`;
                    message += `💳 <b>Account:</b> <code>${Telegram.escapeHtml(
                        wallet.name
                    )}</code>\n`;
                    message += `➡️ <b>Amount:</b> <code>${Telegram.escapeHtml(
                        Number(unwrap_amount) / 1e18
                    )}</code>\n\n`;
                    await Telegram.sendTelegram(message);
                } else {
                }
            }
        }

        if (detectedCommmands.includes('/collect')) {
            const tokens = [...borrowableTokens, ...withdrawableTokens];
            for (const token of tokens) {
                for (const wallet of dustBorrowWallets) {
                    const erc20Instance = erc20(token.address, wallet.wallet);
                    const transferedBalance =
                        await erc20Instance.transferToSummary();
                    if (transferedBalance > 0n) {
                        let message = `📥 <b>Transferred ${Telegram.escapeHtml(
                            token.symbol
                        )} to Summary Wallet</b>\n`;
                        message += `💳 <b>From Account:</b> <code>${Telegram.escapeHtml(
                            wallet.name
                        )}</code>\n`;
                        message += `💳 <b>To Account:</b> <code>${Telegram.escapeHtml(
                            dustManagerWallet.name
                        )}</code>\n`;
                        message += `➡️ <b>Amount:</b> <code>${Telegram.escapeHtml(
                            Number(transferedBalance) /
                                10 ** Number(token.decimals)
                        )}</code>\n\n`;
                        await Telegram.sendTelegram(message);
                    }
                }
            }
        }

        if (detectedCommmands.includes('/alive')) {
            const message =
                'No worry, I am still alive and working properly...';
            await Telegram.sendTelegram(message);
        }

        if (detectedCommmands.includes('/menu')) {
            let message = '🤖 <b>Colend Bot Menu</b>\n\n';

            message += 'Available commands:\n';
            message += '/alive - Check if bot is alive\n';
            message +=
                '/collect - Transfer all borrowed tokens to summary wallet\n';
            message += '/menu - Show this menu\n';
            message +=
                '/summary - Show summary of borrowable and withdrawable amounts\n';
            message += '/fullDetail - Show full details of all tokens\n\n';
            message += '/unwrap - Unwrap wCORE to CORE\n\n';

            message +=
                'If borrowableTokens or withdrawableTokens are detected, bot will send updates automatically.';

            await Telegram.sendTelegram(message);
        }

        if (detectedCommmands.includes('/summary')) {
            let message = '📊 <b>Colend Summary</b>\n\n';

            borrowableTokens.forEach((token) => {
                message += `💰 <b>${Telegram.escapeHtml(
                    token.symbol
                )} Borrowable:</b> <code>${Telegram.escapeHtml(
                    token.borrowableAmount
                )}</code>\n`;
            });

            message += '\n';

            withdrawableTokens.forEach((token) => {
                message += `🏧 <b>${Telegram.escapeHtml(
                    token.symbol
                )} Withdrawable:</b> <code>${Telegram.escapeHtml(
                    token.withdrawableAmount
                )}</code>\n`;
            });

            await Telegram.sendTelegram(message);
        }

        if (detectedCommmands.includes('/fullDetail')) {
            let message = '📋 <b>Colend Full Details</b>\n\n';

            for (const token of borrowableTokens) {
                const tokenPrice = await getAssetPrice(token.address);

                message += `💰 <b>${Telegram.escapeHtml(token.symbol)}</b>\n`;
                message += `• Total Supplied: <code>${Telegram.escapeHtml(
                    token.totalSupplied
                )}</code>\n`;
                message += `• Total Borrowed: <code>${Telegram.escapeHtml(
                    token.totalBorrowed
                )}</code>\n`;
                message += `• Borrow Cap: <code>${Telegram.escapeHtml(
                    token.borrowCap
                )}</code>\n`;
                message += `• Liquidity: <code>${Telegram.escapeHtml(
                    token.liquidity
                )}</code>\n`;
                message += `• Price: <code>${Telegram.escapeHtml(
                    tokenPrice.toString()
                )} USD</code>\n`;
                message += `• Status: <b>${Telegram.escapeHtml(
                    token.status
                )}</b>\n`;
                message += `➡️ <b>Borrowable:</b> <code>${Telegram.escapeHtml(
                    token.borrowableAmount
                )}</code>\n\n`;
            }

            for (const token of withdrawableTokens) {
                const tokenPrice = await getAssetPrice(token.address);

                message += ` 🏧 <b>${Telegram.escapeHtml(token.symbol)}</b>\n`;
                message += `• Total Supplied: <code>${Telegram.escapeHtml(
                    token.totalSupplied
                )}</code>\n`;
                message += `• Total Borrowed: <code>${Telegram.escapeHtml(
                    token.totalBorrowed
                )}</code>\n`;
                message += `• Liquidity: <code>${Telegram.escapeHtml(
                    token.liquidity
                )}</code>\n`;
                message += `• Price: <code>${Telegram.escapeHtml(
                    tokenPrice.toString()
                )} USD</code>\n`;
                message += `• Status: <b>${Telegram.escapeHtml(
                    token.status
                )}</b>\n`;
                message += `➡️ <b>Withdrawable:</b> <code>${Telegram.escapeHtml(
                    token.withdrawableAmount
                )}</code>\n\n`;
            }

            await Telegram.sendTelegram(message);
        }
    } catch (error) {
        console.error('Error in main loop:', error);
    } finally {
        // Schedule next run
        setTimeout(loop, 1000);
    }
}

loop();
