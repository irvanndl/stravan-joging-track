// =============================================
// HOME PAGE — JogTrack
// =============================================
import { getWeeklyStats, getRuns, getProfile } from '../utils/storage.js';
import { formatDistance, formatDuration, formatDate, formatTime, getGreeting, QUOTES } from '../utils/geo.js';
import { getCurrentUser } from '../utils/firebase.js';
import { openAuthModal } from '../components/authModal.js';

export function renderHome(container) {
  const stats = getWeeklyStats();
  const runs = getRuns();
  const profile = getProfile();
  const user = getCurrentUser();
  const recentRun = runs[0] || null;
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0

  const displayName = user ? (user.displayName || profile.name) : profile.name;
  const initial = displayName.charAt(0).toUpperCase();

  container.innerHTML = `
    <div class="greeting-banner">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <div class="greeting-time">${getGreeting()}, ${displayName} 👋</div>
          <h1 class="greeting-title">Ayo, saatnya<br/>mulai berlari!</h1>
          <p class="greeting-sub">${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          ${!user ? `
            <button class="btn-login-quick" id="quick-login-btn" style="background:var(--clr-primary);color:#fff;border:none;border-radius:20px;padding:6px 14px;font-size:0.8rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px;box-shadow:0 2px 8px rgba(255,107,53,0.35);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              Masuk
            </button>
          ` : `
            <button class="header-user-btn" id="header-user-btn" aria-label="Profil">
              ${user.photoURL ? 
                `<img src="${user.photoURL}" class="header-avatar-img" alt="avatar" />` : 
                `<div class="header-avatar-circle logged-in">${initial}</div>`
              }
            </button>
          `}
        </div>
      </div>
    </div>

    <div class="page-content">
      <!-- Quote Card -->
      <div class="quote-card animate-fade-in">
        <p class="quote-text">${quote.text}</p>
        <p class="quote-author">${quote.author}</p>
      </div>

      <!-- Weekly Streak -->
      <div class="card animate-fade-in">
        <div class="card-body">
          <div class="section-header" style="margin-bottom: 14px;">
            <span class="section-title">🔥 Streak Minggu Ini</span>
            <span style="font-size:0.8rem; color:var(--clr-primary); font-weight:700;">${stats.count} lari</span>
          </div>
          <div class="week-strip">
            ${days.map((d, i) => {
              const isActive = stats.activeDays.has(i === 6 ? 0 : i + 1); // map to JS day (0=Sun)
              const isToday = i === todayIdx;
              return `
                <div class="day-dot">
                  <div class="day-dot-label">${d}</div>
                  <div class="day-dot-circle ${isActive ? 'active' : isToday ? 'today' : ''}">
                    ${isActive ? '✓' : (isToday ? '•' : '')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="section-header">
        <span class="section-title">📊 Statistik Minggu Ini</span>
      </div>
      <div class="stats-grid animate-fade-in">
        <div class="stat-card">
          <div class="stat-icon orange">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div class="stat-label">Jarak Total</div>
          <div class="stat-value">${formatDistance(stats.totalDistance)}<span>km</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"/></svg>
          </div>
          <div class="stat-label">Kalori Terbakar</div>
          <div class="stat-value">${stats.totalCalories}<span>kcal</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="stat-label">Total Waktu</div>
          <div class="stat-value" style="font-size:1.2rem">${formatDuration(stats.totalTime)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div class="stat-label">Total Lari</div>
          <div class="stat-value">${stats.count}<span>sesi</span></div>
        </div>
      </div>

      <!-- Recent Run -->
      <div class="section-header animate-fade-in">
        <span class="section-title">🏃 Aktivitas Terbaru</span>
        ${runs.length > 0 ? '<span class="section-link" id="see-all-runs">Lihat Semua</span>' : ''}
      </div>

      ${recentRun ? `
        <div class="run-card animate-fade-in" id="recent-run-card" data-id="${recentRun.id}">
          <div class="run-card-body">
            <div class="run-card-header">
              <div>
                <div class="run-card-title">Sesi Lari · ${formatTime(recentRun.startedAt)}</div>
                <div class="run-card-date">${formatDate(recentRun.startedAt)}</div>
              </div>
              <div class="run-card-badge">${formatDistance(recentRun.distance)} km</div>
            </div>
            <div class="run-card-stats">
              <div class="run-stat">
                <div class="run-stat-label">Waktu</div>
                <div class="run-stat-val">${formatDuration(recentRun.duration)}</div>
              </div>
              <div class="run-stat">
                <div class="run-stat-label">Pace</div>
                <div class="run-stat-val">${recentRun.pace}/km</div>
              </div>
              <div class="run-stat">
                <div class="run-stat-label">Kalori</div>
                <div class="run-stat-val">${recentRun.calories} kcal</div>
              </div>
            </div>
          </div>
        </div>
      ` : `
        <div class="card animate-fade-in">
          <div class="card-body" style="text-align:center; padding: 32px 20px;">
            <div style="font-size:2.5rem; margin-bottom:12px;">🏃</div>
            <p style="color:var(--clr-text-2); font-size:0.9rem; font-weight:500;">Belum ada aktivitas lari.<br/>Mulai lari pertamamu sekarang!</p>
          </div>
        </div>
      `}

      <div style="height: 8px;"></div>
    </div>
  `;

  // Quick login button (when guest)
  container.querySelector('#quick-login-btn')?.addEventListener('click', () => {
    openAuthModal('login');
  });

  // Header user button click (when logged in) -> go to profile
  container.querySelector('#header-user-btn')?.addEventListener('click', () => {
    if (!user) {
      openAuthModal('login');
    } else {
      document.querySelector('[data-page="profile"]')?.click();
    }
  });

  // See all link → navigate to history
  container.querySelector('#see-all-runs')?.addEventListener('click', () => {
    document.querySelector('[data-page="history"]')?.click();
  });

  // Recent run card → show detail
  container.querySelector('#recent-run-card')?.addEventListener('click', () => {
    if (recentRun) showRunDetail(recentRun);
  });
}

export function showRunDetail(run) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet" id="detail-sheet">
      <div class="modal-handle"></div>
      <div class="modal-header">
        <div class="modal-title">Detail Lari</div>
        <div class="modal-sub">${formatDate(run.startedAt)} · ${formatTime(run.startedAt)}</div>
      </div>
      <div class="modal-body">
        <div class="modal-map" id="detail-map"></div>
        <div class="modal-stats-grid">
          <div class="modal-stat-item">
            <div class="modal-stat-label">Jarak</div>
            <div class="modal-stat-value">${formatDistance(run.distance)} <span style="font-size:0.8rem;color:var(--clr-text-2)">km</span></div>
          </div>
          <div class="modal-stat-item">
            <div class="modal-stat-label">Waktu</div>
            <div class="modal-stat-value">${formatDuration(run.duration)}</div>
          </div>
          <div class="modal-stat-item">
            <div class="modal-stat-label">Pace</div>
            <div class="modal-stat-value">${run.pace} <span style="font-size:0.8rem;color:var(--clr-text-2)">/km</span></div>
          </div>
          <div class="modal-stat-item">
            <div class="modal-stat-label">Kalori</div>
            <div class="modal-stat-value">${run.calories} <span style="font-size:0.8rem;color:var(--clr-text-2)">kcal</span></div>
          </div>
        </div>
        <button class="btn-close-modal" id="close-detail">Tutup</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Render route map
  if (run.coords && run.coords.length > 0 && window.L) {
    setTimeout(() => {
      try {
        const map = L.map('detail-map', { zoomControl: false, dragging: false, scrollWheelZoom: false });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        if (run.coords.length > 1) {
          const poly = L.polyline(run.coords, { color: '#FF6B35', weight: 4 }).addTo(map);
          map.fitBounds(poly.getBounds(), { padding: [16, 16] });
          L.circleMarker(run.coords[0], { radius: 8, fillColor: '#22C55E', color: 'white', weight: 2, fillOpacity: 1 }).addTo(map);
          L.circleMarker(run.coords[run.coords.length - 1], { radius: 8, fillColor: '#FF6B35', color: 'white', weight: 2, fillOpacity: 1 }).addTo(map);
        } else {
          map.setView(run.coords[0], 16);
          L.circleMarker(run.coords[0], { radius: 10, fillColor: '#FF6B35', color: 'white', weight: 3, fillOpacity: 1 }).addTo(map);
        }
        setTimeout(() => map.invalidateSize(), 200);
      } catch (err) {
        console.error('Error rendering detail map:', err);
      }
    }, 150);
  } else {
    document.getElementById('detail-map').innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--clr-text-3);font-size:0.85rem;">Rute tidak tersedia</div>
    `;
  }

  const close = () => {
    overlay.style.animation = 'none';
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 200);
  };

  overlay.querySelector('#close-detail').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}
