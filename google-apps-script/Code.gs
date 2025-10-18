/**
 * Google Apps Script для Sheets Finder
 * Разместите этот код в Google Apps Script (script.google.com)
 */

// Основная функция для поиска
function searchInSheet(query, searchColumn = 'A', resultColumns = 'B,C,D') {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length === 0) {
      return {
        success: false,
        error: 'Таблица пуста'
      };
    }
    
    // Определяем индексы столбцов
    const searchColIndex = getColumnIndex(searchColumn);
    const resultColIndices = resultColumns.split(',').map(col => getColumnIndex(col.trim()));
    
    const results = [];
    const queryLower = query.toLowerCase();
    
    // Поиск по всем строкам
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[searchColIndex]) continue;
      
      const cellValue = row[searchColIndex].toString().toLowerCase();
      if (cellValue.includes(queryLower)) {
        const brand = row[searchColIndex];
        const suppliers = resultColIndices
          .map(index => row[index] || '')
          .filter(supplier => supplier.toString().trim() !== '');
        
        results.push({
          brand: brand,
          suppliers: suppliers
        });
      }
    }
    
    return {
      success: true,
      data: results,
      totalResults: results.length
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Функция для получения подсказок
function getSuggestions(query, searchColumn = 'A') {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length === 0) {
      return {
        success: false,
        suggestions: []
      };
    }
    
    const searchColIndex = getColumnIndex(searchColumn);
    const queryLower = query.toLowerCase();
    const suggestions = new Set();
    
    // Ищем уникальные значения, начинающиеся с запроса
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row && row[searchColIndex]) {
        const value = row[searchColIndex].toString();
        if (value.toLowerCase().startsWith(queryLower)) {
          suggestions.add(value);
        }
      }
    }
    
    return {
      success: true,
      suggestions: Array.from(suggestions).slice(0, 10)
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Функция для тестирования подключения
function testConnection() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    const sheetName = sheet.getName();
    
    return {
      success: true,
      rows: data.length,
      sheetName: sheetName,
      message: 'Подключение успешно'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Вспомогательная функция для преобразования буквы столбца в индекс
function getColumnIndex(column) {
  if (typeof column === 'number') return column;
  
  const col = column.toUpperCase();
  let index = 0;
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + (col.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return index - 1;
}

// Функция для получения информации о таблице
function getSheetInfo() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const data = sheet.getDataRange().getValues();
    
    return {
      success: true,
      sheetName: sheet.getName(),
      spreadsheetName: spreadsheet.getName(),
      rows: data.length,
      columns: data.length > 0 ? data[0].length : 0,
      url: spreadsheet.getUrl()
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}
