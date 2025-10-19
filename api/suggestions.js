const GoogleAppsScriptService = require('../services/googleAppsScriptService');

const settings = require('../shared/settings');

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { q } = req.query;

    if (!q || q.length < 2) {
        return res.status(200).json({ suggestions: [] });
    }

    if (!settings.sheets_url) {
        return res.status(200).json({ suggestions: [] });
    }

    try {
        const service = new GoogleAppsScriptService();
        const suggestions = await service.getSuggestions(settings.sheets_url, q, {
            searchColumn: settings.search_column || 'A'
        });

        res.status(200).json({ suggestions: suggestions || [] });

    } catch (error) {
        console.error('Suggestions error:', error);
        res.status(200).json({ suggestions: [] });
    }
};
