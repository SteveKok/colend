import Colend from './contract/colendPoolDataProvider';
import Telegram from './output/telegram';
import { colendPoolProxy } from './contract/colendPoolProxy';
import { edwardWallets } from './wallet';

await Colend.init();
await Telegram.init(['/alive', '/menu', '/summary', '/fullDetail']);

const wallet = edwardWallets[0];
const colendPoolProxyInstance = colendPoolProxy(wallet);

async function loop() {
    try {
        const borrowableTokens = await Colend.borrowableTokens(['USDT']);
        const withdrawableTokens = await Colend.withdrawableTokens(['USDT']);

        const detectedCommmands = await Telegram.getUpdate();

        if (borrowableTokens.some((t) => t.bigintBorrowableAmount > 0n)) {
            const filteredTokens = borrowableTokens.filter(
                (t) => t.bigintBorrowableAmount > 0n
            );

            for (const token of filteredTokens) {
                let bigintBorrowableAmount = token.bigintBorrowableAmount;
                let tx;

                while (bigintBorrowableAmount > 0n) {
                    try {
                        tx = await colendPoolProxyInstance.borrow(
                            token.address,
                            bigintBorrowableAmount
                        );

                        break;
                    } catch (error) {
                        bigintBorrowableAmount /= 2n;
                    }
                }

                if (!tx) {
                    continue;
                }

                let message = `🚀 <b>Borrowed ${Telegram.escapeHtml(
                    token.symbol
                )}</b>\n`;
                message += `➡️ <b>Amount:</b> <code>${Telegram.escapeHtml(
                    Number(bigintBorrowableAmount) /
                        10 ** Number(token.decimals)
                )}</code>\n\n`;
                message += `🆔 <b>Transaction Hash:</b> <code>https://scan.coredao.org/tx/${Telegram.escapeHtml(
                    tx.hash
                )}</code>\n\n`;

                await Telegram.sendTelegram(message);
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
            message += '/menu - Show this menu\n';
            message +=
                '/summary - Show summary of borrowable and withdrawable amounts\n';
            message += '/fullDetail - Show full details of all tokens\n\n';

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

            await Telegram.sendTelegram(message);
        }

        if (
            withdrawableTokens.some((t) => t.status === 'Available to withdraw')
        ) {
            let message =
                '🔥🔥🔥🔥🔥🔥🔥 <b>Colend Withdrawable Amounts Update</b>\n\n';

            withdrawableTokens.forEach((token) => {
                if (token.status === 'Available to withdraw') {
                    message += `🏧 <b>${Telegram.escapeHtml(
                        token.symbol
                    )}</b>\n`;
                    message += `➡️ <b>Withdrawable:</b> <code>${Telegram.escapeHtml(
                        token.withdrawableAmount
                    )}</code>\n\n`;
                }
            });

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
