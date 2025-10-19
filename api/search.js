const GoogleAppsScriptService = require('../services/googleAppsScriptService');

const settings = require('../shared/settings');

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { query, page = 1 } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Запрос обязателен' });
    }

    if (!settings.sheets_url) {
        return res.status(400).json({ 
            error: 'connection',
            message: 'Таблица не настроена. Обратитесь к администратору.'
        });
    }

    try {
        const service = new GoogleAppsScriptService();
        const result = await service.search(settings.sheets_url, query, {
            searchColumn: settings.search_column || 'A',
            resultColumns: settings.result_columns || 'B,C,D',
            page: parseInt(page),
            limit: 10
        });

        if (result.error) {
            return res.status(500).json({
                error: 'connection',
                message: 'Ошибка соединения с таблицей'
            });
        }

        res.status(200).json({
            results: result.data || [],
            page: result.page || 1,
            totalPages: result.totalPages || 1,
            totalResults: result.totalResults || 0
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            error: 'connection',
            message: 'Ошибка соединения с таблицей'
        });
    }
};
