// Hardcoded admin ID
const ADMIN_ID = 699759380;

// In-memory "database"
const users = new Map();

// Add hardcoded admin
users.set(ADMIN_ID, {
    id: 1,
    telegram_id: ADMIN_ID,
    username: 'admin',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    created_at: new Date().toISOString()
});

console.log(`Администратор добавлен с ID: ${ADMIN_ID}`);

module.exports = (req, res) => {
    console.log('Auth request:', req.body);

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { telegramId, username, firstName, lastName } = req.body;

    if (!telegramId) {
        return res.json({ authorized: false });
    }

    const user = users.get(parseInt(telegramId));

    if (!user) {
        return res.json({ authorized: false });
    }

    // Update user info (in-memory)
    user.username = username || user.username;
    user.first_name = firstName || user.first_name;
    user.last_name = lastName || user.last_name;

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
        authorized: true,
        user: {
            id: user.id,
            telegram_id: user.telegram_id,
            username: user.username,
            role: user.role
        }
    });
};
