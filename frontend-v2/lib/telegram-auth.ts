import crypto from 'crypto';

interface User {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    photo_url?: string;
}

interface ValidatedData {
    user: User;
    auth_date: number;
    query_id?: string;
    hash: string;
}

export function validateTelegramWebAppData(initData: string): ValidatedData | null {
    if (!process.env.BOT_TOKEN) {
        throw new Error('BOT_TOKEN is not set');
    }

    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');

    if (!hash) {
        return null;
    }

    urlParams.delete('hash');

    const params = Array.from(urlParams.entries());
    params.sort((a, b) => a[0].localeCompare(b[0]));

    const dataCheckString = params.map(([key, value]) => `${key}=${value}`).join('\n');

    const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(process.env.BOT_TOKEN)
        .digest();

    const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

    if (calculatedHash === hash) {
        const userString = urlParams.get('user');
        const user = userString ? JSON.parse(userString) : null;
        const auth_date = parseInt(urlParams.get('auth_date') || '0');
        const query_id = urlParams.get('query_id') || undefined;

        return {
            user,
            auth_date,
            query_id,
            hash
        };
    }

    return null;
}
