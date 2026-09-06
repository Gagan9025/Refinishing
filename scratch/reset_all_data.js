const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/local-firestore.json');

if (!fs.existsSync(DB_PATH)) {
  console.log('Database file not found!');
  process.exit(1);
}

const raw = fs.readFileSync(DB_PATH, 'utf-8');
const db = JSON.parse(raw || '{}');

console.log('Clearing all production and attendance data...');

// Keep users and employees, clear/reset all production & attendance collections
db.scanningProduction = {};
db.batchProduction = {};
db.dispatchProduction = {};
db.attendance = {};

// Save back to local-firestore.json
fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

console.log('✅ Successfully reset all scanning, batch, and attendance data to 0.');
