/**
 * Freelancer Proposal Tracker (ProposalFlow) - Authentication Controller
 * Manages Supabase Auth workflows, session listeners, form validations, and view routing.
 */

class AuthController {
  constructor() {
    this.currentUser = null;
    this.currentSession = null;
    this.authListeners = [];
  }

  init() {
    this.bindEvents();
    this.listenToAuthState();
    this.checkUrlForRecovery();
  }

  getClient() {
    return window.supabaseManager.getClient();
  }

  bindEvents() {
    // 1. Login Form Submit
    const loginForm = document.getElementById('auth-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // 2. Register Form Submit
    const registerForm = document.getElementById('auth-register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }

    // 3. Forgot Password Form Submit
    const forgotForm = document.getElementById('auth-forgot-form');
    if (forgotForm) {
      forgotForm.addEventListener('submit', (e) => this.handleForgotPassword(e));
    }

    // 4. Reset Password Form Submit
    const resetForm = document.getElementById('auth-reset-form');
    if (resetForm) {
      resetForm.addEventListener('submit', (e) => this.handleResetPassword(e));
    }

    // Password Visibility Toggles
    document.querySelectorAll('.password-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (input) {
          const isPassword = input.type === 'password';
          input.type = isPassword ? 'text' : 'password';
          const icon = btn.querySelector('i');
          if (icon) {
            icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
            if (window.lucide) window.lucide.createIcons();
          }
        }
      });
    });
  }

  listenToAuthState() {
    const client = this.getClient();

    client.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth State Changed:', event, session?.user?.email || 'No User');
      this.currentSession = session;
      this.currentUser = session?.user || null;

      if (event === 'PASSWORD_RECOVERY') {
        this.showAuthView('reset');
        return;
      }

      if (session?.user) {
        // Authenticated: Initialize storage for this user and show App Shell
        this.hideAuthShell();
        if (window.storage) {
          await window.storage.initForUser(session.user);
        }
        if (window.app) {
          window.app.onUserLoggedIn(session.user);
        }
      } else {
        // Unauthenticated: Purge in-memory state and show Login Screen
        if (window.storage) {
          window.storage.purgeUserData();
        }
        this.showAuthShell();
      }
    });
  }

  checkUrlForRecovery() {
    // Check if user followed Supabase password recovery email link
    const hash = window.location.hash;
    if (hash && (hash.includes('type=recovery') || hash.includes('access_token='))) {
      this.showAuthShell();
      this.showAuthView('reset');
    }
  }

  showAuthShell() {
    const authShell = document.getElementById('auth-shell');
    const appShell = document.getElementById('app-shell');
    const authLoading = document.getElementById('auth-initial-loading');

    if (authLoading) authLoading.style.display = 'none';
    if (appShell) appShell.style.display = 'none';
    if (authShell) authShell.style.display = 'flex';

    if (window.lucide) window.lucide.createIcons();
  }

  hideAuthShell() {
    const authShell = document.getElementById('auth-shell');
    const appShell = document.getElementById('app-shell');
    const authLoading = document.getElementById('auth-initial-loading');

    if (authLoading) authLoading.style.display = 'none';
    if (authShell) authShell.style.display = 'none';
    if (appShell) appShell.style.display = 'flex';

    if (window.lucide) window.lucide.createIcons();
  }

  showAuthView(viewName) {
    document.querySelectorAll('.auth-card-view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(`auth-view-${viewName}`);
    if (target) {
      target.classList.add('active');
    }
    this.clearAlerts();
    if (window.lucide) window.lucide.createIcons();
  }

  clearAlerts() {
    document.querySelectorAll('.auth-alert').forEach(a => {
      a.style.display = 'none';
      a.textContent = '';
      a.className = 'auth-alert';
    });
  }

  showAlert(viewName, message, type = 'error') {
    const alertEl = document.getElementById(`auth-alert-${viewName}`);
    if (!alertEl) return;

    alertEl.textContent = message;
    alertEl.className = `auth-alert alert-${type}`;
    alertEl.style.display = 'block';
  }

  // --- ACTIONS ---

  async handleLogin(e) {
    e.preventDefault();
    this.clearAlerts();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('btn-submit-login');

    if (!email || !password) {
      this.showAlert('login', 'Please enter your email and password.', 'error');
      return;
    }

    this.setButtonLoading(submitBtn, true, 'Signing in...');

    try {
      const client = this.getClient();
      const { data, error } = await client.auth.signInWithPassword({ email, password });

      if (error) {
        this.showAlert('login', error.message || 'Failed to sign in. Please check credentials.', 'error');
        this.setButtonLoading(submitBtn, false, 'Sign In to Workspace');
        return;
      }

      // Success handled reactively via onAuthStateChange
      this.setButtonLoading(submitBtn, false, 'Sign In to Workspace');
    } catch (err) {
      console.error('Login error:', err);
      this.showAlert('login', err.message || 'An unexpected error occurred during login.', 'error');
      this.setButtonLoading(submitBtn, false, 'Sign In to Workspace');
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    this.clearAlerts();

    const fullName = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const submitBtn = document.getElementById('btn-submit-register');

    if (!fullName) {
      this.showAlert('register', 'Please provide your full name.', 'error');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.showAlert('register', 'Please enter a valid email address.', 'error');
      return;
    }

    if (password.length < 6) {
      this.showAlert('register', 'Password must be at least 6 characters long.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      this.showAlert('register', 'Passwords do not match. Please re-enter.', 'error');
      return;
    }

    this.setButtonLoading(submitBtn, true, 'Creating Account...');

    try {
      const client = this.getClient();
      const redirectUrl = window.location.origin + window.location.pathname;

      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        this.showAlert('register', error.message || 'Could not register account.', 'error');
        this.setButtonLoading(submitBtn, false, 'Create Account');
        return;
      }

      // If user requires email confirmation
      if (data.user && !data.session) {
        const verifyMsg = document.getElementById('auth-verify-email-text');
        if (verifyMsg) verifyMsg.textContent = email;
        this.showAuthView('verify');
      } else {
        // Instant login session established
        window.app.showToast('Account created successfully! Welcome to ProposalFlow.', 'success');
      }

      this.setButtonLoading(submitBtn, false, 'Create Account');
    } catch (err) {
      console.error('Registration error:', err);
      this.showAlert('register', err.message || 'An unexpected error occurred.', 'error');
      this.setButtonLoading(submitBtn, false, 'Create Account');
    }
  }

  async handleForgotPassword(e) {
    e.preventDefault();
    this.clearAlerts();

    const email = document.getElementById('forgot-email').value.trim();
    const submitBtn = document.getElementById('btn-submit-forgot');

    if (!email || !this.isValidEmail(email)) {
      this.showAlert('forgot', 'Please enter a valid email address.', 'error');
      return;
    }

    this.setButtonLoading(submitBtn, true, 'Sending link...');

    try {
      const client = this.getClient();
      const redirectUrl = window.location.origin + window.location.pathname;

      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        this.showAlert('forgot', error.message || 'Failed to send password recovery email.', 'error');
      } else {
        this.showAlert('forgot', 'Password reset instructions have been sent to your email address.', 'success');
      }

      this.setButtonLoading(submitBtn, false, 'Send Reset Instructions');
    } catch (err) {
      console.error('Forgot password error:', err);
      this.showAlert('forgot', err.message || 'Failed to send recovery email.', 'error');
      this.setButtonLoading(submitBtn, false, 'Send Reset Instructions');
    }
  }

  async handleResetPassword(e) {
    e.preventDefault();
    this.clearAlerts();

    const newPassword = document.getElementById('reset-password').value;
    const confirmPassword = document.getElementById('reset-confirm-password').value;
    const submitBtn = document.getElementById('btn-submit-reset');

    if (newPassword.length < 6) {
      this.showAlert('reset', 'New password must be at least 6 characters.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showAlert('reset', 'Passwords do not match.', 'error');
      return;
    }

    this.setButtonLoading(submitBtn, true, 'Updating Password...');

    try {
      const client = this.getClient();
      const { error } = await client.auth.updateUser({ password: newPassword });

      if (error) {
        this.showAlert('reset', error.message || 'Failed to update password.', 'error');
        this.setButtonLoading(submitBtn, false, 'Update Password & Sign In');
        return;
      }

      window.location.hash = ''; // Clear recovery hash
      window.app.showToast('Password updated successfully! Welcome back.', 'success');
      this.setButtonLoading(submitBtn, false, 'Update Password & Sign In');
      this.showAuthView('login');
    } catch (err) {
      console.error('Password reset error:', err);
      this.showAlert('reset', err.message || 'Error updating password.', 'error');
      this.setButtonLoading(submitBtn, false, 'Update Password & Sign In');
    }
  }

  async logout() {
    window.app.confirmDialog({
      title: 'Sign Out',
      message: 'Are you sure you want to log out of ProposalFlow? Your local session will be terminated.',
      confirmText: 'Log Out',
      isDanger: false,
      onConfirm: async () => {
        try {
          const client = this.getClient();
          await client.auth.signOut();
          window.app.showToast('You have been logged out.', 'info');
        } catch (err) {
          console.error('Logout error:', err);
        }
      }
    });
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  setButtonLoading(button, isLoading, text) {
    if (!button) return;
    if (isLoading) {
      button.disabled = true;
      button.innerHTML = `<span class="spinner-small"></span> ${text}`;
    } else {
      button.disabled = false;
      button.innerHTML = text;
    }
  }
}

// Global Auth Instance
window.auth = new AuthController();
