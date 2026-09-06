const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

let admin = null;
let firestoreDb = null;
let isRealFirebase = false;

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDR9bI1yujFif30JOoSS828DBrJx9ecet8",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "refinishing-3ffac.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "refinishing-3ffac",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "refinishing-3ffac.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "529233312363",
  appId: process.env.FIREBASE_APP_ID || "1:529233312363:web:ea4b69ed5bafc0cf110f2e",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-M92RGYKH89"
};

try {
  const adminPkg = require('firebase-admin');
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
    const serviceAccount = require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH));
    adminPkg.initializeApp({
      credential: adminPkg.credential.cert(serviceAccount)
    });
    firestoreDb = adminPkg.firestore();
    isRealFirebase = true;
    console.log('[Firebase] Initialized with Service Account JSON file');
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const jsonStr = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(jsonStr);
    adminPkg.initializeApp({
      credential: adminPkg.credential.cert(serviceAccount)
    });
    firestoreDb = adminPkg.firestore();
    isRealFirebase = true;
    console.log('[Firebase] Initialized with Base64 Service Account');
  } else {
    console.log(`[Firebase] Configured for project: ${firebaseConfig.projectId}`);
    console.log('[Firebase] Using built-in persistent Firestore emulator engine. (To connect directly to live Firestore server-side, add FIREBASE_SERVICE_ACCOUNT_PATH to .env)');
  }
  admin = adminPkg;
} catch (err) {
  console.log('[Firebase] Setup notice:', err.message);
}

module.exports = {
  admin,
  firestoreDb,
  isRealFirebase,
  firebaseConfig
};
