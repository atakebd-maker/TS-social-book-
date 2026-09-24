# TS Social Book — Firebase Setup & Connection Guide

This guide provides full step-by-step instructions to connect your own Firebase project to **TS Social Book**.

The codebase is built with a **modular Service-Repository architecture**. All services (`authService`, `userService`, `postService`, `reactionService`, `storyService`, `friendService`, `reportService`, `settingsService`, `storageService`) already implement asynchronous Promise-based contracts that mirror the Firebase SDK.

---

## 📋 Table of Contents

1. [Create a Firebase Project](#1-create-a-firebase-project)
2. [Enable Firebase Authentication](#2-enable-firebase-authentication)
3. [Provision Cloud Firestore](#3-provision-cloud-firestore)
4. [Firestore Security Rules Template](#4-firestore-security-rules-template)
5. [Provision Firebase Cloud Storage](#5-provision-firebase-cloud-storage)
6. [Storage Security Rules Template](#6-storage-security-rules-template)
7. [Configure Environment Variables](#7-configure-environment-variables)
8. [Connecting the Firebase SDK](#8-connecting-the-firebase-sdk)
9. [Firestore Composite Indexes](#9-firestore-composite-indexes)

---

## 1. Create a Firebase Project

1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Enter your project name, for example: `ts-social-book-prod`.
4. Choose whether to enable Google Analytics (optional), then click **Create project**.
5. Once your project is ready, click **Continue**.
6. On the Project Overview page, click the **Web icon (`</>`)** to register a web application.
7. Set App nickname (e.g. `TS Social Book Web`), leave Firebase Hosting unchecked for now, and click **Register app**.
8. You will see a `firebaseConfig` snippet containing your keys. Keep this window open or copy the values.

---

## 2. Enable Firebase Authentication

1. In the Firebase Console left sidebar, click **Build > Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab:
   - Click **Email/Password**:
     - Toggle **Email/Password** to **Enabled**.
     - (Optional) Toggle **Email link (passwordless sign-in)** if desired.
     - Click **Save**.
   - Click **Google** (Optional for 1-click Google Sign In):
     - Toggle **Enabled**.
     - Select support email.
     - Click **Save**.

---

## 3. Provision Cloud Firestore

1. In the left sidebar, click **Build > Firestore Database**.
2. Click **Create database**.
3. Choose a location closest to your users (e.g. `us-central1`, `asia-south1`, or `europe-west1`).
4. Select **Start in production mode** (we will apply hardened security rules in Step 4).
5. Click **Create**.

---

## 4. Firestore Security Rules Template

Go to **Firestore Database > Rules** tab, paste the following rules, and click **Publish**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isAuthenticated() && 
        (request.auth.token.role == 'admin' || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    // 1. Users collection
    match /users/{userId} {
      allow read: if true; // Public profiles
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    // 2. Posts collection
    match /posts/{postId} {
      allow read: if resource.data.privacy == 'public' ||
                  (isAuthenticated() && (resource.data.authorId == request.auth.uid || isAdmin())) ||
                  (resource.data.privacy == 'friends' && isAuthenticated());
      allow create: if isAuthenticated() && request.resource.data.authorId == request.auth.uid;
      allow update: if isAuthenticated() && (
        // Author updating content
        (resource.data.authorId == request.auth.uid) ||
        // Other users adding reactions or comments
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['reactions', 'reactionsCount', 'commentsCount', 'sharesCount']) ||
        isAdmin()
      );
      allow delete: if (isAuthenticated() && resource.data.authorId == request.auth.uid) || isAdmin();

      // Post comments sub-collection
      match /comments/{commentId} {
        allow read: if true;
        allow create: if isAuthenticated() && request.resource.data.authorId == request.auth.uid;
        allow update: if isAuthenticated() && (
          resource.data.authorId == request.auth.uid ||
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes', 'replies']) ||
          isAdmin()
        );
        allow delete: if (isAuthenticated() && resource.data.authorId == request.auth.uid) || isAdmin();
      }
    }

    // 3. Stories collection (24-hour expiration)
    match /stories/{storyId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.authorId == request.auth.uid;
      allow update: if isAuthenticated(); // For viewer tracking
      allow delete: if (isAuthenticated() && resource.data.authorId == request.auth.uid) || isAdmin();
    }

    // 4. Friendships & Friend Requests
    match /friendRequests/{requestId} {
      allow read: if isAuthenticated() && (resource.data.senderId == request.auth.uid || resource.data.receiverId == request.auth.uid);
      allow create: if isAuthenticated() && request.resource.data.senderId == request.auth.uid;
      allow update, delete: if isAuthenticated() && (resource.data.senderId == request.auth.uid || resource.data.receiverId == request.auth.uid);
    }

    // 5. Notifications collection
    match /notifications/{notificationId} {
      allow read, update, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated();
    }

    // 6. Reports (Moderation Queue)
    match /reports/{reportId} {
      allow create: if isAuthenticated();
      allow read, update, delete: if isAdmin();
    }

    // 7. Activity logs (Private to user)
    match /activityLogs/{logId} {
      allow read, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated();
    }
  }
}
```

---

## 5. Provision Firebase Cloud Storage

1. In the left sidebar, click **Build > Storage**.
2. Click **Get Started**.
3. Choose **Start in production mode**.
4. Select location and click **Done**.

---

## 6. Storage Security Rules Template

Go to **Storage > Rules** tab, paste the following rules, and click **Publish**:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // User avatars and cover photos
    match /users/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 15 * 1024 * 1024 // 15MB max
                   && request.resource.contentType.matches('image/.*');
    }

    // Post media (Images & short videos)
    match /posts/{postId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 50 * 1024 * 1024 // 50MB max
                   && (request.resource.contentType.matches('image/.*') || 
                       request.resource.contentType.matches('video/.*'));
    }

    // Story media
    match /stories/{storyId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.resource.size < 50 * 1024 * 1024
                   && (request.resource.contentType.matches('image/.*') || 
                       request.resource.contentType.matches('video/.*'));
    }
  }
}
```

---

## 7. Configure Environment Variables

Create or update your `.env` file in the root directory with the values from your Firebase Web App configuration:

```bash
# Firebase Credentials (VITE_ prefixed for Vite React app)
VITE_FIREBASE_API_KEY="AIzaSyYourActualApiKeyHere..."
VITE_FIREBASE_AUTH_DOMAIN="ts-social-book-prod.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="ts-social-book-prod"
VITE_FIREBASE_STORAGE_BUCKET="ts-social-book-prod.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef123456"
VITE_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"
```

---

## 8. Connecting the Firebase SDK

When you are ready to switch from local persistent demo mode to live Firebase:

1. Install the official Firebase SDK:
   ```bash
   npm install firebase
   ```

2. Open `src/services/firebase-config.ts` and initialize the Firebase app:
   ```typescript
   import { initializeApp, getApps, getApp } from 'firebase/app';
   import { getAuth } from 'firebase/auth';
   import { getFirestore } from 'firebase/firestore';
   import { getStorage } from 'firebase/storage';

   const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
   export const auth = getAuth(app);
   export const db = getFirestore(app);
   export const storage = getStorage(app);
   export const isFirebaseConfigured = true;
   ```

3. In `src/services/authService.ts`, uncomment the Firebase Authentication methods (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `signOut`, `onAuthStateChanged`).

4. In `src/services/postService.ts`, uncomment the Firestore calls (`collection(db, "posts")`, `getDocs`, `addDoc`, `updateDoc`).

---

## 9. Firestore Composite Indexes

For optimal query performance with filters, add the following composite indexes in **Firestore > Indexes**:

| Collection ID | Fields Indexed | Query Scope |
|---|---|---|
| `posts` | `privacy` (ASC), `createdAt` (DESC) | Collection |
| `posts` | `authorId` (ASC), `createdAt` (DESC) | Collection |
| `notifications` | `userId` (ASC), `createdAt` (DESC) | Collection |
| `stories` | `expiresAt` (ASC), `createdAt` (DESC) | Collection |
| `activityLogs` | `userId` (ASC), `createdAt` (DESC) | Collection |

---

*Enjoy building and scaling with TS Social Book!*
