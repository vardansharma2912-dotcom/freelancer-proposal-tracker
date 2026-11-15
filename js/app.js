/**
 * Freelancer Proposal Tracker (ProposalFlow) - Main Application Orchestrator
 * Coordinates routing, authentication lifecycle, modals, toasts, global search, and UI state.
 */

class AppController {
  constructor() {
    this.currentView = 'dashboard';
    this.activeModal = null;
  }

  init() {
    this.applyTheme();
    this.bindGlobalEvents();
    if (window.auth) {
      window.auth.init();
    }
  }

  // --- USER LIFECYCLE & PROFILE POPULATION ---
  onUserLoggedIn(user) {
    const profile = window.storage.getProfile();
    this.updateUserProfileUI(profile);
    this.updateSupabaseStatusPill();
    this.initModules();
    this.updateNotificationBell();
    this.showView('dashboard');
  }

  updateUserProfileUI(profile) {
    const name = profile.full_name || profile.name || 'Freelancer';
    const email = profile.email || window.storage.currentUserEmail || '';
    const role = profile.role || 'Full-Stack Freelancer';
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
    if (nameInput) nameInput.value = name;
    if (emailInput) emailInput.value = email;
    if (roleInput) roleInput.value = role;
    if (rateInput) rateInput.value = profile.target_hourly_rate || '$85/hr';
  }

  updateSupabaseStatusPill() {
    const pill = document.getElementById('supabase-status-pill');
    if (!pill) return;

    const isLive = window.supabaseManager.isLiveConnected;
    if (isLive) {
      pill.innerHTML = `<span class="status-dot-green"></span> Supabase Cloud (RLS Active)`;
      pill.title = 'Connected directly to Supabase PostgreSQL with strict Row Level Security';
    } else {
      pill.innerHTML = `<span class="status-dot-amber"></span> Isolated User Engine`;
      pill.title = 'Running on Supabase-compatible multi-user engine. Click to connect your Supabase project.';
    }
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
    const theme = localStorage.getItem('ftp_theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    this.updateThemeIcon(theme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const nextTheme = current === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('ftp_theme', nextTheme);
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

    // Supabase Status Pill click
    const statusPill = document.getElementById('supabase-status-pill');
    if (statusPill) {
      statusPill.addEventListener('click', () => this.openSupabaseConfigModal());
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

    const passwordForm = document.getElementById('settings-password-form');
    if (passwordForm) {
      passwordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
    }

    const supabaseConfigForm = document.getElementById('supabase-config-form');
    if (supabaseConfigForm) {
      supabaseConfigForm.addEventListener('submit', (e) => this.handleSaveSupabaseConfig(e));
    }
  }

  closeUserDropdown() {
    const panel = document.getElementById('user-dropdown-panel');
    if (panel) panel.classList.remove('active');
  }

  initModules() {
    if (window.opportunities) window.opportunities.init();
    if (window.proposals) window.proposals.init();
    if (window.clients) window.clients.init();
    if (window.followups) window.followups.init();
    if (window.calendar) window.calendar.init();
    if (window.notes) window.notes.init();
    if (window.analyticsModule) window.analyticsModule.init();
    if (window.dashboard) window.dashboard.init();
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
            <span class="badge ${window.opportunities.getStatusBadgeClass(p.status)}">${p.status}</span>
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
      window.clients.viewClientProfile(id);
    } else if (type === 'note') {
      this.showView('notes');
      window.notes.openEditModal(id);
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
        <div class="notification-item unread" onclick="window.app.closeNotificationPanel(); window.app.showView('followups'); window.followups.setTab('${isOverdue ? 'overdue' : 'today'}');">
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
            <span class="badge ${window.opportunities.getStatusBadgeClass(opp.status)}">${opp.status}</span>
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

      <div style="display: flex; gap: var(--space-3); margin-top: var(--space-6); justify-content: flex-end;">
        <button class="btn btn-outline" onclick="window.app.closeModal('modal-opp-detail'); window.opportunities.openEditModal('${opp.id}')">
          <i data-lucide="edit-2"></i> Edit Details
        </button>
        <button class="btn btn-primary" onclick="window.app.closeModal('modal-opp-detail'); window.followups.openCreateModal('${opp.id}')">
          <i data-lucide="bell"></i> Schedule Follow-up
        </button>
      </div>
    `;

    this.openModal('modal-opp-detail');
    if (window.lucide) window.lucide.createIcons();
  }

  // --- SETTINGS VIEW LOGIC ---
  populateSettingsForm() {
    const profile = window.storage.getProfile();
    this.updateUserProfileUI(profile);
  }

  async handleSettingsSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('settings-user-name').value.trim();
    const role = document.getElementById('settings-user-role').value.trim();
    const rate = document.getElementById('settings-user-rate').value.trim();

    await window.storage.updateProfile({
      full_name: name,
      role: role,
      target_hourly_rate: rate
    });

    this.updateUserProfileUI(window.storage.getProfile());
    this.showToast('Profile updated and saved to Supabase cloud.', 'success');
  }

  async handlePasswordChange(e) {
    e.preventDefault();

    const newPass = document.getElementById('settings-new-password').value;
    const confirmPass = document.getElementById('settings-confirm-password').value;

    if (newPass.length < 6) {
      this.showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    if (newPass !== confirmPass) {
      this.showToast('New passwords do not match.', 'error');
      return;
    }

    try {
      const client = window.supabaseManager.getClient();
      const { error } = await client.auth.updateUser({ password: newPass });

      if (error) {
        this.showToast(error.message || 'Failed to update password.', 'error');
      } else {
        this.showToast('Password updated successfully!', 'success');
        document.getElementById('settings-password-form').reset();
      }
    } catch (err) {
      this.showToast('Error updating password.', 'error');
    }
  }

  // --- OPTIONAL DEMO DATA (ONLY WHEN USER EXPLICITLY REQUESTS IT) ---
  loadDemoDataWithConfirm() {
    this.confirmDialog({
      title: 'Load Sample Demo Records?',
      message: 'This will add sample freelance opportunities, clients, and follow-ups to your current authenticated account. You can delete or clear them at any time.',
      confirmText: 'Load Demo Data',
      isDanger: false,
      onConfirm: async () => {
        await window.storage.loadSampleDemoData();
        this.refreshAll();
        this.showToast('Sample demonstration records loaded into your account.', 'success');
      }
    });
  }

  clearMyDataWithConfirm() {
    this.confirmDialog({
      title: 'Erase All My Data',
      message: 'Are you sure you want to permanently delete all your opportunities, clients, notes and follow-ups from your Supabase cloud database? This cannot be undone.',
      confirmText: 'Erase All My Data',
      isDanger: true,
      onConfirm: async () => {
        await window.storage.clearUserData();
        this.refreshAll();
        this.showToast('All your workspace records have been deleted.', 'info');
      }
    });
  }

  // --- SUPABASE CONFIGURATION MODAL ---
  openSupabaseConfigModal() {
    const config = window.supabaseManager.getConfig();
    const urlInput = document.getElementById('supabase-cfg-url');
    const keyInput = document.getElementById('supabase-cfg-key');

    if (urlInput) urlInput.value = config.url && !config.url.includes('xyzcompany') ? config.url : '';
    if (keyInput) keyInput.value = config.anonKey && !config.anonKey.includes('mock_key') ? config.anonKey : '';

    this.openModal('modal-supabase-config');
  }

  handleSaveSupabaseConfig(e) {
    e.preventDefault();

    const url = document.getElementById('supabase-cfg-url').value.trim();
    const key = document.getElementById('supabase-cfg-key').value.trim();

    if (!url || !key) {
      this.showToast('Please provide both Project URL and Public Anon Key', 'error');
      return;
    }

    const saved = window.supabaseManager.saveConfig(url, key);
    if (saved) {
      this.updateSupabaseStatusPill();
      this.closeModal('modal-supabase-config');
      this.showToast('Supabase configuration saved! Reloading session...', 'success');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      this.showToast('Failed to save configuration.', 'error');
    }
  }

  escapeHTML(str) {
    if (!str) return '';
    return str
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
