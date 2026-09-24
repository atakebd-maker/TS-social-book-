/**
 * TS Social Book - Firebase Configuration & Abstraction Layer
 * 
 * =========================================================================
 * 🚨 FIREBASE CONNECTION NOTICE
 * =========================================================================
 * Firebase is NOT connected automatically. You can connect your own Firebase
 * project whenever you are ready!
 * 
 * To connect your Firebase project:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project named "TS Social Book"
 * 3. Add a Web App in Project Settings
 * 4. Copy the config values into your `.env` file (see .env.example)
 *    or replace the placeholder values below.
 * 5. See `/FIREBASE_SETUP.md` for the complete step-by-step setup guide.
 * =========================================================================
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const firebaseConfig: FirebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || "YOUR_FIREBASE_API_KEY",
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || "YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || "YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || "YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || "YOUR_FIREBASE_APP_ID"
};

/**
 * Checks whether real Firebase credentials have been supplied by the project owner.
 * If false, TS Social Book seamlessly operates in high-fidelity local state mode.
 */
export function isFirebaseConfigured(): boolean {
  return (
    Boolean(firebaseConfig.apiKey) &&
    firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY" &&
    Boolean(firebaseConfig.projectId) &&
    firebaseConfig.projectId !== "YOUR_FIREBASE_PROJECT_ID"
  );
}
