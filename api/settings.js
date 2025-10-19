const settings = require('../shared/settings');

module.exports = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET') {
        return res.status(200).json(settings);
    }

    if (req.method === 'POST') {
        const { sheets_url, search_column, result_columns } = req.body;
        settings.sheets_url = sheets_url;
        settings.search_column = search_column;
        settings.result_columns = result_columns;
        return res.status(200).json({ success: true, settings });
    }

    res.status(405).json({ error: 'Method not allowed' });
};
