const XLSX = require('xlsx');

const workbook = XLSX.readFile('test_data/commisiion sample.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

console.log('Total rows:', data.length);
console.log('\nColumn headers:');
if (data.length > 0) {
    Object.keys(data[0]).forEach((key, i) => {
        console.log(`${i + 1}. "${key}" (trimmed: "${key.trim()}")`);
    });
}

console.log('\nFirst 2 rows:');
console.log(JSON.stringify(data.slice(0, 2), null, 2));
