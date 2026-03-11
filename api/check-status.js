// Prüft Status des Quick Login
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { code, privateKey } = req.body;

        if (!code || !privateKey) {
            return res.status(400).json({ error: 'Code and privateKey required' });
        }

        const BOT_COOKIE = process.env.ROBLOX_COOKIE;

        // CSRF Token holen
        const csrfResponse = await fetch('https://auth.roblox.com/v2/logout', {
            method: 'POST',
            headers: {
                'Cookie': `.ROBLOSECURITY=${BOT_COOKIE}`
            }
        });

        const csrfToken = csrfResponse.headers.get('x-csrf-token');

        // Status abfragen
        const statusResponse = await fetch('https://apis.roblox.com/auth-token-service/v1/login/status', {
            method: 'POST',
            headers: {
                'Cookie': `.ROBLOSECURITY=${BOT_COOKIE}`,
                'x-csrf-token': csrfToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code, privateKey })
        });

        const statusData = await statusResponse.json();

        res.status(200).json({
            success: true,
            status: statusData.status, // "Created", "UserLinked", "Validated", "Cancelled"
            expirationTime: statusData.expirationTime
        });

    } catch (error) {
        console.error('Status Check Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}
