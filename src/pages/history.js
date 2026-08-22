// =============================================
// HISTORY PAGE — JogTrack
// =============================================
import { getRuns, deleteRun } from '../utils/storage.js';
import { formatDate, formatTime, formatDistance, formatDuration } from '../utils/geo.js';
import { showRunDetail } from './home.js';
import { showToast } from '../main.js';

export function renderHistory(container) {
  const runs = getRuns();

  container.innerHTML = `
    <div class="page-header">
      <h2>Riwayat Lari</h2>
      <p>${runs.length} sesi tercatat</p>
    </div>
    <div class="page-content">
      ${runs.length === 0 ? renderEmpty() : renderList(runs)}
    </div>
  `;

  // Bind click on run cards
  container.querySelectorAll('.run-card[data-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.delete-btn')) return;
      const id = parseInt(card.dataset.id);
      const run = runs.find(r => r.id === id);
      if (run) showRunDetail(run);
    });
  });

  // Bind delete buttons
  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      if (confirm('Hapus aktivitas ini?')) {
        deleteRun(id);
        showToast('Aktivitas dihapus', 'info');
        renderHistory(container); // re-render
      }
    });
  });
}

function renderEmpty() {
  return `
    <div class="history-empty">
      <div class="history-empty-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <div class="history-empty-title">Belum ada riwayat</div>
      <div class="history-empty-sub">Mulai lari pertamamu dan rekam aktivitasmu di sini!</div>
    </div>
  `;
}

function renderList(runs) {
  // Group by date
  const groups = {};
  runs.forEach(run => {
    const key = new Date(run.startedAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(run);
  });

  return Object.entries(groups).map(([date, dateRuns]) => `
    <div class="section-header" style="margin-top: 8px;">
      <span class="section-title" style="font-size:0.85rem; color:var(--clr-text-2); font-weight:600;">${date}</span>
    </div>
    <div class="history-list animate-fade-in">
      ${dateRuns.map(run => renderRunCard(run)).join('')}
    </div>
  `).join('');
}

function renderRunCard(run) {
  return `
    <div class="run-card" data-id="${run.id}">
      <div class="run-card-body">
        <div class="run-card-header">
          <div>
            <div class="run-card-title">Sesi Lari · ${formatTime(run.startedAt)}</div>
            <div class="run-card-date">${formatDistance(run.distance)} km · ${formatDuration(run.duration)}</div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <div class="run-card-badge">${run.pace}/km</div>
            <button class="delete-btn" data-id="${run.id}" aria-label="Hapus"
              style="width:32px;height:32px;border-radius:50%;background:rgba(239,68,68,0.1);border:none;display:flex;align-items:center;justify-content:center;color:var(--clr-danger);cursor:pointer;flex-shrink:0;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="run-card-stats">
          <div class="run-stat">
            <div class="run-stat-label">Jarak</div>
            <div class="run-stat-val">${formatDistance(run.distance)} km</div>
          </div>
          <div class="run-stat">
            <div class="run-stat-label">Kalori</div>
            <div class="run-stat-val">${run.calories} kcal</div>
          </div>
          <div class="run-stat">
            <div class="run-stat-label">Waktu</div>
            <div class="run-stat-val">${formatDuration(run.duration)}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}
