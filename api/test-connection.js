const GoogleAppsScriptService = require('../services/googleAppsScriptService');

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL обязателен' });
    }

    try {
        const service = new GoogleAppsScriptService();
        const result = await service.testConnection(url);
        
        if (result.success) {
            res.status(200).json({
                success: true,
                rows: result.rows,
                sheetName: result.sheetName,
                message: result.message
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка подключения: ' + error.message
        });
    }
};
