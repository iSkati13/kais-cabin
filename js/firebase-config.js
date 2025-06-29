// Firebase Configuration
// This file contains the Firebase configuration for Kai's Cabin
// IMPORTANT: The API key is safe to expose in frontend code when properly restricted

const firebaseConfig = {
  apiKey: "AIzaSyCVnzUCtkX-24cOBOZoJ2FyZJHEIGAp-8s",
  authDomain: "kais-cabin-admin.firebaseapp.com",
  projectId: "kais-cabin-admin",
  storageBucket: "kais-cabin-admin.firebasestorage.app",
  messagingSenderId: "425186271736",
  appId: "1:425186271736:web:fb17e1d9752047077e360d",
  measurementId: "G-6XC2710XE3"
};

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { firebaseConfig };
}

// Make available globally for non-module scripts
if (typeof window !== 'undefined') {
  window.firebaseConfig = firebaseConfig;
} 