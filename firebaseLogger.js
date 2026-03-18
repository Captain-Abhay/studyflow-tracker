// firebaseLogger.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔑 SAME CONFIG AS CODELOG
const firebaseConfig = {
  apiKey: "AIzaSyDyiEp0F7R-VvzAiuWZKCrKvJmtqEcomK0",
  authDomain: "devtrack-a611d.firebaseapp.com",
  projectId: "devtrack-a611d",
  storageBucket: "devtrack-a611d.firebasestorage.app",
  messagingSenderId: "512121871414",
  appId: "1:512121871414:web:0895f4f85548e7a9300c97"
};

// 🔥 INIT (singleton pattern)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🧠 Helper: extract category
function extractCategory(label) {
  return label.split(':')[0].trim();
}

// 🧠 Helper: get today's date
function getToday() {
  return new Date().toISOString().split('T')[0];
}

// 🚀 MAIN FUNCTION (exported)
export async function logToFirebase(label) {
  const user = localStorage.getItem("uid"); // must exist from CodeLog login
  if (!user) {
    console.warn("No user UID found. Skipping Firebase log.");
    return;
  }

  try {
    await addDoc(collection(db, "entries"), {
      title: label,
      category: extractCategory(label),
      note: "Auto logged from StudyFlow",
      date: getToday(),
      timestamp: new Date().toISOString(),
      user: user
    });

    console.log("✅ Logged to Firebase:", label);

  } catch (e) {
    console.error("❌ Firebase log failed:", e);
  }
}