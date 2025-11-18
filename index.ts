import { de } from 'zod/v4/locales';
import Colend from './contract/colend';
import Telegram from './output/telegram';

await Colend.init();
await Telegram.init(['/alive', '/menu', '/summary', '/fullDetail']);

async function loop() {
    try {
        const borrowableTokens = await Colend.borrowableTokens();
        const withdrawableTokens = await Colend.withdrawableTokens(['USDT']);

        const detectedCommmands = await Telegram.getUpdate();

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

        if (borrowableTokens.some((t) => t.status === 'Available to borrow')) {
            let message =
                '🔥🔥🔥🔥🔥🔥🔥  <b>Colend Borrowable Amounts Update</b>\n\n';

            borrowableTokens.forEach((token) => {
                if (token.status === 'Available to borrow') {
                    message += `💰 <b>${Telegram.escapeHtml(
                        token.symbol
                    )} Borrowable:</b> <code>${Telegram.escapeHtml(
                        token.borrowableAmount
                    )}</code>\n`;
                }
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
