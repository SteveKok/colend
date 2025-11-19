import Colend from './contract/colendPoolDataProvider';
import Telegram from './output/telegram';
import { colendPoolProxy } from './contract/colendPoolProxy';
import { edwardWallets } from './wallet';
import { steveWallets } from './wallet';
import { getAsset } from 'node:sea';
import { getAssetPrice } from './contract/colendOracle';

await Colend.init();
await Telegram.init(['/alive', '/menu', '/summary', '/fullDetail']);

const edwardColendPoolProxyInstances = edwardWallets.map((wallet) =>
    colendPoolProxy(wallet)
);
const allColendPoolProxyInstances = [...edwardWallets, ...steveWallets].map(
    (wallet) => colendPoolProxy(wallet)
);

async function loop() {
    try {
        const borrowableTokens = await Colend.borrowableTokens(['USDT']);
        const withdrawableTokens = await Colend.withdrawableTokens(['USDT']);

        const detectedCommmands = await Telegram.getUpdate();

        if (withdrawableTokens.some((t) => t.bigintWithdrawableAmount > 0n)) {
            const filteredTokens = withdrawableTokens.filter(
                (t) => t.bigintWithdrawableAmount > 0n
            );

            for (const token of filteredTokens) {
                const tokenPrice = await getAssetPrice(token.address);

                for (const colendPoolProxyInstance of allColendPoolProxyInstances) {
                    let bigintWithdrawableAmount =
                        (token.bigintWithdrawableAmount * 8n) / 10n;
                    let tx;

                    while (
                        (Number(bigintWithdrawableAmount) /
                            10 ** Number(token.decimals)) *
                            tokenPrice >
                        10
                    ) {
                        try {
                            tx = await colendPoolProxyInstance.withdraw(
                                token.address,
                                bigintWithdrawableAmount
                            );

                            break;
                        } catch (error) {
                            bigintWithdrawableAmount =
                                (bigintWithdrawableAmount * 8n) / 10n;
                        }
                    }

                    if (!tx) {
                        continue;
                    }

                    const txReceipt = await tx.wait();

                    if (txReceipt.status !== 1) {
                        continue;
                    }

                    let message = `🔥🔥🔥🔥🔥🔥🔥 <b>Withdrawn ${Telegram.escapeHtml(
                        token.symbol
                    )}</b>\n`;
                    message += `➡️ <b>Amount:</b> <code>${Telegram.escapeHtml(
                        Number(bigintWithdrawableAmount) /
                            10 ** Number(token.decimals)
                    )}</code>\n\n`;
                    message += `🆔 <b>Transaction Hash:</b> https://scan.coredao.org/tx/${Telegram.escapeHtml(
                        tx.hash
                    )}\n\n`;

                    Telegram.sendTelegram(message);
                }
            }
        }

        if (borrowableTokens.some((t) => t.bigintBorrowableAmount > 0n)) {
            const filteredTokens = borrowableTokens.filter(
                (t) => t.bigintBorrowableAmount > 0n
            );

            for (const token of filteredTokens) {
                const tokenPrice = await getAssetPrice(token.address);

                for (const colendPoolProxyInstance of edwardColendPoolProxyInstances) {
                    let bigintBorrowableAmount =
                        (token.bigintBorrowableAmount * 8n) / 10n;
                    let tx;

                    while (
                        (Number(bigintBorrowableAmount) /
                            10 ** Number(token.decimals)) *
                            tokenPrice >
                        10
                    ) {
                        try {
                            tx = await colendPoolProxyInstance.borrow(
                                token.address,
                                bigintBorrowableAmount
                            );

                            break;
                        } catch (error) {
                            bigintBorrowableAmount =
                                (bigintBorrowableAmount * 8n) / 10n;
                        }
                    }

                    if (!tx) {
                        continue;
                    }

                    const txReceipt = await tx.wait();

                    if (txReceipt.status !== 1) {
                        continue;
                    }

                    let message = `🔥🔥🔥🔥🔥🔥🔥 <b>Borrowed ${Telegram.escapeHtml(
                        token.symbol
                    )}</b>\n`;
                    message += `➡️ <b>Amount:</b> <code>${Telegram.escapeHtml(
                        Number(bigintBorrowableAmount) /
                            10 ** Number(token.decimals)
                    )}</code>\n\n`;
                    message += `🆔 <b>Transaction Hash:</b> https://scan.coredao.org/tx/${Telegram.escapeHtml(
                        tx.hash
                    )}\n\n`;

                    Telegram.sendTelegram(message);
                }
            }
        }

        if (detectedCommmands.includes('/alive')) {
            const message =
                'No worry, I am still alive and working properly...';
            Telegram.sendTelegram(message);
        }

        if (detectedCommmands.includes('/menu')) {
            let message = '🤖 <b>Colend Bot Menu</b>\n\n';

            message += 'Available commands:\n';
            message += '/alive - Check if bot is alive\n';
            message += '/menu - Show this menu\n';
            message +=
                '/summary - Show summary of borrowable and withdrawable amounts\n';
            message += '/fullDetail - Show full details of all tokens\n\n';

            message +=
                'If borrowableTokens or withdrawableTokens are detected, bot will send updates automatically.';

            Telegram.sendTelegram(message);
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

            Telegram.sendTelegram(message);
        }

        if (detectedCommmands.includes('/fullDetail')) {
            let message = '📋 <b>Colend Full Details</b>\n\n';
            borrowableTokens.forEach((token) => {
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
                message += `• Status: <b>${Telegram.escapeHtml(
                    token.status
                )}</b>\n`;
                message += `➡️ <b>Borrowable:</b> <code>${Telegram.escapeHtml(
                    token.borrowableAmount
                )}</code>\n\n`;
            });

            withdrawableTokens.forEach((token) => {
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
                message += `• Status: <b>${Telegram.escapeHtml(
                    token.status
                )}</b>\n`;
                message += `➡️ <b>Withdrawable:</b> <code>${Telegram.escapeHtml(
                    token.withdrawableAmount
                )}</code>\n\n`;
            });

            Telegram.sendTelegram(message);
        }
    } catch (error) {
        console.error('Error in main loop:', error);
    } finally {
        // Schedule next run
        setTimeout(loop, 1000);
    }
}

loop();
