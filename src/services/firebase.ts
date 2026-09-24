import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: appletConfig.apiKey,
  authDomain: appletConfig.authDomain,
  projectId: appletConfig.projectId,
  storageBucket: appletConfig.storageBucket,
  messagingSenderId: appletConfig.messagingSenderId,
  appId: appletConfig.appId
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Use auto-detect long-polling to prevent WebSocket connection failures in iframes and preview environments
export const db = appletConfig.firestoreDatabaseId
  ? initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true
      },
      appletConfig.firestoreDatabaseId
    )
  : initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true
    });
