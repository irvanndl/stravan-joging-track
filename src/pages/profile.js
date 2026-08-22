// =============================================
// PROFILE PAGE — JogTrack
// =============================================
import { getProfile, saveProfile, clearAllRuns, getRuns } from '../utils/storage.js';
import { formatDistance, formatDuration } from '../utils/geo.js';
import { getCurrentUser, logoutUser } from '../utils/firebase.js';
import { openAuthModal } from '../components/authModal.js';
import { showToast } from '../main.js';

export function renderProfile(container) {
  const user = getCurrentUser();
  const profile = getProfile();
  const runs = getRuns();
  const totalDistance = runs.reduce((s, r) => s + (r.distance || 0), 0);
  const totalCalories = runs.reduce((s, r) => s + (r.calories || 0), 0);
  const totalTime = runs.reduce((s, r) => s + (r.duration || 0), 0);
  
  const displayName = (user && user.displayName) ? user.displayName : profile.name;
  const initial = displayName.charAt(0).toUpperCase();
  const joinDate = new Date(profile.joinedAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  container.innerHTML = `
    <div class="page-header">
      <h2>Profil</h2>
      <p>Akun, pengaturan & statistik kamu</p>
    </div>
    <div class="page-content">

      <!-- Avatar + Info Card -->
      <div class="card animate-fade-in">
        <div class="card-body" style="display:flex; align-items:center; gap:16px;">
          ${user && user.photoURL ? 
            `<img src="${user.photoURL}" alt="${displayName}" class="profile-avatar" style="object-fit:cover;" />` : 
            `<div class="profile-avatar">${initial}</div>`
          }
          <div class="profile-info" style="flex:1;">
            <div class="profile-name" id="profile-name-display">${displayName}</div>
            <div class="profile-since">${user ? user.email : `Bergabung sejak ${joinDate}`}</div>
            <div style="margin-top:6px; display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
              ${user ? 
                `<span class="badge-cloud">☁️ Cloud Terhubung</span>` : 
                `<span class="badge-guest">👤 Mode Tamu</span>`
              }
              <span class="badge-runner">🏃 Runner</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cloud Sync / Auth Banner -->
      ${!user ? `
        <div class="card auth-promo-card animate-fade-in">
          <div class="card-body">
            <div style="display:flex; gap:12px; align-items:flex-start;">
              <div class="promo-icon">☁️</div>
              <div style="flex:1;">
                <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:4px;">Simpan Data di Cloud</h4>
                <p style="font-size:0.8rem; color:var(--clr-text-2); line-height:1.4; margin-bottom:12px;">
                  Masuk atau buat akun agar riwayat lari dan statistikmu aman tersimpan serta bisa dibuka dari perangkat apa saja.
                </p>
                <div style="display:flex; gap:8px;">
                  <button class="btn-primary" id="btn-open-login" style="padding:8px 16px; font-size:0.85rem; width:auto;">
                    Masuk / Daftar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ` : `
        <div class="card account-info-card animate-fade-in">
          <div class="card-body" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:0.85rem; font-weight:600; color:var(--clr-text-1);">Status Akun</div>
              <div style="font-size:0.75rem; color:var(--clr-success); display:flex; align-items:center; gap:4px; margin-top:2px;">
                <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--clr-success);"></span>
                Sinkronisasi aktif (${runs.length} aktivitas tersimpan)
              </div>
            </div>
            <button class="btn-outline-danger" id="btn-logout" style="padding:6px 12px; font-size:0.8rem;">
              Keluar
            </button>
          </div>
        </div>
      `}

      <!-- All-Time Stats -->
      <div class="section-title animate-fade-in">🏆 Total Statistik</div>
      <div class="stats-grid animate-fade-in">
        <div class="stat-card">
          <div class="stat-icon orange">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div class="stat-label">Total Jarak</div>
          <div class="stat-value">${formatDistance(totalDistance)}<span>km</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"/></svg>
          </div>
          <div class="stat-label">Total Kalori</div>
          <div class="stat-value">${totalCalories}<span>kcal</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="stat-label">Total Waktu</div>
          <div class="stat-value" style="font-size:1.2rem">${formatDuration(totalTime)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div class="stat-label">Total Sesi</div>
          <div class="stat-value">${runs.length}<span>lari</span></div>
        </div>
      </div>

      <!-- Settings -->
      <div class="section-title animate-fade-in">⚙️ Pengaturan Fisik</div>
      <div class="profile-row animate-fade-in">
        <div class="profile-item">
          <div class="profile-item-icon orange" style="background:var(--clr-primary-dim); color:var(--clr-primary);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div class="profile-item-content">
            <div class="profile-item-label">Nama Panggilan</div>
            <div class="profile-item-sub">Tampil di salam & beranda</div>
          </div>
          <div>
            <input id="input-name" type="text" value="${displayName}"
              style="background:var(--clr-surface-2);border:1px solid var(--clr-border);border-radius:8px;padding:6px 10px;color:var(--clr-text-1);font-size:0.85rem;font-weight:600;width:120px;text-align:right;outline:none;font-family:inherit;" />
          </div>
        </div>
        <div class="profile-item">
          <div class="profile-item-icon" style="background:var(--clr-success-dim); color:var(--clr-success);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <div class="profile-item-content">
            <div class="profile-item-label">Berat Badan</div>
            <div class="profile-item-sub">Untuk estimasi kalori lari</div>
          </div>
          <div class="profile-input-wrap">
            <input id="input-weight" type="number" min="30" max="200" value="${profile.weight || 70}"
              style="background:none;border:none;outline:none;color:var(--clr-text-1);font-size:0.9rem;font-weight:700;width:40px;text-align:right;font-family:inherit;" />
            <span class="profile-input-unit">kg</span>
          </div>
        </div>
        <div class="profile-item" style="border-bottom:none;">
          <div class="profile-item-icon" style="background:rgba(59,130,246,0.15); color:#60A5FA;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </div>
          <div class="profile-item-content">
            <div class="profile-item-label">Tinggi Badan</div>
            <div class="profile-item-sub">Informasi tinggi</div>
          </div>
          <div class="profile-input-wrap">
            <input id="input-height" type="number" min="100" max="250" value="${profile.height || 170}"
              style="background:none;border:none;outline:none;color:var(--clr-text-1);font-size:0.9rem;font-weight:700;width:40px;text-align:right;font-family:inherit;" />
            <span class="profile-input-unit">cm</span>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <button class="btn-primary animate-fade-in" id="btn-save-profile">Simpan Pengaturan</button>

      <!-- Danger Zone -->
      <div class="section-title animate-fade-in" style="color:var(--clr-danger);">⚠️ Zona Berbahaya</div>
      <button class="btn-danger animate-fade-in" id="btn-clear-data">Hapus Semua Data Lari</button>

      <div style="height: 16px;"></div>
    </div>
  `;

  // Bind Login Trigger
  const loginBtn = container.querySelector('#btn-open-login');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => openAuthModal('login'));
  }

  // Bind Logout Trigger
  const logoutBtn = container.querySelector('#btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (confirm('Keluar dari akun Anda?')) {
        await logoutUser();
        showToast('Berhasil keluar', 'info');
      }
    });
  }

  // Save profile
  container.querySelector('#btn-save-profile').addEventListener('click', async () => {
    const name = container.querySelector('#input-name').value.trim() || 'Runner';
    const weight = parseFloat(container.querySelector('#input-weight').value) || 70;
    const height = parseFloat(container.querySelector('#input-height').value) || 170;
    await saveProfile({ name, weight, height });
    showToast('Profil berhasil disimpan ✓', 'success');
  });

  // Clear all data
  container.querySelector('#btn-clear-data').addEventListener('click', async () => {
    if (confirm('Yakin ingin menghapus SEMUA data lari? Tindakan ini tidak dapat dibatalkan!')) {
      await clearAllRuns();
      showToast('Semua data lari dihapus', 'info');
    }
  });
}
