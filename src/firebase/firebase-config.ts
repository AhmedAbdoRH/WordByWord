"use client";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Initialize db to null
export let db: any = null;

// Check for missing environment variables
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId || !measurementId) {
  console.error("Missing Firebase configuration values. Ensure all NEXT_PUBLIC_FIREBASE_* environment variables are set.");
  // Return null to prevent the app from crashing
  throw new Error("Firebase config is missing")
} else {
  // TODO: Replace with your app's Firebase project configuration
  // See: https://firebase.google.com/docs/web/setup#config-object
  const firebaseConfig = {
    apiKey: apiKey,
    authDomain: authDomain,
    projectId: projectId,
    storageBucket: storageBucket,
    messagingSenderId: messagingSenderId,
    appId: appId,
    measurementId: measurementId
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  // Initialize Cloud Firestore and get a reference to the service
  db = getFirestore(app);
}
