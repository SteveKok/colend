let updateOffset = 0;
const commands: string[] = [];

function escapeHtml(html: string | number) {
    return String(html)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

async function init(c: string[]) {
    commands.push(...c);
    await getUpdate();
}

async function getUpdate() {
    const telegram_token = process.env.TELEGRAM_TOKEN;
    const telegram_chat_id = process.env.TELEGRAM_CHAT_ID;

    if (!telegram_token || !telegram_chat_id) {
        throw new Error(
            'Telegram token or chat ID not set. Cannot get updates from Telegram.'
        );
    }

    const data = await fetch(
        `https://api.telegram.org/bot${telegram_token}/getUpdates?offset=${
            updateOffset + 1
        }`
    ).then((res) => res.json());

    const detectedCommands: string[] = [];

    for (const update of data.result) {
        updateOffset = update.update_id;

        if (!update.message) continue;

        const chat_id = String(update.message.chat.id);
        const text = update.message.text?.trim();

        if (chat_id == telegram_chat_id && commands.includes(text || '')) {
            detectedCommands.push(text!);
        }
    }

    return detectedCommands;
}

async function sendTelegram(html: string) {
    const telegram_token = process.env.TELEGRAM_TOKEN;
    const telegram_chat_id = process.env.TELEGRAM_CHAT_ID;

    if (!telegram_token || !telegram_chat_id) {
        console.log(
            'Telegram token or chat ID not set. Skipping Telegram message.'
        );
        return;
    }

    try {
        await fetch(
            `https://api.telegram.org/bot${telegram_token}/sendMessage`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: telegram_chat_id,
                    text: html,
                    parse_mode: 'HTML',
                }),
            }
        );
    } catch (err) {
        console.log('Failed to send Telegram message:', err);
    }
}

const Telegram = {
    init,
    escapeHtml,
    getUpdate,
    sendTelegram,
};

export default Telegram;
