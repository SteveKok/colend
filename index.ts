import Colend from './contract/colendPoolDataProvider';
import Telegram from './output/telegram';
import { colendPoolProxy } from './contract/colendPoolProxy';
import { edwardWallets } from './wallet';
import { steveWallets } from './wallet';
import { getAssetPrice } from './contract/colendOracle';
import { erc20 } from './contract/erc20';

await Colend.init();
await Telegram.init(['/alive', '/menu', '/summary', '/fullDetail', '/collect']);

const borrowColendPoolProxyInstances = [edwardWallets[4]].map((wallet) => ({
    name: wallet.name,
    proxy: colendPoolProxy(wallet.wallet),
}));

const withdrawColendPoolProxyInstances = [
    edwardWallets[4],
    steveWallets[1],
].map((wallet) => ({
    name: wallet.name,
    proxy: colendPoolProxy(wallet.wallet),
}));

async function loop() {
    try {
        const borrowableTokens = await Colend.borrowableTokens([
            'USDT',
            'COREBTC',
            'stCORE',
        ]);
        const withdrawableTokens = await Colend.withdrawableTokens(['USDT']);

        const detectedCommmands = await Telegram.getUpdate();

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

                    Telegram.sendTelegram(message);
                }
            }
        }

        for (const wallet of [
            edwardWallets[0],
            edwardWallets[1],
            edwardWallets[2],
            edwardWallets[3],
        ]) {
            for (const token of withdrawableTokens) {
                const erc20Instance = erc20(token.aTokenAddress, wallet.wallet);

                let amountToTransfer = 10000n * 10n ** token.decimals;
                let tx;

                while (amountToTransfer > 10n * 10n ** token.decimals) {
                    try {
                        tx = await erc20Instance.transferTo(
                            edwardWallets[4].wallet.address,
                            amountToTransfer
                        );

                        break;
                    } catch (error) {
                        amountToTransfer = (amountToTransfer * 7n) / 10n;
                    }
                }

                if (!tx) {
                    continue;
                }

                const txReceipt = await tx.wait();

                console.log(txReceipt);

                if (txReceipt.status !== 1) {
                    continue;
                }

                let message = `📤 <b>Transferred aUSDT</b>\n`;
                message += `💳 <b>From Account:</b> <code>${Telegram.escapeHtml(
                    wallet.name
                )}</code>\n`;
                message += `💳 <b>To Account:</b> <code>${Telegram.escapeHtml(
                    edwardWallets[4].name
                )}</code>\n`;
                message += `➡️ <b>Amount:</b> <code>${Telegram.escapeHtml(
                    Number(amountToTransfer) / 10 ** Number(token.decimals)
                )}</code>\n\n`;

                Telegram.sendTelegram(message);
            }
        }

        for (const wallet of [steveWallets[0]]) {
            for (const token of withdrawableTokens) {
                const erc20Instance = erc20(token.aTokenAddress, wallet.wallet);

                let amountToTransfer = 1000n * 10n ** token.decimals;
                let tx;

                while (amountToTransfer > 10n * 10n ** token.decimals) {
                    try {
                        tx = await erc20Instance.transferTo(
                            steveWallets[1].wallet.address,
                            amountToTransfer
                        );

                        break;
                    } catch (error) {
                        amountToTransfer = (amountToTransfer * 7n) / 10n;
                    }
                }

                if (!tx) {
                    continue;
                }

                const txReceipt = await tx.wait();

                console.log(txReceipt);

                if (txReceipt.status !== 1) {
                    continue;
                }

                let message = `📤 <b>Transferred aUSDT</b>\n`;
                message += `💳 <b>From Account:</b> <code>${Telegram.escapeHtml(
                    wallet.name
                )}</code>\n`;
                message += `💳 <b>To Account:</b> <code>${Telegram.escapeHtml(
                    steveWallets[1].name
                )}</code>\n`;
                message += `➡️ <b>Amount:</b> <code>${Telegram.escapeHtml(
                    Number(amountToTransfer) / 10 ** Number(token.decimals)
                )}</code>\n\n`;

                Telegram.sendTelegram(message);
            }
        }

        if (detectedCommmands.includes('/collect')) {
            const tokens = [...borrowableTokens, ...withdrawableTokens];
            for (const token of tokens) {
                for (const wallet of [
                    edwardWallets[0],
                    edwardWallets[1],
                    edwardWallets[2],
                    edwardWallets[4],
                ]) {
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
                            edwardWallets[3].name
                        )}</code>\n`;
                        message += `➡️ <b>Amount:</b> <code>${Telegram.escapeHtml(
                            Number(transferedBalance) /
                                10 ** Number(token.decimals)
                        )}</code>\n\n`;
                        Telegram.sendTelegram(message);
                    }
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
            message +=
                '/collect - Transfer all borrowed tokens to summary wallet\n';
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
