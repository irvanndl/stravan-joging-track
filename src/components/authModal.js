// =============================================
// AUTH MODAL COMPONENT — JogTrack
// Handles Login, Register, Google Sign-in
// =============================================
import { loginWithEmail, registerWithEmail, loginWithGoogle } from '../utils/firebase.js';
import { showToast } from '../main.js';

let activeModal = null;

export function openAuthModal(defaultMode = 'login', onSuccess = null) {
  if (activeModal) {
    activeModal.remove();
    activeModal = null;
  }

  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'auth-modal-overlay';
  modalOverlay.id = 'auth-modal';

  let currentMode = defaultMode; // 'login' or 'register'

  function renderModalContent() {
    modalOverlay.innerHTML = `
      <div class="auth-modal-card animate-scale-up">
        <button class="auth-modal-close" id="auth-close-btn" aria-label="Tutup">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="auth-header">
          <div class="auth-icon-badge">
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="34" cy="12" r="4" fill="var(--clr-primary)"/>
              <path d="M30 18 L24 24 L28 30 L24 40" stroke="var(--clr-primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M24 24 L18 20" stroke="var(--clr-primary)" stroke-width="3" stroke-linecap="round"/>
              <path d="M28 30 L34 34" stroke="var(--clr-primary)" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </div>
          <h3 class="auth-title">${currentMode === 'login' ? 'Selamat Datang Kembali!' : 'Buat Akun Stravan'}</h3>
          <p class="auth-subtitle">${currentMode === 'login' ? 'Masuk untuk sinkronisasi data lari di cloud' : 'Mulai rekam & simpan riwayat larimu di mana saja'}</p>
        </div>

        <!-- Mode Tabs -->
        <div class="auth-tabs">
          <button class="auth-tab ${currentMode === 'login' ? 'active' : ''}" id="tab-login">Masuk</button>
          <button class="auth-tab ${currentMode === 'register' ? 'active' : ''}" id="tab-register">Daftar</button>
        </div>

        <!-- Error box -->
        <div class="auth-error-box hidden" id="auth-error"></div>

        <!-- Google Login Button -->
        <button class="btn-google" id="btn-google-auth">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
            <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"/>
            <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"/>
          </svg>
          <span>Lanjutkan dengan Google</span>
        </button>

        <div class="auth-divider">
          <span>atau dengan email</span>
        </div>

        <!-- Form -->
        <form class="auth-form" id="auth-form">
          ${currentMode === 'register' ? `
            <div class="form-group">
              <label class="form-label" for="auth-name">Nama Lengkap</label>
              <input class="form-input" id="auth-name" type="text" placeholder="Contoh: Budi Pratama" required autocomplete="name" />
            </div>
          ` : ''}

          <div class="form-group">
            <label class="form-label" for="auth-email">Email</label>
            <input class="form-input" id="auth-email" type="email" placeholder="nama@email.com" required autocomplete="email" />
          </div>

          <div class="form-group">
            <label class="form-label" for="auth-password">Kata Sandi</label>
            <input class="form-input" id="auth-password" type="password" placeholder="Minimal 6 karakter" minlength="6" required autocomplete="${currentMode === 'login' ? 'current-password' : 'new-password'}" />
          </div>

          <button class="btn-primary auth-submit-btn" type="submit" id="auth-submit-btn">
            <span class="btn-text">${currentMode === 'login' ? 'Masuk Sekarang' : 'Daftar Akun'}</span>
            <div class="btn-spinner hidden"></div>
          </button>
        </form>
      </div>
    `;

    // Bind event listeners
    modalOverlay.querySelector('#auth-close-btn').addEventListener('click', closeAuthModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeAuthModal();
    });

    modalOverlay.querySelector('#tab-login').addEventListener('click', () => {
      currentMode = 'login';
      renderModalContent();
    });

    modalOverlay.querySelector('#tab-register').addEventListener('click', () => {
      currentMode = 'register';
      renderModalContent();
    });

    // Google Sign in
    modalOverlay.querySelector('#btn-google-auth').addEventListener('click', async () => {
      const errorBox = modalOverlay.querySelector('#auth-error');
      errorBox.classList.add('hidden');
      try {
        await loginWithGoogle();
        showToast('Berhasil masuk dengan Google! 🎉', 'success');
        closeAuthModal();
        if (onSuccess) onSuccess();
      } catch (err) {
        console.error('Google Auth Error:', err);
        showAuthError(parseFirebaseError(err));
      }
    });

    // Form Submit
    const form = modalOverlay.querySelector('#auth-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.querySelector('#auth-email').value.trim();
      const password = form.querySelector('#auth-password').value;
      const submitBtn = form.querySelector('#auth-submit-btn');
      const btnText = submitBtn.querySelector('.btn-text');
      const spinner = submitBtn.querySelector('.btn-spinner');

      // Loading state
      submitBtn.disabled = true;
      btnText.classList.add('hidden');
      spinner.classList.remove('hidden');

      try {
        if (currentMode === 'register') {
          const name = form.querySelector('#auth-name').value.trim();
          await registerWithEmail(name, email, password);
          showToast(`Akun berhasil dibuat! Selamat datang, ${name} 👋`, 'success');
        } else {
          await loginWithEmail(email, password);
          showToast('Berhasil masuk! 🎉', 'success');
        }
        closeAuthModal();
        if (onSuccess) onSuccess();
      } catch (err) {
        console.error('Auth Error:', err);
        showAuthError(parseFirebaseError(err));
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        spinner.classList.add('hidden');
      }
    });
  }

  function showAuthError(msg) {
    const errorBox = modalOverlay.querySelector('#auth-error');
    if (errorBox) {
      errorBox.textContent = msg;
      errorBox.classList.remove('hidden');
    }
  }

  renderModalContent();
  document.body.appendChild(modalOverlay);
  activeModal = modalOverlay;
}

export function closeAuthModal() {
  if (activeModal) {
    activeModal.classList.add('closing');
    setTimeout(() => {
      activeModal?.remove();
      activeModal = null;
    }, 200);
  }
}

function parseFirebaseError(err) {
  const code = err.code || '';
  if (code.includes('user-not-found') || code.includes('invalid-credential')) {
    return 'Email atau kata sandi tidak cocok. Silakan periksa kembali.';
  }
  if (code.includes('wrong-password')) {
    return 'Kata sandi salah. Silakan coba lagi.';
  }
  if (code.includes('email-already-in-use')) {
    return 'Email ini sudah terdaftar. Silakan pilih tab Masuk.';
  }
  if (code.includes('invalid-email')) {
    return 'Format email tidak valid.';
  }
  if (code.includes('weak-password')) {
    return 'Kata sandi terlalu pendek (minimal 6 karakter).';
  }
  if (code.includes('popup-closed-by-user')) {
    return 'Proses login Google dibatalkan.';
  }
  return err.message || 'Terjadi kesalahan saat masuk. Coba lagi.';
}
