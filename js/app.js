/**
 * Freelancer Proposal Tracker (ProposalFlow) - Main Application Orchestrator
 * Coordinates routing, one-time local profile onboarding, modals, toasts, global search, and UI state.
 * 100% Client-Side with Zero Backend Dependencies.
 */

class AppController {
  constructor() {
    this.currentView = 'dashboard';
    this.activeModal = null;
    this.modulesInitialized = false;
  }

  init() {
    this.applyTheme();
    this.bindGlobalEvents();

    // Check if user has an active profile in localStorage (key: "userProfile")
    const hasProfile = window.storage.init();
    if (hasProfile) {
      this.showAppShell();
    } else {
      this.showOnboarding();
    }
  }

  // --- ONBOARDING & APP SHELL DISPLAY ---
  showOnboarding() {
    const overlay = document.getElementById('onboarding-overlay');
    const shell = document.getElementById('app-shell');
    if (overlay) overlay.style.display = 'flex';
    if (shell) shell.style.display = 'none';
    if (window.lucide) window.lucide.createIcons();
  }

  showAppShell() {
    const overlay = document.getElementById('onboarding-overlay');
    const shell = document.getElementById('app-shell');
    if (overlay) overlay.style.display = 'none';
    if (shell) shell.style.display = 'flex';

    const profile = window.storage.getProfile();
    this.updateUserProfileUI(profile);
    this.initModules();
    this.updateNotificationBell();
    this.showView('dashboard');
    if (window.lucide) window.lucide.createIcons();
  }

  // --- USER PROFILE UI POPULATION ---
  updateUserProfileUI(profile) {
    if (!profile) return;
    const name = profile.fullName || profile.full_name || 'Freelancer';
    const email = profile.email || 'freelancer@workspace.local';
    const role = profile.title || profile.role || 'Full-Stack Freelancer';
    const initial = name.charAt(0).toUpperCase();

    // 1. Sidebar Profile Card
    const sideName = document.querySelector('.sidebar-user-name');
    const sideRole = document.querySelector('.sidebar-user-role');
    const sideAvatar = document.querySelector('.sidebar-user-avatar');
    if (sideName) sideName.textContent = name;
    if (sideRole) sideRole.textContent = role;
    if (sideAvatar) sideAvatar.textContent = initial;

    // 2. Topbar Profile Menu
    const topAvatar = document.getElementById('topbar-user-avatar');
    const dropName = document.getElementById('dropdown-user-name');
    const dropEmail = document.getElementById('dropdown-user-email');
    if (topAvatar) topAvatar.textContent = initial;
    if (dropName) dropName.textContent = name;
    if (dropEmail) dropEmail.textContent = email;

    // 3. Settings View Fields
    const nameInput = document.getElementById('settings-user-name');
    const emailInput = document.getElementById('settings-user-email');
    const roleInput = document.getElementById('settings-user-role');
    const rateInput = document.getElementById('settings-user-rate');
    const currInput = document.getElementById('settings-user-currency');
    const platInput = document.getElementById('settings-user-platform');
    const goalInput = document.getElementById('settings-user-goal');
    if (nameInput) nameInput.value = name;
    if (emailInput) emailInput.value = email;
    if (roleInput) roleInput.value = role;
    if (rateInput) rateInput.value = profile.hourlyRate || profile.target_hourly_rate || '$85/hr';
    if (currInput) currInput.value = profile.currency || 'USD';
    if (platInput) platInput.value = profile.primaryPlatform || 'Direct Outreach';
    if (goalInput) goalInput.value = profile.weeklyGoal || '';
  }

  // --- VIEW ROUTING ---
  showView(viewName) {
    this.currentView = viewName;

    // Update navigation active states
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-view') === viewName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Hide all view sections, show active view
    document.querySelectorAll('.view-section').forEach(section => {
      section.classList.remove('active');
    });

    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Close mobile sidebar if open
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');

    // Trigger specific module render
    switch (viewName) {
      case 'dashboard':
        if (window.dashboard) window.dashboard.refresh();
        break;
      case 'opportunities':
        if (window.opportunities) window.opportunities.render();
        break;
      case 'proposals':
        if (window.proposals) window.proposals.render();
        break;
      case 'clients':
        if (window.clients) window.clients.render();
        break;
      case 'followups':
        if (window.followups) window.followups.render();
        break;
      case 'calendar':
        if (window.calendar) window.calendar.render();
        break;
      case 'notes':
        if (window.notes) window.notes.render();
        break;
      case 'analytics':
        if (window.analyticsModule) window.analyticsModule.render();
        break;
      case 'settings':
        this.populateSettingsForm();
        break;
    }

    if (window.lucide) window.lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- THEME TOGGLE (LIGHT / DARK) ---
  applyTheme() {
    let theme = 'light';
    try {
      theme = localStorage.getItem('ftp_theme') || 'light';
    } catch (e) {
      theme = 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
    this.updateThemeIcon(theme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const nextTheme = current === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('ftp_theme', nextTheme);
    } catch (e) {}
    this.updateThemeIcon(nextTheme);

    // Refresh charts to match theme colors
    if (window.dashboard) window.dashboard.renderCharts();
    if (window.analyticsModule) window.analyticsModule.renderAnalyticsCharts();

    this.showToast(`Switched to ${nextTheme} mode`, 'info');
  }

  updateThemeIcon(theme) {
    const iconWrapper = document.getElementById('theme-toggle-icon');
    if (!iconWrapper) return;
    iconWrapper.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
    if (window.lucide) window.lucide.createIcons();
  }

  // --- GLOBAL EVENT LISTENERS ---
  bindGlobalEvents() {
    // Navigation items click
    document.querySelectorAll('.nav-link[data-view]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.getAttribute('data-view');
        this.showView(view);
      });
    });

    // Theme toggle button
    const themeBtn = document.getElementById('btn-toggle-theme');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Sidebar collapse button
    const collapseBtn = document.getElementById('btn-toggle-sidebar');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-collapsed');
      });
    }

    // Mobile menu toggle button
    const mobileBtn = document.getElementById('btn-mobile-menu');
    if (mobileBtn) {
      mobileBtn.addEventListener('click', () => {
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar) sidebar.classList.toggle('mobile-open');
      });
    }

    // User Avatar Menu Dropdown Toggle
    const userMenuBtn = document.getElementById('btn-user-avatar-menu');
    if (userMenuBtn) {
      userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const panel = document.getElementById('user-dropdown-panel');
        if (panel) panel.classList.toggle('active');
      });
    }

    // Global Search input & dropdown
    const globalSearchInput = document.getElementById('global-search-input');
    if (globalSearchInput) {
      globalSearchInput.addEventListener('input', (e) => this.handleGlobalSearch(e.target.value));
      globalSearchInput.addEventListener('focus', (e) => {
        if (e.target.value.trim().length > 0) this.handleGlobalSearch(e.target.value);
      });

      // Keyboard shortcut Ctrl+K
      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          globalSearchInput.focus();
        } else if (e.key === 'Escape') {
          this.closeGlobalSearch();
          this.closeNotificationPanel();
          this.closeUserDropdown();
          if (this.activeModal) this.closeModal(this.activeModal);
        }
      });
    }

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      const searchBox = document.querySelector('.header-search-box');
      if (searchBox && !searchBox.contains(e.target)) {
        this.closeGlobalSearch();
      }

      const notifArea = document.querySelector('.notification-wrapper');
      if (notifArea && !notifArea.contains(e.target)) {
        this.closeNotificationPanel();
      }

      const userMenuWrapper = document.querySelector('.user-menu-wrapper');
      if (userMenuWrapper && !userMenuWrapper.contains(e.target)) {
        this.closeUserDropdown();
      }
    });

    // Notification Bell button
    const notifBtn = document.getElementById('btn-notification-bell');
    if (notifBtn) {
      notifBtn.addEventListener('click', () => this.toggleNotificationPanel());
    }

    // Modal backdrop click to close
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          const modalId = backdrop.getAttribute('id');
          this.closeModal(modalId);
        }
      });
    });

    // Form submit handlers
    const onboardForm = document.getElementById('onboarding-form');
    if (onboardForm) {
      onboardForm.addEventListener('submit', (e) => this.handleOnboardingSubmit(e));
    }

    const modalEditProfileForm = document.getElementById('modal-edit-profile-form');
    if (modalEditProfileForm) {
      modalEditProfileForm.addEventListener('submit', (e) => this.handleEditProfileSubmit(e));
    }

    const oppForm = document.getElementById('opportunity-form');
    if (oppForm) {
      oppForm.addEventListener('submit', (e) => window.opportunities.handleFormSubmit(e));
    }

    const clientForm = document.getElementById('client-form');
    if (clientForm) {
      clientForm.addEventListener('submit', (e) => window.clients.handleFormSubmit(e));
    }

    const followupForm = document.getElementById('followup-form');
    if (followupForm) {
      followupForm.addEventListener('submit', (e) => window.followups.handleFormSubmit(e));
    }

    const noteForm = document.getElementById('note-form');
    if (noteForm) {
      noteForm.addEventListener('submit', (e) => window.notes.handleFormSubmit(e));
    }

    const settingsForm = document.getElementById('settings-profile-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => this.handleSettingsSubmit(e));
    }
  }

  closeUserDropdown() {
    const panel = document.getElementById('user-dropdown-panel');
    if (panel) panel.classList.remove('active');
  }

  initModules() {
    if (this.modulesInitialized) return;
    if (window.opportunities) window.opportunities.init();
    if (window.proposals) window.proposals.init();
    if (window.clients) window.clients.init();
    if (window.followups) window.followups.init();
    if (window.calendar) window.calendar.init();
    if (window.notes) window.notes.init();
    if (window.analyticsModule) window.analyticsModule.init();
    if (window.dashboard) window.dashboard.init();
    this.modulesInitialized = true;
  }

  refreshAll() {
    if (window.dashboard) window.dashboard.refresh();
    if (window.opportunities) window.opportunities.render();
    if (window.proposals) window.proposals.render();
    if (window.clients) window.clients.render();
    if (window.followups) window.followups.render();
    if (window.calendar) window.calendar.render();
    if (window.notes) window.notes.render();
    if (window.analyticsModule) window.analyticsModule.render();
    this.updateNotificationBell();
    if (window.lucide) window.lucide.createIcons();
  }

  // --- ONBOARDING FORM HANDLER ---
  handleOnboardingSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('onboard-name');
    const emailInput = document.getElementById('onboard-email');
    const titleInput = document.getElementById('onboard-title');
    const rateInput = document.getElementById('onboard-rate');
    const currInput = document.getElementById('onboard-currency');
    const platInput = document.getElementById('onboard-platform');
    const goalInput = document.getElementById('onboard-goal');
    const alertBox = document.getElementById('onboarding-alert');

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const title = titleInput ? titleInput.value.trim() : '';
    const rate = rateInput ? rateInput.value.trim() : '';
    const currency = currInput ? currInput.value : 'USD';
    const primaryPlatform = platInput ? platInput.value : 'Direct Outreach';
    const weeklyGoal = goalInput ? goalInput.value.trim() : '';

    if (!name || name.length < 2) {
      if (alertBox) {
        alertBox.textContent = 'Please enter your full name (at least 2 characters).';
        alertBox.style.display = 'block';
      }
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      if (alertBox) {
        alertBox.textContent = 'Please provide a valid email address.';
        alertBox.style.display = 'block';
      }
      return;
    }

    if (!title) {
      if (alertBox) {
        alertBox.textContent = 'Please enter your professional role or title.';
        alertBox.style.display = 'block';
      }
      return;
    }

    if (!rate) {
      if (alertBox) {
        alertBox.textContent = 'Please enter your target hourly rate.';
        alertBox.style.display = 'block';
      }
      return;
    }

    if (alertBox) alertBox.style.display = 'none';

    const profileData = {
      fullName: name,
      email,
      title,
      hourlyRate: rate,
      currency,
      primaryPlatform,
      weeklyGoal
    };

    const saved = window.storage.saveUserProfile(profileData);
    if (saved) {
      const loadSampleBox = document.getElementById('onboard-load-sample');
      const shouldSeed = loadSampleBox ? loadSampleBox.checked : true;
      if (shouldSeed && window.storage.getProposals().length === 0) {
        window.storage.loadSampleDemoData();
      }
      this.showAppShell();
      this.refreshAll();
      this.showToast(`Welcome, ${name}! Your freelance workspace is set up.`, 'success');
    } else {
      if (alertBox) {
        alertBox.textContent = 'Failed to save profile to browser storage. Please check permissions.';
        alertBox.style.display = 'block';
      }
    }
  }

  // --- EDIT PROFILE MODAL ---
  openEditProfileModal() {
    const profile = window.storage.getProfile();
    const nameInput = document.getElementById('edit-profile-name');
    const emailInput = document.getElementById('edit-profile-email');
    const titleInput = document.getElementById('edit-profile-title');
    const rateInput = document.getElementById('edit-profile-rate');
    const currInput = document.getElementById('edit-profile-currency');
    const platInput = document.getElementById('edit-profile-platform');
    const goalInput = document.getElementById('edit-profile-goal');

    if (nameInput) nameInput.value = profile.fullName || profile.full_name || '';
    if (emailInput) emailInput.value = profile.email || '';
    if (titleInput) titleInput.value = profile.title || profile.role || '';
    if (rateInput) rateInput.value = profile.hourlyRate || profile.target_hourly_rate || '';
    if (currInput) currInput.value = profile.currency || 'USD';
    if (platInput) platInput.value = profile.primaryPlatform || 'Direct Outreach';
    if (goalInput) goalInput.value = profile.weeklyGoal || '';

    this.openModal('modal-edit-profile');
  }

  handleEditProfileSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('edit-profile-name')?.value.trim();
    const email = document.getElementById('edit-profile-email')?.value.trim();
    const title = document.getElementById('edit-profile-title')?.value.trim();
    const hourlyRate = document.getElementById('edit-profile-rate')?.value.trim();
    const currency = document.getElementById('edit-profile-currency')?.value;
    const primaryPlatform = document.getElementById('edit-profile-platform')?.value;
    const weeklyGoal = document.getElementById('edit-profile-goal')?.value.trim();

    if (!name || name.length < 2) {
      this.showToast('Please enter a valid full name.', 'error');
      return;
    }

    const updated = {
      fullName: name,
      email,
      title,
      hourlyRate,
      currency,
      primaryPlatform,
      weeklyGoal
    };

    window.storage.saveUserProfile(updated);
    this.updateUserProfileUI(updated);
    this.closeModal('modal-edit-profile');
    this.showToast('Profile updated successfully!', 'success');
  }

  // --- SETTINGS VIEW HANDLER ---
  populateSettingsForm() {
    const profile = window.storage.getProfile();
    this.updateUserProfileUI(profile);
  }

  handleSettingsSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('settings-user-name')?.value.trim();
    const email = document.getElementById('settings-user-email')?.value.trim();
    const title = document.getElementById('settings-user-role')?.value.trim();
    const hourlyRate = document.getElementById('settings-user-rate')?.value.trim();
    const currency = document.getElementById('settings-user-currency')?.value;
    const primaryPlatform = document.getElementById('settings-user-platform')?.value;
    const weeklyGoal = document.getElementById('settings-user-goal')?.value.trim();

    if (!name || name.length < 2) {
      this.showToast('Full name is required.', 'error');
      return;
    }

    const updated = {
      fullName: name,
      email,
      title,
      hourlyRate,
      currency,
      primaryPlatform,
      weeklyGoal
    };

    window.storage.saveUserProfile(updated);
    this.updateUserProfileUI(updated);
    this.showToast('Profile settings saved to local storage.', 'success');
  }

  // --- RESET ALL DATA & RETURN TO ONBOARDING ---
  resetDataWithConfirm() {
    this.confirmDialog({
      title: 'Reset All Data & Re-Onboard?',
      message: 'This will permanently remove all stored opportunities, proposals, clients, notes, reminders, and your profile from this browser. You will be returned to the initial setup form.',
      confirmText: 'Yes, Reset All Data',
      isDanger: true,
      onConfirm: () => {
        window.storage.resetAllData();
        const onboardForm = document.getElementById('onboarding-form');
        if (onboardForm) onboardForm.reset();
        this.modulesInitialized = false;
        this.showOnboarding();
        this.showToast('All local application data has been wiped.', 'info');
      }
    });
  }

  // --- OPTIONAL DEMO DATA (ON DEMAND) ---
  loadDemoDataWithConfirm() {
    this.confirmDialog({
      title: 'Load Sample Demo Records?',
      message: 'This will add realistic sample freelance opportunities, clients, and follow-ups to your local workspace for evaluation. You can clear or reset them anytime.',
      confirmText: 'Load Demo Data',
      isDanger: false,
      onConfirm: async () => {
        await window.storage.loadSampleDemoData();
        this.refreshAll();
        this.showToast('Sample demonstration records loaded into your workspace.', 'success');
      }
    });
  }

  clearMyDataWithConfirm() {
    this.confirmDialog({
      title: 'Erase Pipeline Records?',
      message: 'Are you sure you want to delete all current opportunities, clients, notes, and follow-ups from your browser? Your profile settings will be kept.',
      confirmText: 'Erase Pipeline Records',
      isDanger: true,
      onConfirm: async () => {
        await window.storage.clearUserData();
        this.refreshAll();
        this.showToast('All pipeline records have been cleared.', 'info');
      }
    });
  }

  // --- GLOBAL SEARCH ---
  handleGlobalSearch(query) {
    const dropdown = document.getElementById('global-search-dropdown');
    if (!dropdown) return;

    const q = query.toLowerCase().trim();
    if (!q) {
      dropdown.classList.remove('active');
      return;
    }

    const proposals = window.storage.getProposals().filter(p =>
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.clientName && p.clientName.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    ).slice(0, 5);

    const clients = window.storage.getClients().filter(c =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
      (c.industry && c.industry.toLowerCase().includes(q))
    ).slice(0, 4);

    const notes = window.storage.getNotes().filter(n =>
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.content && n.content.toLowerCase().includes(q))
    ).slice(0, 3);

    if (proposals.length === 0 && clients.length === 0 && notes.length === 0) {
      dropdown.innerHTML = '<div style="padding: var(--space-4); text-align: center; color: var(--text-muted); font-size: 0.8125rem;">No matching proposals, clients or notes found.</div>';
      dropdown.classList.add('active');
      return;
    }

    let html = '';

    if (proposals.length > 0) {
      html += '<div class="search-group-title">Proposals & Opportunities</div>';
      proposals.forEach(p => {
        html += `
          <div class="search-result-item" onclick="window.app.onSearchResultClick('opp', '${p.id}')">
            <div>
              <div style="font-weight: 600; font-size: 0.875rem; color: var(--text-primary);">${this.escapeHTML(p.title)}</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">${this.escapeHTML(p.clientName)} &bull; ${p.currency} ${Number(p.value).toLocaleString()}</div>
            </div>
            <span class="badge ${window.opportunities ? window.opportunities.getStatusBadgeClass(p.status) : 'badge-neutral'}">${p.status}</span>
          </div>
        `;
      });
    }

    if (clients.length > 0) {
      html += '<div class="search-group-title">Clients</div>';
      clients.forEach(c => {
        html += `
          <div class="search-result-item" onclick="window.app.onSearchResultClick('client', '${c.id}')">
            <div>
              <div style="font-weight: 600; font-size: 0.875rem; color: var(--text-primary);">${this.escapeHTML(c.name)}</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">${this.escapeHTML(c.contactPerson || '')} &bull; ${this.escapeHTML(c.industry || 'Client')}</div>
            </div>
            <i data-lucide="chevron-right" style="width: 14px; height: 14px; color: var(--text-muted);"></i>
          </div>
        `;
      });
    }

    if (notes.length > 0) {
      html += '<div class="search-group-title">Notes</div>';
      notes.forEach(n => {
        html += `
          <div class="search-result-item" onclick="window.app.onSearchResultClick('note', '${n.id}')">
            <div>
              <div style="font-weight: 600; font-size: 0.875rem; color: var(--text-primary);">${this.escapeHTML(n.title)}</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">${this.escapeHTML(n.clientName || 'General')}</div>
            </div>
            <i data-lucide="file-text" style="width: 14px; height: 14px; color: var(--text-muted);"></i>
          </div>
        `;
      });
    }

    dropdown.innerHTML = html;
    dropdown.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }

  onSearchResultClick(type, id) {
    this.closeGlobalSearch();
    if (type === 'opp') {
      this.viewOpportunityDetail(id);
    } else if (type === 'client') {
      this.showView('clients');
      if (window.clients) window.clients.viewClientProfile(id);
    } else if (type === 'note') {
      this.showView('notes');
      if (window.notes) window.notes.openEditModal(id);
    }
  }

  closeGlobalSearch() {
    const dropdown = document.getElementById('global-search-dropdown');
    if (dropdown) dropdown.classList.remove('active');
  }

  // --- NOTIFICATION CENTER ---
  toggleNotificationPanel() {
    const panel = document.getElementById('notification-panel');
    if (!panel) return;
    panel.classList.toggle('active');
    if (panel.classList.contains('active')) {
      this.renderNotificationList();
    }
  }

  closeNotificationPanel() {
    const panel = document.getElementById('notification-panel');
    if (panel) panel.classList.remove('active');
  }

  updateNotificationBell() {
    const dot = document.getElementById('notification-bell-dot');
    if (!dot) return;

    const followups = window.storage.getFollowups();
    const proposals = window.storage.getProposals();
    const today = new Date().toISOString().split('T')[0];

    const overdueFollowups = followups.filter(f => !f.completed && f.dueDate <= today);
    const urgentDeadlines = proposals.filter(p => p.deadline && p.deadline <= today && p.status !== 'Accepted');

    if (overdueFollowups.length > 0 || urgentDeadlines.length > 0) {
      dot.style.display = 'block';
    } else {
      dot.style.display = 'none';
    }
  }

  renderNotificationList() {
    const list = document.getElementById('notification-list');
    if (!list) return;

    const followups = window.storage.getFollowups();
    const proposals = window.storage.getProposals();
    const today = new Date().toISOString().split('T')[0];

    const urgentFollowups = followups.filter(f => !f.completed && f.dueDate <= today);
    const urgentDeadlines = proposals.filter(p => p.deadline && p.deadline <= today && p.status !== 'Accepted');

    if (urgentFollowups.length === 0 && urgentDeadlines.length === 0) {
      list.innerHTML = `
        <div style="padding: var(--space-6); text-align: center; color: var(--text-muted);">
          <i data-lucide="check-circle-2" style="width: 32px; height: 32px; color: var(--success-500); margin-bottom: 8px;"></i>
          <p style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">All clear!</p>
          <p style="font-size: 0.75rem;">No overdue follow-ups or critical deadlines right now.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    let html = '';

    urgentFollowups.forEach(f => {
      const isOverdue = f.dueDate < today;
      html += `
        <div class="notification-item unread" onclick="window.app.closeNotificationPanel(); window.app.showView('followups'); if(window.followups) window.followups.setTab('${isOverdue ? 'overdue' : 'today'}');">
          <div style="color: ${isOverdue ? 'var(--danger-500)' : 'var(--warning-500)'}; flex-shrink: 0; margin-top: 2px;">
            <i data-lucide="bell" style="width: 16px; height: 16px;"></i>
          </div>
          <div>
            <div style="font-size: 0.8125rem; font-weight: 700; color: var(--text-primary);">Follow-up: ${this.escapeHTML(f.clientName)}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">${this.escapeHTML(f.notes || 'Reminder')}</div>
            <div style="font-size: 0.6875rem; color: var(--danger-500); font-weight: 600; margin-top: 2px;">Due: ${f.dueDate}</div>
          </div>
        </div>
      `;
    });

    urgentDeadlines.forEach(p => {
      html += `
        <div class="notification-item unread" onclick="window.app.closeNotificationPanel(); window.app.viewOpportunityDetail('${p.id}');">
          <div style="color: var(--danger-500); flex-shrink: 0; margin-top: 2px;">
            <i data-lucide="clock" style="width: 16px; height: 16px;"></i>
          </div>
          <div>
            <div style="font-size: 0.8125rem; font-weight: 700; color: var(--text-primary);">Deadline: ${this.escapeHTML(p.title)}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">${this.escapeHTML(p.clientName)} &bull; ${p.currency} ${Number(p.value).toLocaleString()}</div>
            <div style="font-size: 0.6875rem; color: var(--danger-500); font-weight: 600; margin-top: 2px;">Deadline: ${p.deadline}</div>
          </div>
        </div>
      `;
    });

    list.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  }

  // --- MODAL SYSTEM ---
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add('active');
    this.activeModal = modalId;
    document.body.style.overflow = 'hidden';
    if (window.lucide) window.lucide.createIcons();
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('active');
    this.activeModal = null;
    document.body.style.overflow = '';
  }

  // --- CONFIRMATION DIALOG ---
  confirmDialog({ title, message, confirmText = 'Confirm', isDanger = false, onConfirm }) {
    const titleEl = document.getElementById('modal-confirm-title');
    const msgEl = document.getElementById('modal-confirm-message');
    const btnConfirm = document.getElementById('modal-confirm-btn');

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    if (btnConfirm) {
      btnConfirm.textContent = confirmText;
      btnConfirm.className = isDanger ? 'btn btn-danger' : 'btn btn-primary';

      btnConfirm.onclick = () => {
        this.closeModal('modal-confirm');
        if (typeof onConfirm === 'function') onConfirm();
      };
    }

    this.openModal('modal-confirm');
  }

  // --- TOAST SYSTEM ---
  showToast(message, type = 'info', title = null, duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconName = 'info';
    let defaultTitle = 'Notification';
    if (type === 'success') { iconName = 'check-circle'; defaultTitle = 'Success'; }
    else if (type === 'error') { iconName = 'alert-circle'; defaultTitle = 'Error'; }
    else if (type === 'warning') { iconName = 'alert-triangle'; defaultTitle = 'Warning'; }

    toast.innerHTML = `
      <div class="toast-icon"><i data-lucide="${iconName}"></i></div>
      <div class="toast-content">
        <div class="toast-title">${title || defaultTitle}</div>
        <div class="toast-message">${message}</div>
      </div>
      <div class="toast-close" onclick="this.parentElement.remove()">&times;</div>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  // --- OPPORTUNITY DETAIL VIEW MODAL ---
  viewOpportunityDetail(id) {
    const opp = window.storage.getProposalById(id);
    if (!opp) return;

    const client = window.storage.getClientById(opp.clientId);
    const titleEl = document.getElementById('modal-opp-detail-title');
    if (titleEl) titleEl.textContent = opp.title;

    const bodyEl = document.getElementById('modal-opp-detail-body');
    if (!bodyEl) return;

    bodyEl.innerHTML = `
      <div class="detail-meta-grid">
        <div class="detail-meta-item">
          <span class="detail-label">Status</span>
          <span class="detail-value">
            <span class="badge ${window.opportunities ? window.opportunities.getStatusBadgeClass(opp.status) : 'badge-neutral'}">${opp.status}</span>
          </span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-label">Project Value</span>
          <span class="detail-value" style="color: var(--primary-600); font-size: 1.125rem;">
            ${opp.currency} ${Number(opp.value).toLocaleString()}
          </span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-label">Client / Company</span>
          <span class="detail-value">
            <strong>${this.escapeHTML(opp.clientName)}</strong>
            ${client ? ` <button class="btn btn-outline btn-sm" style="padding: 2px 6px; font-size: 0.6875rem;" onclick="window.app.closeModal('modal-opp-detail'); window.clients.viewClientProfile('${client.id}')">Profile</button>` : ''}
          </span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-label">Platform / Source</span>
          <span class="detail-value"><span class="platform-tag">${this.escapeHTML(opp.platform)}</span></span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-label">Discovered Date</span>
          <span class="detail-value">${opp.dateDiscovered || 'Not specified'}</span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-label">Application Deadline</span>
          <span class="detail-value">${opp.deadline || 'No deadline'}</span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-label">Submission Date</span>
          <span class="detail-value">${opp.submissionDate || 'Not yet submitted'}</span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-label">Priority</span>
          <span class="detail-value">${opp.priority || 'Medium'}</span>
        </div>
      </div>

      <div style="margin-bottom: var(--space-5);">
        <h4 style="font-size: 0.875rem; font-weight: 700; margin-bottom: var(--space-2); text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Project Description</h4>
        <div style="background: var(--bg-surface-secondary); padding: var(--space-4); border-radius: var(--radius-md); font-size: 0.875rem; line-height: 1.6; color: var(--text-primary); white-space: pre-wrap;">
          ${this.escapeHTML(opp.description || 'No description entered.')}
        </div>
      </div>

      <div style="margin-bottom: var(--space-5);">
        <h4 style="font-size: 0.875rem; font-weight: 700; margin-bottom: var(--space-2); text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Proposal Notes & Cover Letter Snippets</h4>
        <div style="background: var(--bg-surface-secondary); padding: var(--space-4); border-radius: var(--radius-md); font-size: 0.875rem; line-height: 1.6; color: var(--text-primary); white-space: pre-wrap;">
          ${this.escapeHTML(opp.notes || 'No internal notes recorded.')}
        </div>
      </div>

      <div style="display: flex; gap: var(--space-3); margin-top: var(--space-6); justify-content: flex-end; flex-wrap: wrap;">
        <button class="btn btn-outline" onclick="window.app.closeModal('modal-opp-detail'); if(window.opportunities) window.opportunities.openEditModal('${opp.id}')">
          <i data-lucide="edit-2"></i> Edit Details
        </button>
        <button class="btn btn-primary" onclick="window.app.closeModal('modal-opp-detail'); if(window.followups) window.followups.openCreateModal('${opp.id}')">
          <i data-lucide="bell"></i> Schedule Follow-up
        </button>
      </div>
    `;

    this.openModal('modal-opp-detail');
    if (window.lucide) window.lucide.createIcons();
  }

  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Global App Instance
window.app = new AppController();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
