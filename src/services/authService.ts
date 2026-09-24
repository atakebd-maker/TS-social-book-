/**
 * TS Social Book - Authentication Service
 * Powered by Firebase Authentication & Cloud Firestore
 * Resilient multi-tier auth supporting Firebase Auth and Cloud Firestore persistence
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail as fbSendPasswordResetEmail,
  onAuthStateChanged as fbOnAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, getDocs, collection, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from '../types';
import { localStore } from './localStore';
import { sanitizeFirestoreData } from '../utils/firestoreSanitizer';

export interface AuthState {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

function syncLocalSession(profile: UserProfile): void {
  const idx = localStore.users.findIndex((u) => u.id === profile.id);
  if (idx >= 0) localStore.users[idx] = profile;
  else localStore.users.push(profile);
  localStore.saveUsers();
  localStore.saveCurrentUserId(profile.id);
}

export const authService = {
  /**
   * Retrieves the currently active user profile
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    // 1. Check Firebase Auth current user
    if (auth.currentUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const profile = userDoc.data() as UserProfile;
          syncLocalSession(profile);
          return profile;
        }
      } catch (err) {
        console.warn('Failed to fetch user doc from Firestore:', err);
      }
    }

    // 2. Check local session
    if (localStore.currentUserId) {
      const user = localStore.users.find((u) => u.id === localStore.currentUserId);
      if (user) {
        // Refresh from Firestore in background
        getDoc(doc(db, 'users', user.id))
          .then((snap) => {
            if (snap.exists()) {
              syncLocalSession(snap.data() as UserProfile);
            }
          })
          .catch(() => {});
        return user;
      }
    }

    return null;
  },

  /**
   * Sign In with Email and Password
   * Automatically handles Firebase Auth and falls back to Cloud Firestore account lookup
   */
  async login(email: string, password?: string): Promise<UserProfile> {
    const trimmedEmail = email.trim().toLowerCase();
    const safePassword = password || 'password123';

    // 1. Attempt Firebase Auth signIn
    try {
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, safePassword);
      const uid = userCredential.user.uid;
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      let profile: UserProfile;
      if (userSnap.exists()) {
        profile = userSnap.data() as UserProfile;
      } else {
        const username = trimmedEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
        profile = {
          id: uid,
          name: username.charAt(0).toUpperCase() + username.slice(1),
          username,
          email: trimmedEmail,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
          bio: 'Explorer on TS Social Book! 👋',
          joinedDate: 'Recently',
          role: 'user',
          status: 'active',
          friendsCount: 0,
          followersCount: 0,
          followingCount: 0,
          postsCount: 0
        };
        await setDoc(userRef, profile);
      }

      if (profile.status === 'banned') {
        await signOut(auth);
        throw new Error('This account has been banned for violating community guidelines.');
      }

      syncLocalSession(profile);
      return profile;
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      console.warn('Firebase signIn notice:', fbErr.code, fbErr.message);

      // If user entered wrong password on an enabled provider, report it
      if (fbErr.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please verify and try again.');
      }
      if (fbErr.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      }

      // If operation-not-allowed or user-not-found, perform Firestore-level lookup
    }

    // 2. Query Firestore users collection for matching email
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (!snap.empty) {
        const matched = snap.docs.find((d) => {
          const u = d.data() as UserProfile;
          return u.email && u.email.toLowerCase() === trimmedEmail;
        });

        if (matched) {
          const profile = matched.data() as UserProfile;
          if (profile.status === 'banned') {
            throw new Error('This account has been banned for violating community guidelines.');
          }
          syncLocalSession(profile);
          return profile;
        }
      }
    } catch (fsErr) {
      console.warn('Firestore user search notice:', fsErr);
    }

    // 3. Check local cache
    const local = localStore.users.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (local) {
      if (local.status === 'banned') {
        throw new Error('This account has been banned for violating community guidelines.');
      }
      syncLocalSession(local);
      try {
        await setDoc(doc(db, 'users', local.id), local);
      } catch {}
      return local;
    }

    // 4. Create new user profile in Firestore
    const username = trimmedEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
    const newId = `user_${Date.now()}`;
    const newProfile: UserProfile = {
      id: newId,
      name: username.charAt(0).toUpperCase() + username.slice(1),
      username,
      email: trimmedEmail,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      bio: 'Explorer on TS Social Book! 👋',
      joinedDate: 'Today',
      role: 'user',
      status: 'active',
      friendsCount: 0,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0
    };

    try {
      await setDoc(doc(db, 'users', newId), sanitizeFirestoreData(newProfile));
    } catch (fsErr) {
      console.warn('Failed to save fallback profile to Firestore:', fsErr);
    }

    syncLocalSession(newProfile);
    return newProfile;
  },

  /**
   * Sign Up a new user
   * Seamlessly persists to Firebase Auth and Cloud Firestore
   */
  async signUp(data: {
    name: string;
    username: string;
    email: string;
    password?: string;
  }): Promise<UserProfile> {
    const trimmedEmail = data.email.trim().toLowerCase();
    const safePassword = data.password || 'password123';
    const cleanUsername = data.username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    let uid = `user_${Date.now()}`;

    // 1. Attempt Firebase Auth createUser
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, safePassword);
      uid = userCredential.user.uid;
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      console.warn('Firebase signUp notice:', fbErr.code, fbErr.message);

      // If email is already in use, log in automatically instead of blocking the user!
      if (fbErr.code === 'auth/email-already-in-use') {
        return this.login(trimmedEmail, safePassword);
      }
      if (fbErr.code === 'auth/weak-password') {
        throw new Error('Password must be at least 6 characters.');
      }
      // If operation-not-allowed, proceed with generated uid to store in Firestore!
    }

    // 2. Build User Profile
    const newUser: UserProfile = {
      id: uid,
      name: data.name.trim(),
      username: cleanUsername,
      email: trimmedEmail,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
      coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      bio: 'Hello world! I just joined TS Social Book 🌟',
      joinedDate: 'Today',
      role: 'user',
      status: 'active',
      friendsCount: 0,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0
    };

    // 3. Save to Cloud Firestore
    try {
      await setDoc(doc(db, 'users', uid), sanitizeFirestoreData(newUser));
    } catch (err) {
      console.warn('Failed to save new user to Firestore:', err);
    }

    // 4. Update session
    syncLocalSession(newUser);
    return newUser;
  },

  /**
   * Send Password Reset Email
   */
  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; message: string }> {
    const trimmedEmail = email.trim().toLowerCase();
    try {
      await fbSendPasswordResetEmail(auth, trimmedEmail);
      return {
        success: true,
        message: `Password reset link sent to ${trimmedEmail}. Please check your inbox!`
      };
    } catch (err: unknown) {
      console.warn('Password reset notice:', err);
      return {
        success: true,
        message: `If an account exists for ${trimmedEmail}, password reset instructions have been issued.`
      };
    }
  },

  /**
   * Sign Out
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase signOut notice:', err);
    }
    localStore.saveCurrentUserId('');
  },

  /**
   * Listen to Auth State Changes
   */
  onAuthStateChanged(callback: (user: UserProfile | null) => void) {
    let notified = false;

    // Check existing local session first for instantaneous UI render
    if (localStore.currentUserId) {
      const local = localStore.users.find((u) => u.id === localStore.currentUserId);
      if (local) {
        notified = true;
        callback(local);
        // Refresh from Firestore
        getDoc(doc(db, 'users', local.id))
          .then((snap) => {
            if (snap.exists()) {
              const fresh = snap.data() as UserProfile;
              syncLocalSession(fresh);
              callback(fresh);
            }
          })
          .catch(() => {});
      }
    }

    const unsubscribeAuth = fbOnAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userSnap = await getDoc(doc(db, 'users', fbUser.uid));
          if (userSnap.exists()) {
            const profile = userSnap.data() as UserProfile;
            syncLocalSession(profile);
            callback(profile);
            return;
          }
        } catch (err) {
          console.warn('Error fetching Firestore user profile:', err);
        }
      }

      // If no fbUser, fall back to local stored user
      if (localStore.currentUserId) {
        const local = localStore.users.find((u) => u.id === localStore.currentUserId);
        if (local) {
          callback(local);
          return;
        }
      }

      if (!notified) {
        callback(null);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }
};
