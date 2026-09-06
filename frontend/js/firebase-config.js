/* Firebase Project Configuration - Refinishing System */

const firebaseConfig = {
  apiKey: "AIzaSyDR9bI1yujFif30JOoSS828DBrJx9ecet8",
  authDomain: "refinishing-3ffac.firebaseapp.com",
  projectId: "refinishing-3ffac",
  storageBucket: "refinishing-3ffac.firebasestorage.app",
  messagingSenderId: "529233312363",
  appId: "1:529233312363:web:ea4b69ed5bafc0cf110f2e",
  measurementId: "G-M92RGYKH89"
};

// Expose configuration globally if needed
if (typeof window !== 'undefined') {
  window.firebaseConfig = firebaseConfig;
}
