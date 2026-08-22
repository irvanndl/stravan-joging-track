// =============================================
// MAIN.JS — JogTrack SPA Router & Auth State
// =============================================
import { renderHome } from './pages/home.js';
import { renderRun, cleanupRun } from './pages/run.js';
import { renderHistory } from './pages/history.js';
import { renderProfile } from './pages/profile.js';
import { renderAuthPage } from './pages/auth.js';
import { onAuthChange, getCurrentUser, checkRedirectAuth } from './utils/firebase.js';
import { syncUserData, onStorageUpdated } from './utils/storage.js';

// ---- TOAST ----
export function showToast(message, type = 'info') {
  // Remove existing
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ---- ROUTER ----
let currentPage = null;

const pages = {
  auth:    renderAuthPage,
  home:    renderHome,
  run:     renderRun,
  history: renderHistory,
  profile: renderProfile,
};

export function navigate(page, forceRefresh = false) {
  const user = getCurrentUser();

  // Auth Guard: If not logged in, force 'auth' page
  if (!user && page !== 'auth') {
    page = 'auth';
  } else if (user && page === 'auth') {
    page = 'home';
  }

  if (currentPage === page && !forceRefresh) return;

  // Cleanup run if leaving run page
  if (currentPage === 'run' && page !== 'run') {
    const saveScreen = document.getElementById('save-screen');
    if (!saveScreen) cleanupRun();
  }

  currentPage = page;

  // Show/Hide bottom nav depending on auth page
  const bottomNav = document.getElementById('bottom-nav');
  if (bottomNav) {
    if (page === 'auth') {
      bottomNav.classList.add('hidden');
    } else {
      bottomNav.classList.remove('hidden');
    }
  }

  // Update nav active state
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });

  // Render page
  const container = document.getElementById('page-container');
  if (container) {
    container.scrollTop = 0;
    const renderFn = pages[page];
    if (renderFn) renderFn(container);
  }
}

export function refreshCurrentPage() {
  if (currentPage && currentPage !== 'run') {
    const container = document.getElementById('page-container');
    const renderFn = pages[currentPage];
    if (container && renderFn) renderFn(container);
  }
}

// ---- INIT ----
async function init() {
  const splash = document.getElementById('splash-screen');
  const mainApp = document.getElementById('main-app');

  // Check redirect login if any
  await checkRedirectAuth();

  // Navigation clicks
  document.getElementById('bottom-nav')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-page]');
    if (btn) navigate(btn.dataset.page);
  });

  // Auth State Listener
  let isInitialAuthResolved = false;
  onAuthChange(async (user) => {
    if (user) {
      await syncUserData(user);
    }
    
    if (isInitialAuthResolved) {
      if (user) {
        if (currentPage === 'auth' || !currentPage) {
          navigate('home', true);
        } else {
          refreshCurrentPage();
        }
      } else {
        navigate('auth', true);
      }
    }
  });

  // Storage updates listener
  onStorageUpdated(() => {
    refreshCurrentPage();
  });

  // Show main app after splash
  setTimeout(() => {
    if (splash) splash.style.display = 'none';
    if (mainApp) mainApp.classList.remove('hidden');
    isInitialAuthResolved = true;
    const user = getCurrentUser();
    navigate(user ? 'home' : 'auth', true);
  }, 1800);
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
