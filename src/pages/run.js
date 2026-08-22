// =============================================
// RUN PAGE — JogTrack
// GPS tracking, live stats, Leaflet map
// =============================================
import { haversineDistance, calcPace, calcCalories, formatDuration, formatDistance } from '../utils/geo.js';
import { getProfile, saveRun } from '../utils/storage.js';
import { showToast } from '../main.js';

// State
let state = {
  status: 'idle',      // idle | running | paused
  startedAt: null,
  duration: 0,         // seconds elapsed
  distance: 0,         // km
  coords: [],          // [{lat, lng}]
  lastCoord: null,
  watchId: null,
  timerInterval: null,
  map: null,
  polyline: null,
  marker: null,
  saveMap: null,
};

export function renderRun(container) {
  container.innerHTML = `
    <div class="run-page">
      <!-- Map -->
      <div class="run-map-container">
        <div id="run-map"></div>
        <div class="run-map-overlay">
          <div class="run-map-badge" id="gps-status-badge">
            <div class="gps-dot waiting" id="gps-dot"></div>
            <span id="gps-status-text">Menunggu GPS...</span>
          </div>
        </div>
      </div>

      <!-- Bottom Panel -->
      <div class="run-panel">
        <div class="run-drag-handle"></div>

        <!-- Timer -->
        <div class="run-timer-display">
          <div class="run-timer-time" id="run-timer">00:00</div>
          <div class="run-timer-label">Durasi</div>
        </div>

        <!-- Live Stats Grid -->
        <div class="run-stats-grid">
          <div class="run-stat-box">
            <div class="run-stat-box-label">Jarak</div>
            <div class="run-stat-box-val primary" id="run-distance">0.00</div>
            <div class="run-stat-box-unit">km</div>
          </div>
          <div class="run-stat-box">
            <div class="run-stat-box-label">Pace</div>
            <div class="run-stat-box-val" id="run-pace">--:--</div>
            <div class="run-stat-box-unit">min/km</div>
          </div>
          <div class="run-stat-box">
            <div class="run-stat-box-label">Kalori</div>
            <div class="run-stat-box-val" id="run-calories">0</div>
            <div class="run-stat-box-unit">kcal</div>
          </div>
          <div class="run-stat-box">
            <div class="run-stat-box-label">Kecepatan</div>
            <div class="run-stat-box-val" id="run-speed">0.0</div>
            <div class="run-stat-box-unit">km/h</div>
          </div>
        </div>

        <!-- Controls -->
        <div class="run-controls" id="run-controls">
          ${getControlsHTML()}
        </div>
      </div>
    </div>
  `;

  initMap();
  bindControls(container);
  requestGPS();
}

function getControlsHTML() {
  const { status } = state;
  if (status === 'idle') {
    return `
      <button class="btn-run-action btn-start" id="btn-start" aria-label="Mulai Lari">
        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </button>
    `;
  }
  if (status === 'running') {
    return `
      <button class="btn-run-action btn-lap" id="btn-lap" aria-label="Lap" style="opacity:0.7">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </button>
      <div class="btn-pause-wrap" style="position:relative;">
        <div class="run-active-ring"></div>
        <button class="btn-run-action btn-pause" id="btn-pause" aria-label="Pause">
          <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        </button>
      </div>
      <button class="btn-run-action btn-stop" id="btn-stop" aria-label="Stop">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
      </button>
    `;
  }
  // paused
  return `
    <button class="btn-run-action btn-stop" id="btn-stop" aria-label="Stop">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
    </button>
    <button class="btn-run-action btn-start" id="btn-resume" aria-label="Lanjut Lari">
      <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
    </button>
  `;
}

function initMap() {
  if (!window.L) return;
  // Destroy existing map if any
  if (state.map) {
    state.map.remove();
    state.map = null;
  }

  state.map = L.map('run-map', {
    center: [-6.2, 106.816],
    zoom: 15,
    zoomControl: false,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(state.map);

  L.control.zoom({ position: 'topright' }).addTo(state.map);
}

function bindControls(container) {
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.id;
    if (id === 'btn-start' || id === 'btn-resume') startRun(container);
    if (id === 'btn-pause') pauseRun(container);
    if (id === 'btn-stop') stopRun(container);
  });
}

let initialPos = null;

function requestGPS() {
  if (!navigator.geolocation) {
    updateGPSBadge(false);
    showToast('GPS tidak tersedia di browser ini', 'error');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      initialPos = { lat, lng };
      updateGPSBadge(true);
      if (state.map) {
        state.map.setView([lat, lng], 16);
        // Blue dot for current position
        if (!state.marker) {
          state.marker = L.circleMarker([lat, lng], {
            radius: 10,
            fillColor: '#60A5FA',
            color: 'white',
            weight: 3,
            fillOpacity: 1,
          }).addTo(state.map);
        } else {
          state.marker.setLatLng([lat, lng]);
        }
      }
    },
    (err) => {
      console.warn('GPS init error:', err);
      updateGPSBadge(false);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
  );
}

function updateGPSBadge(ok) {
  const dot = document.getElementById('gps-dot');
  const txt = document.getElementById('gps-status-text');
  if (!dot || !txt) return;
  if (ok) {
    dot.classList.remove('waiting');
    txt.textContent = 'GPS Aktif';
  } else {
    dot.classList.add('waiting');
    txt.textContent = 'GPS Menunggu Sinyal';
  }
}

function startRun(container) {
  if (!navigator.geolocation) {
    showToast('GPS diperlukan untuk tracking lari', 'error');
    return;
  }
  state.status = 'running';
  state.startedAt = state.startedAt || new Date().toISOString();

  // If we already have an initial position from GPS init, seed it immediately!
  if (initialPos && state.coords.length === 0) {
    state.coords.push({ lat: initialPos.lat, lng: initialPos.lng });
    state.lastCoord = { ...initialPos };
  }

  // Also immediately request current precise position to guarantee start coordinate
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      onGPSUpdate(pos);
    },
    (err) => console.warn('Instant GPS fetch error:', err),
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
  );

  // Start GPS continuous watch
  state.watchId = navigator.geolocation.watchPosition(
    (pos) => onGPSUpdate(pos),
    (err) => {
      console.warn('Watch GPS error:', err);
      updateGPSBadge(false);
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
  );

  // Start timer
  const startTime = Date.now() - state.duration * 1000;
  state.timerInterval = setInterval(() => {
    state.duration = (Date.now() - startTime) / 1000;
    updateStats();
  }, 1000);

  refreshControls(container);
  showToast('Lari dimulai! Semangat! 🏃', 'success');
}

function onGPSUpdate(pos) {
  const { latitude: lat, longitude: lng, speed, accuracy } = pos.coords;
  const newCoord = { lat, lng };
  updateGPSBadge(true);

  if (state.lastCoord && state.status === 'running') {
    const dist = haversineDistance(
      state.lastCoord.lat, state.lastCoord.lng,
      lat, lng
    );
    // Add point if moved at least 2m or if it's been a few updates
    if (dist >= 0.002 && dist <= 0.2) {
      state.distance += dist;
      state.lastCoord = newCoord;
      state.coords.push({ lat, lng });
    } else if (dist > 0.2) {
      // Jump calibration, update anchor
      state.lastCoord = newCoord;
      state.coords.push({ lat, lng });
    }
  } else if (state.status === 'running') {
    state.lastCoord = newCoord;
    if (state.coords.length === 0) {
      state.coords.push({ lat, lng });
    }
  }

  // Update speed display
  const speedEl = document.getElementById('run-speed');
  if (speedEl && speed !== null) {
    speedEl.textContent = (speed * 3.6).toFixed(1);
  }

  // Update map
  if (state.map) {
    state.map.panTo([lat, lng], { animate: true, duration: 1 });
    if (!state.marker) {
      state.marker = L.circleMarker([lat, lng], {
        radius: 10, fillColor: '#60A5FA', color: 'white', weight: 3, fillOpacity: 1,
      }).addTo(state.map);
    } else {
      state.marker.setLatLng([lat, lng]);
    }

    if (state.status === 'running') {
      const latLngs = state.coords.map(c => [c.lat, c.lng]);
      if (!state.polyline) {
        state.polyline = L.polyline(latLngs, {
          color: '#FF6B35', weight: 5, opacity: 0.9,
        }).addTo(state.map);
      } else {
        state.polyline.setLatLngs(latLngs);
      }
    }
  }
}

function pauseRun(container) {
  state.status = 'paused';
  clearInterval(state.timerInterval);
  if (state.watchId !== null) {
    navigator.geolocation.clearWatch(state.watchId);
    state.watchId = null;
  }
  refreshControls(container);
  showToast('Lari dijeda ⏸', 'info');
}

function stopRun(container) {
  if (state.distance < 0.01 && state.duration < 5) {
    discardRun();
    showToast('Sesi lari dibatalkan', 'info');
    refreshControls(container);
    return;
  }
  clearInterval(state.timerInterval);
  if (state.watchId !== null) {
    navigator.geolocation.clearWatch(state.watchId);
    state.watchId = null;
  }
  showSaveScreen();
}

function updateStats() {
  const profile = getProfile();
  const timerEl = document.getElementById('run-timer');
  const distEl = document.getElementById('run-distance');
  const paceEl = document.getElementById('run-pace');
  const calEl = document.getElementById('run-calories');

  if (timerEl) timerEl.textContent = formatDuration(state.duration);
  if (distEl) distEl.textContent = formatDistance(state.distance);
  if (paceEl) paceEl.textContent = calcPace(state.distance, state.duration);
  if (calEl) calEl.textContent = calcCalories(state.distance, state.duration, profile.weight);
}

function refreshControls(container) {
  const ctrl = container.querySelector('#run-controls');
  if (ctrl) {
    ctrl.innerHTML = getControlsHTML();
  }
}

function showSaveScreen() {
  const profile = getProfile();
  const finalPace = calcPace(state.distance, state.duration);
  const finalCalories = calcCalories(state.distance, state.duration, profile.weight);

  const screen = document.createElement('div');
  screen.className = 'save-screen';
  screen.id = 'save-screen';

  screen.innerHTML = `
    <div class="save-header">
      <div class="save-success-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h2 class="save-title">Lari Selesai!</h2>
      <p class="save-sub">Kerja bagus, terus semangat! 💪</p>
    </div>
    <div class="save-content">
      <div class="save-map" id="save-map-el"></div>
      <div class="save-stats-grid">
        <div class="save-stat-box">
          <div class="save-stat-label">Jarak</div>
          <div class="save-stat-val">${formatDistance(state.distance)}</div>
          <div class="save-stat-unit">km</div>
        </div>
        <div class="save-stat-box">
          <div class="save-stat-label">Waktu</div>
          <div class="save-stat-val">${formatDuration(state.duration)}</div>
          <div class="save-stat-unit">menit</div>
        </div>
        <div class="save-stat-box">
          <div class="save-stat-label">Pace</div>
          <div class="save-stat-val">${finalPace}</div>
          <div class="save-stat-unit">min/km</div>
        </div>
        <div class="save-stat-box">
          <div class="save-stat-label">Kalori</div>
          <div class="save-stat-val">${finalCalories}</div>
          <div class="save-stat-unit">kcal</div>
        </div>
      </div>
    </div>
    <div class="save-actions">
      <button class="btn-primary" id="btn-save-run">Simpan Aktivitas</button>
      <button class="btn-secondary" id="btn-discard-run">Buang & Keluar</button>
    </div>
  `;

  document.body.appendChild(screen);

  // Render save map
  setTimeout(() => {
    const latLngs = (state.coords || []).map(c => Array.isArray(c) ? [c[0], c[1]] : [c.lat, c.lng]);
    if (latLngs.length > 0 && window.L) {
      try {
        state.saveMap = L.map('save-map-el', { zoomControl: false, dragging: false, scrollWheelZoom: false });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(state.saveMap);

        if (latLngs.length > 1) {
          const poly = L.polyline(latLngs, { color: '#FF6B35', weight: 5 }).addTo(state.saveMap);
          state.saveMap.fitBounds(poly.getBounds(), { padding: [20, 20] });
          L.circleMarker(latLngs[0], { radius: 8, fillColor: '#22C55E', color: 'white', weight: 2, fillOpacity: 1 }).addTo(state.saveMap);
          L.circleMarker(latLngs[latLngs.length - 1], { radius: 8, fillColor: '#FF6B35', color: 'white', weight: 2, fillOpacity: 1 }).addTo(state.saveMap);
        } else {
          state.saveMap.setView(latLngs[0], 16);
          L.circleMarker(latLngs[0], { radius: 10, fillColor: '#FF6B35', color: 'white', weight: 3, fillOpacity: 1 }).addTo(state.saveMap);
        }
        setTimeout(() => state.saveMap?.invalidateSize(), 200);
      } catch (err) {
        console.error('Error rendering save map:', err);
      }
    } else {
      const mapEl = document.getElementById('save-map-el');
      if (mapEl) {
        mapEl.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--clr-text-3);font-size:0.85rem;flex-direction:column;gap:8px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Rute GPS tidak terekam
          </div>
        `;
      }
    }
  }, 150);

  screen.querySelector('#btn-save-run').addEventListener('click', () => {
    saveRun({
      startedAt: state.startedAt,
      duration: Math.round(state.duration),
      distance: state.distance,
      pace: finalPace,
      calories: finalCalories,
      coords: state.coords,
    });
    closeSaveScreen(screen);
    showToast('Aktivitas tersimpan! 🎉', 'success');
    // Navigate to home
    setTimeout(() => {
      document.querySelector('[data-page="home"]')?.click();
    }, 500);
  });

  screen.querySelector('#btn-discard-run').addEventListener('click', () => {
    closeSaveScreen(screen);
    showToast('Aktivitas dibuang', 'info');
    setTimeout(() => {
      document.querySelector('[data-page="home"]')?.click();
    }, 300);
  });
}

function closeSaveScreen(screen) {
  if (state.saveMap) { state.saveMap.remove(); state.saveMap = null; }
  screen.remove();
  discardRun();
}

function discardRun() {
  clearInterval(state.timerInterval);
  if (state.watchId !== null) {
    navigator.geolocation.clearWatch(state.watchId);
  }
  // Reset state
  state = {
    status: 'idle', startedAt: null, duration: 0, distance: 0,
    coords: [], lastCoord: null, watchId: null, timerInterval: null,
    map: state.map, polyline: null, marker: null, saveMap: null,
  };
}

// Cleanup when leaving page
export function cleanupRun() {
  clearInterval(state.timerInterval);
  if (state.watchId !== null) {
    navigator.geolocation.clearWatch(state.watchId);
    state.watchId = null;
  }
  if (state.map) {
    state.map.remove();
    state.map = null;
  }
}
