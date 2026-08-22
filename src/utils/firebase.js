// =============================================
// FIREBASE CONFIGURATION & AUTH / FIRESTORE
// =============================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut, 
  updateProfile 
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy 
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

// Firebase configuration from user's project
const firebaseConfig = {
  apiKey: "AIzaSyC7d_YLtxXpi6oYoHCjykbHnQXs-zqNXY0",
  authDomain: "jogtrack-app.firebaseapp.com",
  projectId: "jogtrack-app",
  storageBucket: "jogtrack-app.firebasestorage.app",
  messagingSenderId: "1059079800671",
  appId: "1:1059079800671:web:af60ef987426a4435ed8ea",
  measurementId: "G-V07WNQZ87G"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

// Current auth state listener
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}

// Register with Email and Password
export async function registerWithEmail(name, email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  if (name) {
    await updateProfile(user, { displayName: name });
  }

  // Create initial user doc in Firestore
  const userDocRef = doc(db, 'users', user.uid);
  const initialData = {
    name: name || user.displayName || 'Runner',
    email: user.email,
    weight: 70,
    height: 170,
    joinedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await setDoc(userDocRef, initialData, { merge: true });

  return user;
}

// Login with Email and Password
export async function loginWithEmail(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// Login with Google
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    await syncNewUserDoc(user);
    return user;
  } catch (err) {
    if (err.code === 'auth/popup-blocked') {
      // Fallback to redirect if popup is blocked by browser
      console.warn('Popup blocked, falling back to redirect...');
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

// Check redirect result on app startup (if user used redirect fallback)
export async function checkRedirectAuth() {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      await syncNewUserDoc(result.user);
      return result.user;
    }
  } catch (err) {
    console.error('Redirect Auth Error:', err);
  }
  return null;
}

async function syncNewUserDoc(user) {
  if (!user) return;
  const userDocRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    await setDoc(userDocRef, {
      name: user.displayName || 'Runner',
      email: user.email,
      photoURL: user.photoURL || '',
      weight: 70,
      height: 170,
      joinedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }
}

// Logout
export async function logoutUser() {
  await signOut(auth);
}
