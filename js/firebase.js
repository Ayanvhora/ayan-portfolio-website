// Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBHu01Bf8tlrUKOHFd33ceDRULE1fI2ymo",
  authDomain: "ayan-portfolio-83aac.firebaseapp.com",
  projectId: "ayan-portfolio-83aac",
  storageBucket: "ayan-portfolio-83aac.firebasestorage.app",
  messagingSenderId: "988214347736",
  appId: "1:988214347736:web:c485c44e682bf67396d4ad"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
const auth = getAuth(app);
const db = getFirestore(app);

// Export
export { auth, db };