"use client";

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Initialize Firebase only if API key is available
let db: any = null;

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (apiKey) {
  try {
    const firebaseConfig = {
      apiKey: apiKey,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);

  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  console.error("NEXT_PUBLIC_FIREBASE_API_KEY is not set. Firebase will not be initialized.");
}


export { db };
