import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBQXv3LxqOG_QIvLj1fmQAuoG3i9A5phec",
  authDomain: "studio-383948813-8374a.firebaseapp.com",
  databaseURL: "https://studio-383948813-8374a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "studio-383948813-8374a",
  storageBucket: "studio-383948813-8374a.firebasestorage.app",
  messagingSenderId: "410698056183",
  appId: "1:410698056183:web:b73a5c315ddec4cb00aef2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
