const fs = require('fs');
const path = require('path');
const { firestoreDb, isRealFirebase } = require('../config/firebase');

const LOCAL_DB_PATH = path.join(__dirname, '../../database/local-firestore.json');

// Ensure database directory exists
const dbDir = path.dirname(LOCAL_DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Load local database
function readLocalDb() {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify({}, null, 2));
    return {};
  }
  try {
    const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.error('Error reading local DB file:', err);
    return {};
  }
}

// Write local database
function writeLocalDb(data) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing local DB file:', err);
  }
}

class DbService {
  // Get all documents in a collection
  async getCollection(collectionName) {
    if (isRealFirebase && firestoreDb) {
      const snapshot = await firestoreDb.collection(collectionName).get();
      const results = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });
      return results;
    } else {
      const db = readLocalDb();
      const col = db[collectionName] || {};
      return Object.keys(col).map(id => ({ id, ...col[id] }));
    }
  }

  // Get a single document by ID
  async getDocument(collectionName, docId) {
    if (isRealFirebase && firestoreDb) {
      const doc = await firestoreDb.collection(collectionName).doc(docId).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } else {
      const db = readLocalDb();
      const col = db[collectionName] || {};
      if (!col[docId]) return null;
      return { id: docId, ...col[docId] };
    }
  }

  // Set or overwrite a document
  async setDocument(collectionName, docId, data, merge = true) {
    const now = new Date().toISOString();
    const payload = {
      ...data,
      updatedAt: data.updatedAt || now,
      createdAt: data.createdAt || now
    };

    if (isRealFirebase && firestoreDb) {
      await firestoreDb.collection(collectionName).doc(docId).set(payload, { merge });
      return { id: docId, ...payload };
    } else {
      const db = readLocalDb();
      if (!db[collectionName]) db[collectionName] = {};
      
      if (merge && db[collectionName][docId]) {
        db[collectionName][docId] = {
          ...db[collectionName][docId],
          ...payload,
          createdAt: db[collectionName][docId].createdAt || payload.createdAt,
          updatedAt: now
        };
      } else {
        db[collectionName][docId] = payload;
      }
      
      writeLocalDb(db);
      return { id: docId, ...db[collectionName][docId] };
    }
  }

  // Delete a document
  async deleteDocument(collectionName, docId) {
    if (isRealFirebase && firestoreDb) {
      await firestoreDb.collection(collectionName).doc(docId).delete();
      return true;
    } else {
      const db = readLocalDb();
      if (db[collectionName] && db[collectionName][docId]) {
        delete db[collectionName][docId];
        writeLocalDb(db);
        return true;
      }
      return false;
    }
  }

  // Query documents with filter array: [{ field, op, value }]
  async queryCollection(collectionName, filters = [], sortField = null, sortOrder = 'asc') {
    if (isRealFirebase && firestoreDb) {
      let ref = firestoreDb.collection(collectionName);
      filters.forEach(f => {
        ref = ref.where(f.field, f.op || '==', f.value);
      });
      if (sortField) {
        ref = ref.orderBy(sortField, sortOrder);
      }
      const snapshot = await ref.get();
      const results = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });
      return results;
    } else {
      let items = await this.getCollection(collectionName);
      
      // Apply filters
      if (filters.length > 0) {
        items = items.filter(item => {
          return filters.every(f => {
            const val = item[f.field];
            const target = f.value;
            const op = f.op || '==';
            
            if (op === '==') return val === target;
            if (op === '!=') return val !== target;
            if (op === '>') return val > target;
            if (op === '>=') return val >= target;
            if (op === '<') return val < target;
            if (op === '<=') return val <= target;
            if (op === 'in') return Array.isArray(target) && target.includes(val);
            return false;
          });
        });
      }

      // Sort
      if (sortField) {
        items.sort((a, b) => {
          const valA = a[sortField] || '';
          const valB = b[sortField] || '';
          if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
          if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      }

      return items;
    }
  }
}

module.exports = new DbService();
