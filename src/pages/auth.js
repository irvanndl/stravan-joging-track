// =============================================
// AUTH PAGE — JogTrack
// Dedicated Login & Register Screen (Auth Guard)
// =============================================
import { loginWithEmail, registerWithEmail, loginWithGoogle } from '../utils/firebase.js';
import { showToast } from '../main.js';

export function renderAuthPage(container) {
  let currentMode = 'login'; // 'login' | 'register'

  function render() {
    container.innerHTML = `
      <div class="auth-page-wrapper">
        <div class="auth-page-bg-blobs">
          <div class="blob blob-1"></div>
          <div class="blob blob-2"></div>
        </div>

        <div class="auth-page-container animate-fade-in">
          <!-- Logo & Branding -->
          <div class="auth-brand">
            <div class="auth-brand-logo">
              <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="34" cy="12" r="4" fill="white"/>
                <path d="M30 18 L24 24 L28 30 L24 40" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <path d="M24 24 L18 20" stroke="white" stroke-width="3" stroke-linecap="round" fill="none"/>
                <path d="M28 30 L34 34" stroke="white" stroke-width="3" stroke-linecap="round" fill="none"/>
                <path d="M24 40 L18 44" stroke="white" stroke-width="3" stroke-linecap="round" fill="none"/>
                <path d="M24 40 L30 44" stroke="white" stroke-width="3" stroke-linecap="round" fill="none"/>
              </svg>
            </div>
            <h1 class="auth-brand-title">Stravan</h1>
            <p class="auth-brand-tagline">Lacak setiap langkah larimu & pantau progres kebugaranmu</p>
          </div>

          <!-- Auth Card -->
          <div class="auth-card-main">
            <!-- Mode Switcher Tabs -->
            <div class="auth-tabs-modern">
              <button class="auth-tab-pill ${currentMode === 'login' ? 'active' : ''}" id="tab-login-btn">
                Masuk
              </button>
              <button class="auth-tab-pill ${currentMode === 'register' ? 'active' : ''}" id="tab-register-btn">
                Daftar Baru
              </button>
            </div>

            <!-- Error Banner -->
            <div class="auth-error-box hidden" id="auth-page-error"></div>

            <!-- Google One-Click Login -->
            <button class="btn-google-auth-page" id="btn-google-login">
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"/>
                <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"/>
              </svg>
              <span>Lanjutkan dengan Google</span>
            </button>

            <div class="auth-divider-modern">
              <span>atau dengan email</span>
            </div>

            <!-- Form -->
            <form id="auth-main-form" class="auth-form-modern">
              ${currentMode === 'register' ? `
                <div class="form-group-modern animate-fade-in">
                  <label class="form-label-modern" for="input-fullname">Nama Lengkap</label>
                  <div class="input-wrap-modern">
                    <svg class="input-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <input class="form-input-modern" id="input-fullname" type="text" placeholder="Contoh: Budi Pratama" required autocomplete="name" />
                  </div>
                </div>
              ` : ''}

              <div class="form-group-modern">
                <label class="form-label-modern" for="input-email">Alamat Email</label>
                <div class="input-wrap-modern">
                  <svg class="input-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  <input class="form-input-modern" id="input-email" type="email" placeholder="nama@email.com" required autocomplete="email" />
                </div>
              </div>

              <div class="form-group-modern">
                <label class="form-label-modern" for="input-password">Kata Sandi</label>
                <div class="input-wrap-modern">
                  <svg class="input-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input class="form-input-modern" id="input-password" type="password" placeholder="Minimal 6 karakter" minlength="6" required autocomplete="${currentMode === 'login' ? 'current-password' : 'new-password'}" />
                </div>
              </div>

              <button class="btn-primary-auth" type="submit" id="btn-submit-auth">
                <span class="btn-text-label">${currentMode === 'login' ? 'Masuk ke Stravan' : 'Buat Akun Sekarang'}</span>
                <div class="btn-spinner-auth hidden"></div>
              </button>
            </form>
          </div>

          <div class="auth-footer-terms">
            Data tersimpan aman di Cloud Firestore.
          </div>
        </div>
      </div>
    `;

    // Event handlers
    container.querySelector('#tab-login-btn')?.addEventListener('click', () => {
      currentMode = 'login';
      render();
    });

    container.querySelector('#tab-register-btn')?.addEventListener('click', () => {
      currentMode = 'register';
      render();
    });

    // Google Sign-in
    container.querySelector('#btn-google-login')?.addEventListener('click', async () => {
      hideError();
      try {
        await loginWithGoogle();
        showToast('Berhasil masuk dengan Google! 🎉', 'success');
      } catch (err) {
        console.error('Google Auth Error:', err);
        showError(parseFirebaseError(err));
      }
    });

    // Form submission
    const form = container.querySelector('#auth-main-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();

      const email = form.querySelector('#input-email').value.trim();
      const password = form.querySelector('#input-password').value;
      const submitBtn = form.querySelector('#btn-submit-auth');
      const textLabel = submitBtn.querySelector('.btn-text-label');
      const spinner = submitBtn.querySelector('.btn-spinner-auth');

      // Loading state
      submitBtn.disabled = true;
      textLabel.classList.add('hidden');
      spinner.classList.remove('hidden');

      try {
        if (currentMode === 'register') {
          const name = form.querySelector('#input-fullname').value.trim();
          await registerWithEmail(name, email, password);
          showToast(`Akun berhasil dibuat! Selamat datang, ${name} 👋`, 'success');
        } else {
          await loginWithEmail(email, password);
          showToast('Berhasil masuk! Selamat datang kembali 🎉', 'success');
        }
      } catch (err) {
        console.error('Auth Form Error:', err);
        showError(parseFirebaseError(err));
        submitBtn.disabled = false;
        textLabel.classList.remove('hidden');
        spinner.classList.add('hidden');
      }
    });
  }

  function showError(msg) {
    const errorBox = container.querySelector('#auth-page-error');
    if (errorBox) {
      errorBox.textContent = msg;
      errorBox.classList.remove('hidden');
    }
  }

  function hideError() {
    const errorBox = container.querySelector('#auth-page-error');
    if (errorBox) {
      errorBox.classList.add('hidden');
    }
  }

  render();
}

function parseFirebaseError(err) {
  const code = err.code || '';
  if (code.includes('popup-blocked')) {
    return 'Jendela pop-up login Google diblokir oleh browser. Silakan izinkan Pop-up di bilah URL browser Anda (klik ikon gembok / popup di address bar), atau gunakan Email & Kata Sandi.';
  }
  if (code.includes('user-not-found') || code.includes('invalid-credential') || code.includes('wrong-password')) {
    return 'Email atau kata sandi tidak cocok. Silakan periksa kembali.';
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
  if (code.includes('unauthorized-domain')) {
    return 'Domain ini belum diizinkan di Firebase Authentication Console.';
  }
  return err.message || 'Terjadi kesalahan. Silakan coba beberapa saat lagi.';
}
