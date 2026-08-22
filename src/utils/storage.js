// =============================================
// STORAGE UTILITIES — JogTrack (with Firebase Sync)
// Handles Firestore & localStorage for runs & profile
// =============================================
import { db, auth } from './firebase.js';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy,
  writeBatch 
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

const RUNS_KEY = 'jogtrack_runs';
const PROFILE_KEY = 'jogtrack_profile';

// Default profile
const DEFAULT_PROFILE = {
  name: 'Runner',
  weight: 70,      // kg
  height: 170,     // cm
  joinedAt: new Date().toISOString(),
};

// Event listeners for data updates
const storageListeners = new Set();

export function onStorageUpdated(callback) {
  storageListeners.add(callback);
  return () => storageListeners.delete(callback);
}

function notifyUpdate() {
  storageListeners.forEach(cb => {
    try { cb(); } catch (e) { console.error(e); }
  });
}

// ---- PROFILE ----
export function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : { ...DEFAULT_PROFILE };
  } catch { 
    return { ...DEFAULT_PROFILE }; 
  }
}

export async function saveProfile(data) {
  const current = getProfile();
  const updated = { ...current, ...data, updatedAt: new Date().toISOString() };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));

  // Sync to Cloud Firestore if logged in
  const user = auth.currentUser;
  if (user) {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, updated, { merge: true });
    } catch (err) {
      console.error('Failed to sync profile to cloud:', err);
    }
  }

  notifyUpdate();
}

// ---- RUNS ----
export function getRuns() {
  try {
    const raw = localStorage.getItem(RUNS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { 
    return []; 
  }
}

export async function saveRun(run) {
  const runs = getRuns();
  const runId = run.id || Date.now().toString();
  
  // Ensure coords is an array of objects {lat, lng} (Firestore compliant)
  const cleanCoords = (run.coords || []).map(c => {
    if (Array.isArray(c)) {
      return { lat: Number(c[0]), lng: Number(c[1]) };
    }
    return { lat: Number(c.lat), lng: Number(c.lng) };
  });

  const runData = { 
    ...run, 
    id: runId, 
    coords: cleanCoords,
    createdAt: new Date().toISOString() 
  };
  
  // Save locally first (optimistic UI)
  runs.unshift(runData);
  localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
  notifyUpdate();

  // Sync to Cloud Firestore if logged in
  const user = auth.currentUser;
  if (user) {
    try {
      const runRef = doc(db, 'users', user.uid, 'runs', String(runId));
      await setDoc(runRef, runData);
    } catch (err) {
      console.error('Failed to save run to cloud:', err);
    }
  }
}

export async function deleteRun(id) {
  const idStr = String(id);
  const runs = getRuns().filter(r => String(r.id) !== idStr);
  localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
  notifyUpdate();

  // Delete from Cloud Firestore if logged in
  const user = auth.currentUser;
  if (user) {
    try {
      const runRef = doc(db, 'users', user.uid, 'runs', idStr);
      await deleteDoc(runRef);
    } catch (err) {
      console.error('Failed to delete run from cloud:', err);
    }
  }
}

export async function clearAllRuns() {
  const user = auth.currentUser;
  localStorage.removeItem(RUNS_KEY);
  notifyUpdate();

  if (user) {
    try {
      const runsRef = collection(db, 'users', user.uid, 'runs');
      const snap = await getDocs(runsRef);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (err) {
      console.error('Failed to clear cloud runs:', err);
    }
  }
}

// ---- SYNC CLOUD DATA ON LOGIN ----
export async function syncUserData(user) {
  if (!user) {
    // Reset to local defaults if logged out
    notifyUpdate();
    return;
  }

  try {
    // 1. Fetch Profile
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);
    let profileData;
    if (userDocSnap.exists()) {
      profileData = { ...DEFAULT_PROFILE, ...userDocSnap.data() };
    } else {
      profileData = {
        ...DEFAULT_PROFILE,
        name: user.displayName || 'Runner',
        email: user.email,
        photoURL: user.photoURL || '',
        joinedAt: new Date().toISOString()
      };
      await setDoc(userDocRef, profileData, { merge: true });
    }
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));

    // 2. Fetch Cloud Runs
    const runsRef = collection(db, 'users', user.uid, 'runs');
    const runsQuery = query(runsRef, orderBy('createdAt', 'desc'));
    const runsSnap = await getDocs(runsQuery);
    
    const cloudRuns = [];
    runsSnap.forEach(d => {
      cloudRuns.push(d.data());
    });

    // If user has local guest runs, upload them to cloud
    const localRuns = getRuns();
    if (cloudRuns.length === 0 && localRuns.length > 0) {
      const batch = writeBatch(db);
      localRuns.forEach(r => {
        const rRef = doc(db, 'users', user.uid, 'runs', String(r.id));
        batch.set(rRef, r);
      });
      await batch.commit();
    } else {
      localStorage.setItem(RUNS_KEY, JSON.stringify(cloudRuns));
    }

    notifyUpdate();
  } catch (err) {
    console.error('Error syncing user cloud data:', err);
    notifyUpdate();
  }
}

// ---- WEEKLY STATS ----
export function getWeeklyStats() {
  const runs = getRuns();
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const weekRuns = runs.filter(r => new Date(r.startedAt) >= monday);

  return {
    totalDistance: weekRuns.reduce((s, r) => s + (r.distance || 0), 0),
    totalCalories: weekRuns.reduce((s, r) => s + (r.calories || 0), 0),
    totalTime: weekRuns.reduce((s, r) => s + (r.duration || 0), 0),
    count: weekRuns.length,
    activeDays: getActiveDaysThisWeek(weekRuns),
  };
}

function getActiveDaysThisWeek(weekRuns) {
  const days = new Set();
  weekRuns.forEach(r => {
    const d = new Date(r.startedAt).getDay(); // 0=Sun..6=Sat
    days.add(d);
  });
  return days;
}
