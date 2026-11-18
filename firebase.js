import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyDCGmTPZpz14DXeIKYMe-n86LVe4Xsk3wo",
  authDomain: "handmade-haven-a0d96.firebaseapp.com",
  projectId: "handmade-haven-a0d96",
  storageBucket: "handmade-haven-a0d96.firebasestorage.app",
  messagingSenderId: "676645082137",
  appId: "1:676645082137:web:fc264af8fc2204095b4688",
  measurementId: "G-LFTZYTSRVN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
