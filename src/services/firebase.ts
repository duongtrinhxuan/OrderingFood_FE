import { initializeApp, FirebaseApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const getConfigValue = (key: string, fallback?: string) => {
  const value = process.env[`EXPO_PUBLIC_${key}`];
  if (value && value.length > 0) {
    return value;
  }
  return fallback ?? "";
};

const firebaseConfig = {
  apiKey: getConfigValue("FIREBASE_API_KEY"),
  authDomain: getConfigValue("FIREBASE_AUTH_DOMAIN"),
  projectId: getConfigValue("FIREBASE_PROJECT_ID"),
  storageBucket: getConfigValue("FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getConfigValue("FIREBASE_MESSAGING_SENDER_ID"),
  appId: getConfigValue("FIREBASE_APP_ID"),
};

// Validate Firebase config
const requiredKeys = [
  "FIREBASE_API_KEY",
  "FIREBASE_AUTH_DOMAIN",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_STORAGE_BUCKET",
];
const missingKeys = requiredKeys.filter((key) => !getConfigValue(key));
if (missingKeys.length > 0) {
  console.warn("Firebase config missing:", missingKeys.join(", "));
}

let app: FirebaseApp | undefined;

export const getFirebaseApp = () => {
  if (!app) {
    try {
      app = initializeApp(firebaseConfig);
      console.log("Firebase initialized successfully");
      console.log("Storage bucket:", firebaseConfig.storageBucket);
    } catch (error) {
      console.error("Firebase initialization error:", error);
      throw error;
    }
  }
  return app;
};

export const firebaseStorage = getStorage(getFirebaseApp());

// Helper function to convert base64 to Uint8Array (polyfill for atob if needed)
export const base64ToUint8Array = (base64: string): Uint8Array => {
  // Polyfill atob for React Native if needed
  const atobPolyfill = (str: string): string => {
    if (typeof atob !== "undefined") {
      return atob(str);
    }
    // Simple base64 decode polyfill
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let output = "";
    let i = 0;
    str = str.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    while (i < str.length) {
      const enc1 = chars.indexOf(str.charAt(i++));
      const enc2 = chars.indexOf(str.charAt(i++));
      const enc3 = chars.indexOf(str.charAt(i++));
      const enc4 = chars.indexOf(str.charAt(i++));
      const chr1 = (enc1 << 2) | (enc2 >> 4);
      const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      const chr3 = ((enc3 & 3) << 6) | enc4;
      output += String.fromCharCode(chr1);
      if (enc3 !== 64) output += String.fromCharCode(chr2);
      if (enc4 !== 64) output += String.fromCharCode(chr3);
    }
    return output;
  };

  const binaryString = atobPolyfill(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};
