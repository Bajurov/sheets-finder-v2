const { google } = require('googleapis');

class GoogleSheetsService {
    constructor() {
        this.apiKey = process.env.GOOGLE_SHEETS_API_KEY;
        this.sheets = google.sheets({ version: 'v4', auth: this.apiKey });
    }

    // Извлечь ID таблицы из URL
    extractSheetId(url) {
        const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        return match ? match[1] : null;
    }

    // Тест подключения к таблице
    async testConnection(url) {
        try {
            const sheetId = this.extractSheetId(url);
            if (!sheetId) {
                return { success: false, error: 'Неверный формат URL' };
            }

            // Получаем метаданные таблицы
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: sheetId
            });

            const spreadsheet = response.data;
            const sheets = spreadsheet.sheets || [];
            const sheetNames = sheets.map(sheet => sheet.properties.title);

            // Получаем количество строк из первого листа
            let totalRows = 0;
            if (sheets.length > 0) {
                const firstSheetName = sheets[0].properties.title;
                const valuesResponse = await this.sheets.spreadsheets.values.get({
                    spreadsheetId: sheetId,
                    range: `${firstSheetName}!A:Z`
                });
                totalRows = valuesResponse.data.values ? valuesResponse.data.values.length : 0;
            }

            return {
                success: true,
                rows: totalRows,
                sheets: sheets.length,
                sheetNames
            };
        } catch (error) {
            console.error('Ошибка тестирования подключения:', error);
            return {
                success: false,
                error: error.message || 'Ошибка подключения к таблице'
            };
        }
    }

    // Поиск в таблице
    async search(url, query, options = {}) {
        try {
            const sheetId = this.extractSheetId(url);
            if (!sheetId) {
                return { error: 'connection' };
            }

            const {
                searchColumn = 'A',
                resultColumns = 'B,C,D',
                page = 1,
                limit = 10
            } = options;

            // Получаем все данные из таблицы
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: 'A:Z' // Получаем все столбцы
            });

            const values = response.data.values;
            if (!values || values.length === 0) {
                return { data: [], page: 1, totalPages: 1, totalResults: 0 };
            }

            // Определяем индексы столбцов
            const searchColIndex = this.getColumnIndex(searchColumn);
            const resultColIndices = resultColumns.split(',').map(col => this.getColumnIndex(col.trim()));

            // Поиск совпадений
            const matches = [];
            const queryLower = query.toLowerCase();

            for (let i = 0; i < values.length; i++) {
                const row = values[i];
                if (!row || !row[searchColIndex]) continue;

                const cellValue = row[searchColIndex].toString().toLowerCase();
                if (cellValue.includes(queryLower)) {
                    const brand = row[searchColIndex];
                    const suppliers = resultColIndices
                        .map(index => row[index] || '')
                        .filter(supplier => supplier.trim() !== '');

                    matches.push({
                        brand,
                        suppliers
                    });
                }
            }

            // Пагинация
            const totalResults = matches.length;
            const totalPages = Math.ceil(totalResults / limit);
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedResults = matches.slice(startIndex, endIndex);

            return {
                data: paginatedResults,
                page,
                totalPages,
                totalResults
            };
        } catch (error) {
            console.error('Ошибка поиска:', error);
            return { error: 'connection' };
        }
    }

    // Получить подсказки для автодополнения
    async getSuggestions(url, query, options = {}) {
        try {
            const sheetId = this.extractSheetId(url);
            if (!sheetId) {
                return [];
            }

            const { searchColumn = 'A' } = options;

            // Получаем данные из столбца поиска
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: `${searchColumn}:${searchColumn}`
            });

            const values = response.data.values;
            if (!values || values.length === 0) {
                return [];
            }

            const queryLower = query.toLowerCase();
            const suggestions = new Set();

            // Ищем уникальные значения, начинающиеся с запроса
            for (const row of values) {
                if (row && row[0]) {
                    const value = row[0].toString();
                    if (value.toLowerCase().startsWith(queryLower)) {
                        suggestions.add(value);
                    }
                }
            }

            return Array.from(suggestions).slice(0, 10); // Максимум 10 подсказок
        } catch (error) {
            console.error('Ошибка получения подсказок:', error);
            return [];
        }
    }

    // Преобразовать букву столбца в индекс (A=0, B=1, etc.)
    getColumnIndex(column) {
        if (typeof column === 'number') return column;
        
        const col = column.toUpperCase();
        let index = 0;
        for (let i = 0; i < col.length; i++) {
            index = index * 26 + (col.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
        }
        return index - 1;
    }

    // Преобразовать индекс в букву столбца
    getColumnLetter(index) {
        let result = '';
        while (index >= 0) {
            result = String.fromCharCode(65 + (index % 26)) + result;
            index = Math.floor(index / 26) - 1;
        }
        return result;
    }
}

module.exports = GoogleSheetsService;
