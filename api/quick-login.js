// Roblox Quick Login Token erstellen
export default async function handler(req, res) {
    // Nur POST erlauben
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email required' });
        }

        // 1. BOT hat eigenen Roblox-Account
        const BOT_COOKIE = process.env.ROBLOX_COOKIE; // In Vercel env setzen!

        // 2. CSRF Token holen (wichtig für Roblox)
        const csrfResponse = await fetch('https://auth.roblox.com/v2/logout', {
            method: 'POST',
            headers: {
                'Cookie': `.ROBLOSECURITY=${BOT_COOKIE}`
            }
        });

        const csrfToken = csrfResponse.headers.get('x-csrf-token');

        // 3. Quick Login Token erstellen
        const tokenResponse = await fetch('https://apis.roblox.com/auth-token-service/v1/login/create', {
            method: 'POST',
            headers: {
                'Cookie': `.ROBLOSECURITY=${BOT_COOKIE}`,
                'x-csrf-token': csrfToken,
                'Content-Type': 'application/json'
            }
        });

        const tokenData = await tokenResponse.json();

        if (!tokenData.code || !tokenData.privateKey) {
            throw new Error('Failed to create quick login token');
        }

        // 4. Token + privateKey zurückgeben
        res.status(200).json({
            success: true,
            code: tokenData.code,        // 6-stelliger Code für Roblox
            privateKey: tokenData.privateKey, // Unser Geheimnis
            expiresIn: '5 minutes'
        });

    } catch (error) {
        console.error('Quick Login Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}
