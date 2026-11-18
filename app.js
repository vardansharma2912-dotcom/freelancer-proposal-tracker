/**
 * ProposalFlow - Consolidated Application Engine
 * Modules: Storage, Dashboard, Opportunities, Proposals, Clients, Follow-ups, Calendar, Notes, Analytics, App Controller
 */

/* ===== js/storage.js ===== */
/**
 * Freelancer Proposal Tracker (ProposalFlow) - Pure Local Storage Engine
 * Zero external servers, zero cloud dependencies.
 * All user profile and pipeline data resides securely in browser localStorage.
 */

class StorageController {
  constructor() {
    this.currentProfile = null;
    this.proposals = [];
    this.clients = [];
    this.followups = [];
    this.notes = [];
    this.activities = [];
    this.isLoading = false;
  }

  /**
   * Initializes data store on application boot.
   * Reads profile and stored datasets from localStorage with defensive error handling.
   */
  init() {
    this.currentProfile = this.getUserProfile();
    this.proposals = this.safeLoadArray('ftp_proposals');
    this.clients = this.safeLoadArray('ftp_clients');
    this.followups = this.safeLoadArray('ftp_followups');
    this.notes = this.safeLoadArray('ftp_notes');
    this.activities = this.safeLoadArray('ftp_activities');

    // Auto-seed sample demo records if profile exists and dataset is empty
    // so the live application never shows zeroes on initial run
    if (this.hasValidProfile() && this.proposals.length === 0) {
      this.loadSampleDemoData();
    }

    return this.hasValidProfile();
  }

  // --- SAFE LOCAL STORAGE HELPERS ---
  safeLoadArray(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn(`[Storage] Failed to parse array for key "${key}", resetting to empty:`, err);
      return [];
    }
  }

  safeSave(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (err) {
      console.error(`[Storage] Failed to save key "${key}" to localStorage:`, err);
      return false;
    }
  }

  // --- USER PROFILE MANAGEMENT ---
  /**
   * Retrieves the saved profile from localStorage under key "userProfile".
   * Returns parsed profile object or null if missing or corrupted.
   */
  getUserProfile() {
    try {
      const raw = localStorage.getItem('userProfile');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !parsed.fullName) {
        return null;
      }
      return parsed;
    } catch (err) {
      console.warn('[Storage] Corrupted userProfile in localStorage:', err);
      return null;
    }
  }

  hasValidProfile() {
    const profile = this.getUserProfile();
    return !!(profile && profile.fullName && profile.fullName.trim().length > 0);
  }

  /**
   * Saves or updates the user profile under key "userProfile".
   */
  saveUserProfile(profileData) {
    if (!profileData || typeof profileData !== 'object') return false;

    const sanitized = {
      fullName: (profileData.fullName || profileData.full_name || '').trim(),
      title: (profileData.title || profileData.role || 'Freelancer').trim(),
      email: (profileData.email || '').trim().toLowerCase(),
      hourlyRate: profileData.hourlyRate || profileData.target_hourly_rate || '$85/hr',
      currency: profileData.currency || 'USD',
      primaryPlatform: profileData.primaryPlatform || 'Direct Outreach',
      weeklyGoal: profileData.weeklyGoal || '$5,000 / month',
      updatedAt: new Date().toISOString()
    };

    if (!sanitized.fullName) {
      console.error('[Storage] Cannot save profile: fullName is required');
      return false;
    }

    const saved = this.safeSave('userProfile', sanitized);
    if (saved) {
      this.currentProfile = sanitized;
    }
    return saved;
  }

  getProfile() {
    if (!this.currentProfile) {
      this.currentProfile = this.getUserProfile();
    }
    return this.currentProfile || {
      fullName: 'Freelancer',
      title: 'Full-Stack Freelancer',
      email: 'freelancer@workspace.local',
      hourlyRate: '$85/hr',
      currency: 'USD',
      primaryPlatform: 'Direct Outreach'
    };
  }

  async updateProfile(profileData) {
    const current = this.getProfile();
    const merged = { ...current, ...profileData };
    return this.saveUserProfile(merged);
  }

  /**
   * Complete reset: clears localStorage and in-memory caches.
   */
  resetAllData() {
    try {
      localStorage.removeItem('userProfile');
      localStorage.removeItem('ftp_proposals');
      localStorage.removeItem('ftp_clients');
      localStorage.removeItem('ftp_followups');
      localStorage.removeItem('ftp_notes');
      localStorage.removeItem('ftp_activities');
    } catch (err) {
      console.error('[Storage] Error during resetAllData:', err);
    }
    this.currentProfile = null;
    this.proposals = [];
    this.clients = [];
    this.followups = [];
    this.notes = [];
    this.activities = [];
    return true;
  }

  clearUserData() {
    this.proposals = [];
    this.clients = [];
    this.followups = [];
    this.notes = [];
    this.activities = [];
    this.safeSave('ftp_proposals', []);
    this.safeSave('ftp_clients', []);
    this.safeSave('ftp_followups', []);
    this.safeSave('ftp_notes', []);
    this.safeSave('ftp_activities', []);
    return true;
  }

  // --- PROPOSALS & OPPORTUNITIES ---
  getProposals() {
    return this.proposals;
  }

  getProposalById(id) {
    return this.proposals.find(p => p.id === id);
  }

  async addProposal(proposalData) {
    const newId = `OPP-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;
    const nowStr = new Date().toISOString().split('T')[0];

    const proposal = {
      id: newId,
      createdAt: nowStr,
      title: proposalData.title || 'Untitled Opportunity',
      description: proposalData.description || '',
      clientId: proposalData.clientId || null,
      clientName: proposalData.clientName || '',
      platform: proposalData.platform || (this.currentProfile ? this.currentProfile.primaryPlatform : 'Direct Outreach'),
      value: Number(proposalData.value) || 0,
      currency: proposalData.currency || (this.currentProfile ? this.currentProfile.currency : 'USD'),
      dateDiscovered: proposalData.dateDiscovered || nowStr,
      deadline: proposalData.deadline || null,
      submissionDate: proposalData.submissionDate || null,
      status: proposalData.status || 'Draft',
      followUpDate: proposalData.followUpDate || null,
      priority: proposalData.priority || 'Medium',
      notes: proposalData.notes || ''
    };

    this.proposals.unshift(proposal);
    this.safeSave('ftp_proposals', this.proposals);

    this.logActivity('Opportunity Added', `Created "${proposal.title}" (${proposal.currency} ${Number(proposal.value).toLocaleString()})`, 'plus-circle');
    return proposal;
  }

  async updateProposal(id, updatedData) {
    const index = this.proposals.findIndex(p => p.id === id);
    if (index === -1) return null;

    const oldStatus = this.proposals[index].status;
    this.proposals[index] = { ...this.proposals[index], ...updatedData };
    this.safeSave('ftp_proposals', this.proposals);

    if (updatedData.status && updatedData.status !== oldStatus) {
      this.logActivity('Status Changed', `Updated "${this.proposals[index].title}" to ${updatedData.status}`, 'trending-up');
    } else {
      this.logActivity('Proposal Updated', `Modified details of "${this.proposals[index].title}"`, 'edit');
    }

    return this.proposals[index];
  }

  async deleteProposal(id) {
    const target = this.proposals.find(p => p.id === id);
    this.proposals = this.proposals.filter(p => p.id !== id);
    this.safeSave('ftp_proposals', this.proposals);

    // Also remove associated follow-ups
    this.followups = this.followups.filter(f => f.opportunityId !== id);
    this.safeSave('ftp_followups', this.followups);

    if (target) {
      this.logActivity('Opportunity Deleted', `Removed "${target.title}"`, 'trash');
    }
    return true;
  }

  // --- CLIENTS ---
  getClients() {
    return this.clients;
  }

  getClientById(id) {
    return this.clients.find(c => c.id === id);
  }

  async addClient(clientData) {
    const newId = `CLI-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;
    const nowStr = new Date().toISOString().split('T')[0];

    const client = {
      id: newId,
      createdAt: nowStr,
      name: clientData.name || 'New Client',
      contactPerson: clientData.contactPerson || '',
      email: clientData.email || '',
      phone: clientData.phone || '',
      website: clientData.website || '',
      location: clientData.location || '',
      industry: clientData.industry || '',
      notes: clientData.notes || ''
    };

    this.clients.unshift(client);
    this.safeSave('ftp_clients', this.clients);

    this.logActivity('Client Added', `Added new client "${client.name}"`, 'user-plus');
    return client;
  }

  async updateClient(id, updatedData) {
    const index = this.clients.findIndex(c => c.id === id);
    if (index === -1) return null;

    this.clients[index] = { ...this.clients[index], ...updatedData };
    this.safeSave('ftp_clients', this.clients);

    this.logActivity('Client Updated', `Updated profile of "${this.clients[index].name}"`, 'user-check');
    return this.clients[index];
  }

  async deleteClient(id) {
    const target = this.clients.find(c => c.id === id);
    this.clients = this.clients.filter(c => c.id !== id);
    this.safeSave('ftp_clients', this.clients);

    if (target) {
      this.logActivity('Client Deleted', `Removed client "${target.name}"`, 'trash');
    }
    return true;
  }

  // --- FOLLOW-UPS ---
  getFollowups() {
    return this.followups;
  }

  async addFollowup(followupData) {
    const newId = `FOL-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;
    const nowStr = new Date().toISOString().split('T')[0];

    const followup = {
      id: newId,
      completed: false,
      createdAt: nowStr,
      opportunityId: followupData.opportunityId || null,
      opportunityTitle: followupData.opportunityTitle || '',
      clientId: followupData.clientId || null,
      clientName: followupData.clientName || 'Client',
      dueDate: followupData.dueDate || nowStr,
      type: followupData.type || 'Email',
      notes: followupData.notes || ''
    };

    this.followups.unshift(followup);
    this.safeSave('ftp_followups', this.followups);

    this.logActivity('Follow-up Scheduled', `Reminder for "${followup.clientName}" on ${followup.dueDate}`, 'bell');
    return followup;
  }

  async updateFollowup(id, updatedData) {
    const index = this.followups.findIndex(f => f.id === id);
    if (index === -1) return null;

    this.followups[index] = { ...this.followups[index], ...updatedData };
    this.safeSave('ftp_followups', this.followups);

    return this.followups[index];
  }

  async toggleFollowupComplete(id) {
    const index = this.followups.findIndex(f => f.id === id);
    if (index === -1) return null;

    this.followups[index].completed = !this.followups[index].completed;
    this.safeSave('ftp_followups', this.followups);

    const statusText = this.followups[index].completed ? 'Completed' : 'Reopened';
    this.logActivity('Follow-up Updated', `${statusText} follow-up for "${this.followups[index].clientName}"`, 'check');
    return this.followups[index];
  }

  async deleteFollowup(id) {
    this.followups = this.followups.filter(f => f.id !== id);
    this.safeSave('ftp_followups', this.followups);
    return true;
  }

  // --- NOTES ---
  getNotes() {
    return this.notes;
  }

  async addNote(noteData) {
    const newId = `NOT-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const note = {
      id: newId,
      createdAt: formattedDate,
      title: noteData.title || 'Untitled Note',
      content: noteData.content || '',
      clientId: noteData.clientId || null,
      clientName: noteData.clientName || '',
      opportunityId: noteData.opportunityId || null,
      tags: Array.isArray(noteData.tags) ? noteData.tags : []
    };

    this.notes.unshift(note);
    this.safeSave('ftp_notes', this.notes);

    this.logActivity('Note Added', `Added note: "${note.title}"`, 'file-text');
    return note;
  }

  async updateNote(id, updatedData) {
    const index = this.notes.findIndex(n => n.id === id);
    if (index === -1) return null;

    this.notes[index] = { ...this.notes[index], ...updatedData };
    this.safeSave('ftp_notes', this.notes);

    return this.notes[index];
  }

  async deleteNote(id) {
    this.notes = this.notes.filter(n => n.id !== id);
    this.safeSave('ftp_notes', this.notes);
    return true;
  }

  // --- ACTIVITIES ---
  getActivities() {
    return this.activities;
  }

  async logActivity(action, details, icon = 'activity') {
    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newActivity = {
      id: `ACT-${Date.now()}`,
      action,
      details,
      timestamp,
      icon
    };

    this.activities.unshift(newActivity);
    if (this.activities.length > 50) this.activities.pop();
    this.safeSave('ftp_activities', this.activities);
  }

  // --- SAMPLE DEMO DATA (ON-DEMAND SEEDING) ---
  async loadSampleDemoData() {
    const curr = (this.currentProfile && this.currentProfile.currency) || 'USD';
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Dates relative to today for dynamic accuracy
    const pastDate = (days) => {
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      return d.toISOString().split('T')[0];
    };
    const futureDate = (days) => {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    const SAMPLE_CLIENTS = [
      { id: `CLI-DEMO-1`, name: 'Apex FinTech Solutions', contactPerson: 'David Miller', email: 'david@apexfintech.io', phone: '+1 (212) 555-0192', website: 'https://apexfintech.io', location: 'New York, USA', industry: 'FinTech / Banking', notes: 'Series B crypto analytics client. Prefers sprint-based billing.' },
      { id: `CLI-DEMO-2`, name: 'Nexa Health Tech', contactPerson: 'Sarah Jenkins', email: 'sarah.j@nexahealth.com', phone: '+1 (617) 555-4819', website: 'https://nexahealth.com', location: 'Boston, MA', industry: 'Healthcare / SaaS', notes: 'HIPAA-compliant telehealth patient appointment dashboard.' },
      { id: `CLI-DEMO-3`, name: 'CloudScale Infrastructure', contactPerson: 'Elena Rostova', email: 'elena@cloudscale.net', phone: '+44 20 7946 0912', website: 'https://cloudscale.net', location: 'London, UK', industry: 'DevOps / Cloud Services', notes: 'Kubernetes monitoring tool & AWS cost optimization.' },
      { id: `CLI-DEMO-4`, name: 'Quantum Leap Retail', contactPerson: 'Marcus Thorne', email: 'marcus@quantumretail.io', phone: '+1 (512) 555-7381', website: 'https://quantumretail.io', location: 'Austin, TX', industry: 'E-Commerce', notes: 'High-volume Shopify Plus store with custom inventory microservices.' },
      { id: `CLI-DEMO-5`, name: 'BioSynthetix Labs', contactPerson: 'Dr. Aris Vance', email: 'aris@biosynthetix.ai', phone: '+1 (415) 555-9012', website: 'https://biosynthetix.ai', location: 'San Francisco, CA', industry: 'Biotech / AI', notes: 'AI molecular model visualizer web client.' }
    ];

    const SAMPLE_OPPS = [
      { id: `OPP-DEMO-1`, title: 'High-Frequency Crypto Analytics Dashboard', clientId: `CLI-DEMO-1`, clientName: 'Apex FinTech Solutions', platform: 'Upwork', value: 6500, currency: curr, dateDiscovered: pastDate(30), deadline: pastDate(5), submissionDate: pastDate(22), status: 'Accepted', priority: 'High', description: 'Real-time WebSocket market trading dashboard with Chart.js and high-density KPI metrics.', notes: 'Kickoff call completed. 50% milestone deposited.' },
      { id: `OPP-DEMO-2`, title: 'Telehealth Patient Portal UI Overhaul', clientId: `CLI-DEMO-2`, clientName: 'Nexa Health Tech', platform: 'LinkedIn', value: 12000, currency: curr, dateDiscovered: pastDate(20), deadline: futureDate(14), submissionDate: pastDate(10), status: 'Negotiation', priority: 'High', description: 'Accessible HIPAA-compliant medical patient appointment dashboard with calendar booking.', notes: 'Discussing milestone structure and Figma design handoff.' },
      { id: `OPP-DEMO-3`, title: 'Kubernetes Cluster Cost Optimization CLI & Web UI', clientId: `CLI-DEMO-3`, clientName: 'CloudScale Infrastructure', platform: 'Direct Outreach', value: 8500, currency: curr, dateDiscovered: pastDate(15), deadline: futureDate(10), submissionDate: pastDate(8), status: 'Interview', priority: 'High', description: 'Visual multi-cluster AWS/GCP cost monitoring web UI with export capabilities.', notes: 'Technical interview completed with VP of Engineering.' },
      { id: `OPP-DEMO-4`, title: 'Multi-Tenant E-Commerce Inventory Sync Engine', clientId: `CLI-DEMO-4`, clientName: 'Quantum Leap Retail', platform: 'Contra', value: 9200, currency: curr, dateDiscovered: pastDate(12), deadline: futureDate(8), submissionDate: pastDate(4), status: 'Submitted', priority: 'Medium', description: 'RESTful sync middleware connecting Shopify Plus to ERP with inventory reconciliation.', notes: 'Custom proposal submitted with architecture diagram.' },
      { id: `OPP-DEMO-5`, title: 'AI Molecular Model Visualizer Web Client', clientId: `CLI-DEMO-5`, clientName: 'BioSynthetix Labs', platform: 'Referral', value: 14000, currency: curr, dateDiscovered: pastDate(7), deadline: futureDate(21), submissionDate: pastDate(2), status: 'Submitted', priority: 'High', description: 'WebGL/Canvas 3D interactive viewer for protein folding simulations.', notes: 'Client referred by previous colleague; high likelihood of conversion.' },
      { id: `OPP-DEMO-6`, title: 'Mobile Banking Security Compliance Audit & Revamp', clientId: `CLI-DEMO-1`, clientName: 'Apex FinTech Solutions', platform: 'Direct Outreach', value: 11500, currency: curr, dateDiscovered: pastDate(45), deadline: pastDate(20), submissionDate: pastDate(35), status: 'Accepted', priority: 'High', description: 'Security hardening, CSP policy enforcement, and OWASP Top 10 remediation.', notes: 'Project completed successfully and signed off.' },
      { id: `OPP-DEMO-7`, title: 'B2B Wholesale Procurement Portal Prototype', clientId: `CLI-DEMO-4`, clientName: 'Quantum Leap Retail', platform: 'Upwork', value: 5500, currency: curr, dateDiscovered: pastDate(3), deadline: futureDate(18), submissionDate: null, status: 'Draft', priority: 'Medium', description: 'Rapid frontend prototype for vendor self-service purchase order portal.', notes: 'Drafting custom proposal and case studies.' }
    ];

    const SAMPLE_FOLLOWUPS = [
      { id: `FOL-DEMO-1`, opportunityId: `OPP-DEMO-2`, opportunityTitle: 'Telehealth Patient Portal UI Overhaul', clientId: `CLI-DEMO-2`, clientName: 'Nexa Health Tech', dueDate: todayStr, type: 'Call / Meeting', notes: 'Milestone scope review and agreement discussion', completed: false },
      { id: `FOL-DEMO-2`, opportunityId: `OPP-DEMO-3`, opportunityTitle: 'Kubernetes Cluster Cost Optimization CLI & Web UI', clientId: `CLI-DEMO-3`, clientName: 'CloudScale Infrastructure', dueDate: pastDate(1), type: 'Email', notes: 'Send updated technical architecture diagram and client references', completed: false },
      { id: `FOL-DEMO-3`, opportunityId: `OPP-DEMO-4`, opportunityTitle: 'Multi-Tenant E-Commerce Inventory Sync Engine', clientId: `CLI-DEMO-4`, clientName: 'Quantum Leap Retail', dueDate: futureDate(3), type: 'Check-in', notes: 'Check in on proposal review with technical director', completed: false },
      { id: `FOL-DEMO-4`, opportunityId: `OPP-DEMO-5`, opportunityTitle: 'AI Molecular Model Visualizer Web Client', clientId: `CLI-DEMO-5`, clientName: 'BioSynthetix Labs', dueDate: futureDate(6), type: 'Call / Meeting', notes: 'Discovery call with Chief Science Officer', completed: false }
    ];

    const SAMPLE_NOTES = [
      { id: `NOT-DEMO-1`, title: 'High-Ticket SaaS Proposal Opening Framework', content: 'Key structure:\n1. Rephrase the client\'s core pain point with specific technical metrics.\n2. Outline exact milestones with tangible deliverables and acceptance criteria.\n3. Include a 2-minute Loom walkthrough explaining the architecture.\n4. Close with an explicit call to action.', clientId: `CLI-DEMO-1`, clientName: 'Apex FinTech Solutions', tags: ['Strategy', 'Proposals', 'High Ticket'] },
      { id: `NOT-DEMO-2`, title: 'Hourly Rate vs Value-Based Milestone Pricing', content: 'For contracts over $10,000, always anchor against the business value outcome rather than hourly tracking. Break into 3 milestones: Architecture (30%), Implementation (50%), Hardening & Launch (20%).', clientId: null, clientName: '', tags: ['Pricing', 'Negotiation'] },
      { id: `NOT-DEMO-3`, title: 'Client Onboarding Technical Checklist', content: '- Staging repository access & branch permissions\n- Figma design system tokens\n- API documentation & Postman collection\n- Weekly async status format (Slack / Loom)', clientId: `CLI-DEMO-2`, clientName: 'Nexa Health Tech', tags: ['Onboarding', 'Operations'] }
    ];

    for (const c of SAMPLE_CLIENTS) {
      await this.addClient(c);
    }
    for (const o of SAMPLE_OPPS) {
      await this.addProposal(o);
    }
    for (const f of SAMPLE_FOLLOWUPS) {
      await this.addFollowup(f);
    }
    for (const n of SAMPLE_NOTES) {
      await this.addNote(n);
    }

    this.logActivity('Sample Portfolio Loaded', 'Loaded realistic sample proposals, clients and touchpoints', 'download');
    return true;
  }

  // --- CSV / JSON EXPORT ---
  exportToCSV(type = 'proposals') {
    let csvContent = '';
    let filename = '';

    if (type === 'proposals') {
      const headers = ['ID', 'Title', 'Client', 'Platform', 'Value', 'Currency', 'Status', 'Discovered Date', 'Deadline', 'Submission Date', 'Follow-up Date', 'Notes'];
      const rows = this.proposals.map(p => [
        `"${p.id || ''}"`,
        `"${(p.title || '').replace(/"/g, '""')}"`,
        `"${(p.clientName || '').replace(/"/g, '""')}"`,
        `"${p.platform || ''}"`,
        p.value || 0,
        `"${p.currency || 'USD'}"`,
        `"${p.status || ''}"`,
        `"${p.dateDiscovered || ''}"`,
        `"${p.deadline || ''}"`,
        `"${p.submissionDate || ''}"`,
        `"${p.followUpDate || ''}"`,
        `"${(p.notes || '').replace(/"/g, '""')}"`
      ]);

      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      filename = `freelancer_proposals_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'clients') {
      const headers = ['ID', 'Company Name', 'Contact Person', 'Email', 'Phone', 'Website', 'Location', 'Industry', 'Notes'];
      const rows = this.clients.map(c => [
        `"${c.id || ''}"`,
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${(c.contactPerson || '').replace(/"/g, '""')}"`,
        `"${c.email || ''}"`,
        `"${c.phone || ''}"`,
        `"${c.website || ''}"`,
        `"${(c.location || '').replace(/"/g, '""')}"`,
        `"${(c.industry || '').replace(/"/g, '""')}"`,
        `"${(c.notes || '').replace(/"/g, '""')}"`
      ]);

      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      filename = `freelancer_clients_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }

  exportToJSON() {
    const backupData = {
      version: '2.5.0',
      profile: this.getUserProfile(),
      exportDate: new Date().toISOString(),
      proposals: this.proposals,
      clients: this.clients,
      followups: this.followups,
      notes: this.notes,
      activities: this.activities
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `proposalflow_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }
}

// Global Storage Instance
window.storage = new StorageController();

/* ===== js/dashboard.js ===== */
/**
 * Freelancer Proposal Tracker - Dashboard Module
 * Calculates all KPIs dynamically from records and manages Chart.js instances.
 */

class DashboardModule {
  constructor() {
    this.charts = {
      monthly: null,
      status: null,
      platform: null,
      financials: null
    };
  }

  init() {
    this.renderMetrics();
    this.renderCharts();
    this.renderRecentActivities();
    this.renderUpcomingDeadlines();
    this.renderFollowupAlerts();
  }

  refresh() {
    this.renderMetrics();
    this.renderCharts();
    this.renderRecentActivities();
    this.renderUpcomingDeadlines();
    this.renderFollowupAlerts();
  }

  renderMetrics() {
    const proposals = window.storage.getProposals();
    const followups = window.storage.getFollowups();
    const todayStr = new Date().toISOString().split('T')[0];

    // Counts
    const totalCount = proposals.length;
    const submittedCount = proposals.filter(p => p.status === 'Submitted').length;
    const pendingStatuses = ['Submitted', 'Under Review', 'Interview', 'Negotiation'];
    const pendingCount = proposals.filter(p => pendingStatuses.includes(p.status)).length;
    const acceptedCount = proposals.filter(p => p.status === 'Accepted').length;
    const rejectedCount = proposals.filter(p => p.status === 'Rejected').length;

    // Financials
    const pipelineStatuses = ['Draft', 'Ready to Submit', 'Submitted', 'Under Review', 'Interview', 'Negotiation'];
    const pipelineValue = proposals
      .filter(p => pipelineStatuses.includes(p.status))
      .reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

    const wonValue = proposals
      .filter(p => p.status === 'Accepted')
      .reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

    // Win Rate Calculation (Won / (Won + Lost)) or (Won / Total)
    const decidedCount = acceptedCount + rejectedCount;
    const winRate = decidedCount > 0 ? Math.round((acceptedCount / decidedCount) * 100) : 0;

    // Upcoming followups count
    const activeFollowupsCount = followups.filter(f => !f.completed).length;

    // Update DOM elements safely
    this.setDOMText('metric-total-opps', totalCount);
    this.setDOMText('metric-submitted', submittedCount);
    this.setDOMText('metric-pending', pendingCount);
    this.setDOMText('metric-accepted', acceptedCount);
    this.setDOMText('metric-rejected', rejectedCount);
    this.setDOMText('metric-pipeline-val', `$${pipelineValue.toLocaleString()}`);
    this.setDOMText('metric-actual-earnings', `$${wonValue.toLocaleString()}`);
    this.setDOMText('metric-win-rate', `${winRate}%`);
    this.setDOMText('metric-followups', activeFollowupsCount);
  }

  setDOMText(elementId, text) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = text;
  }

  renderCharts() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js library not loaded yet.');
      return;
    }

    const proposals = window.storage.getProposals();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? '#273549' : '#e2e8f0';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    // 1. Monthly Submissions Chart
    this.renderMonthlyChart(proposals, gridColor, textColor);

    // 2. Status Distribution Doughnut Chart
    this.renderStatusChart(proposals, isDark);

    // 3. Platform Distribution Chart
    this.renderPlatformChart(proposals, gridColor, textColor);

    // 4. Financials Pipeline vs Won Value
    this.renderFinancialsChart(proposals, gridColor, textColor);
  }

  renderMonthlyChart(proposals, gridColor, textColor) {
    const ctx = document.getElementById('chart-monthly-submissions');
    if (!ctx) return;

    if (this.charts.monthly) {
      this.charts.monthly.destroy();
    }

    // Aggregate submissions by month (past 6 months)
    const monthLabels = [];
    const monthlyCounts = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleString('default', { month: 'short' });
      monthLabels.push(monthStr);

      const yearMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const count = proposals.filter(p => {
        const date = p.submissionDate || p.createdAt || '';
        return date.startsWith(yearMonthKey);
      }).length;
      monthlyCounts.push(count);
    }

    this.charts.monthly = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthLabels,
        datasets: [{
          label: 'Proposals Submitted',
          data: monthlyCounts,
          backgroundColor: '#4f46e5',
          borderRadius: 6,
          barThickness: 24
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 10,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { family: 'Inter' } }
          },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: textColor, font: { family: 'Inter' } },
            grid: { color: gridColor }
          }
        }
      }
    });
  }

  renderStatusChart(proposals, isDark) {
    const ctx = document.getElementById('chart-status-distribution');
    if (!ctx) return;

    if (this.charts.status) {
      this.charts.status.destroy();
    }

    const statuses = {
      'Accepted': 0,
      'Negotiation & Interview': 0,
      'Under Review': 0,
      'Submitted': 0,
      'Draft & Ready': 0,
      'Rejected / Withdrawn': 0
    };

    proposals.forEach(p => {
      if (p.status === 'Accepted') statuses['Accepted']++;
      else if (p.status === 'Interview' || p.status === 'Negotiation') statuses['Negotiation & Interview']++;
      else if (p.status === 'Under Review') statuses['Under Review']++;
      else if (p.status === 'Submitted') statuses['Submitted']++;
      else if (p.status === 'Draft' || p.status === 'Ready to Submit') statuses['Draft & Ready']++;
      else if (p.status === 'Rejected' || p.status === 'Withdrawn') statuses['Rejected / Withdrawn']++;
    });

    this.charts.status = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(statuses),
        datasets: [{
          data: Object.values(statuses),
          backgroundColor: [
            '#10b981', // Accepted
            '#8b5cf6', // Interview/Neg
            '#f59e0b', // Under Review
            '#4f46e5', // Submitted
            '#64748b', // Draft
            '#ef4444'  // Rejected
          ],
          borderWidth: 2,
          borderColor: isDark ? '#111827' : '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              padding: 14,
              font: { family: 'Inter', size: 11 },
              color: isDark ? '#cbd5e1' : '#334155'
            }
          }
        },
        cutout: '70%'
      }
    });
  }

  renderPlatformChart(proposals, gridColor, textColor) {
    const ctx = document.getElementById('chart-platform-distribution');
    if (!ctx) return;

    if (this.charts.platform) {
      this.charts.platform.destroy();
    }

    const platformCounts = {};
    proposals.forEach(p => {
      const plat = p.platform || 'Other';
      platformCounts[plat] = (platformCounts[plat] || 0) + 1;
    });

    const labels = Object.keys(platformCounts);
    const data = Object.values(platformCounts);

    this.charts.platform = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Opportunities',
          data: data,
          backgroundColor: '#0284c7',
          borderRadius: 6,
          barThickness: 20
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: textColor, font: { family: 'Inter' } },
            grid: { color: gridColor }
          },
          y: {
            grid: { display: false },
            ticks: { color: textColor, font: { family: 'Inter' } }
          }
        }
      }
    });
  }

  renderFinancialsChart(proposals, gridColor, textColor) {
    const ctx = document.getElementById('chart-financials');
    if (!ctx) return;

    if (this.charts.financials) {
      this.charts.financials.destroy();
    }

    const monthLabels = [];
    const pipelineData = [];
    const wonData = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleString('default', { month: 'short' });
      monthLabels.push(monthStr);

      const yearMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      const monthlyProposals = proposals.filter(p => (p.submissionDate || p.createdAt || '').startsWith(yearMonthKey));
      
      const pipeVal = monthlyProposals
        .filter(p => p.status !== 'Rejected' && p.status !== 'Withdrawn')
        .reduce((sum, item) => sum + (Number(item.value) || 0), 0);

      const wonVal = monthlyProposals
        .filter(p => p.status === 'Accepted')
        .reduce((sum, item) => sum + (Number(item.value) || 0), 0);

      pipelineData.push(pipeVal);
      wonData.push(wonVal);
    }

    this.charts.financials = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthLabels,
        datasets: [
          {
            label: 'Total Pipeline ($)',
            data: pipelineData,
            backgroundColor: '#818cf8',
            borderRadius: 4
          },
          {
            label: 'Won Earnings ($)',
            data: wonData,
            backgroundColor: '#10b981',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, font: { family: 'Inter' }, color: textColor }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { family: 'Inter' } }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => `$${(value / 1000).toFixed(0)}k`,
              color: textColor,
              font: { family: 'Inter' }
            },
            grid: { color: gridColor }
          }
        }
      }
    });
  }

  renderRecentActivities() {
    const container = document.getElementById('dashboard-recent-activities');
    if (!container) return;

    const activities = window.storage.getActivities().slice(0, 5);
    if (activities.length === 0) {
      container.innerHTML = '<p class="text-muted" style="padding: 1rem; text-align: center;">No recent activities logged.</p>';
      return;
    }

    container.innerHTML = activities.map(act => `
      <div style="display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border-subtle);">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--bg-surface-secondary); display: flex; align-items: center; justify-content: center; color: var(--primary-600); flex-shrink: 0;">
          <i data-lucide="${act.icon || 'activity'}" style="width: 16px; height: 16px;"></i>
        </div>
        <div style="flex: 1; overflow: hidden;">
          <div style="font-weight: 600; font-size: 0.8125rem; color: var(--text-primary);">${act.action}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${act.details}</div>
          <div style="font-size: 0.6875rem; color: var(--text-muted); margin-top: 2px;">${act.timestamp}</div>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  renderUpcomingDeadlines() {
    const container = document.getElementById('dashboard-upcoming-deadlines');
    if (!container) return;

    const proposals = window.storage.getProposals();
    const today = new Date().toISOString().split('T')[0];

    // Filter active proposals that have deadlines
    const withDeadlines = proposals
      .filter(p => p.deadline && p.status !== 'Accepted' && p.status !== 'Rejected' && p.status !== 'Withdrawn')
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5);

    if (withDeadlines.length === 0) {
      container.innerHTML = '<p class="text-muted" style="padding: 1rem; text-align: center;">No upcoming deadlines.</p>';
      return;
    }

    container.innerHTML = withDeadlines.map(p => {
      const isOverdue = p.deadline < today;
      const isDueToday = p.deadline === today;
      const statusBadge = isOverdue
        ? '<span class="badge badge-rejected">Overdue</span>'
        : (isDueToday ? '<span class="badge badge-negotiation">Due Today</span>' : `<span class="badge badge-ready">${p.deadline}</span>`);

      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border-subtle); cursor: pointer;" onclick="window.app.viewOpportunityDetail('${p.id}')">
          <div style="overflow: hidden; padding-right: 0.5rem;">
            <div style="font-weight: 600; font-size: 0.8125rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.title}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">${p.clientName} &bull; $${Number(p.value).toLocaleString()}</div>
          </div>
          <div>${statusBadge}</div>
        </div>
      `;
    }).join('');
  }

  renderFollowupAlerts() {
    const container = document.getElementById('dashboard-followup-alerts');
    if (!container) return;

    const followups = window.storage.getFollowups();
    const today = new Date().toISOString().split('T')[0];

    // Show overdue or due today follow-ups
    const urgent = followups
      .filter(f => !f.completed && f.dueDate <= today)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    if (urgent.length === 0) {
      container.innerHTML = '<p class="text-muted" style="padding: 1rem; text-align: center;">No urgent follow-up reminders! You are all caught up.</p>';
      return;
    }

    container.innerHTML = urgent.map(f => {
      const isOverdue = f.dueDate < today;
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border-subtle);">
          <div style="display: flex; align-items: center; gap: 0.5rem; overflow: hidden;">
            <input type="checkbox" onchange="window.storage.toggleFollowupComplete('${f.id}'); window.app.refreshAll();" style="cursor: pointer;">
            <div>
              <div style="font-weight: 600; font-size: 0.8125rem; color: var(--text-primary);">${f.clientName}</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">${f.notes}</div>
            </div>
          </div>
          <span class="badge ${isOverdue ? 'badge-rejected' : 'badge-negotiation'}">${isOverdue ? 'Overdue' : 'Due Today'}</span>
        </div>
      `;
    }).join('');
  }
}

// Global Dashboard Instance
window.dashboard = new DashboardModule();

/* ===== js/opportunities.js ===== */
/**
 * Freelancer Proposal Tracker - Opportunities Management Module
 * Handles Opportunity CRUD, search, filter, sort, table rendering and details modal.
 */

class OpportunitiesModule {
  constructor() {
    this.currentFilter = {
      status: 'ALL',
      platform: 'ALL',
      search: '',
      sortBy: 'dateDiscovered',
      sortOrder: 'desc'
    };
    this.editingId = null;
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    const searchInput = document.getElementById('opps-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentFilter.search = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    const statusFilter = document.getElementById('opps-filter-status');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.currentFilter.status = e.target.value;
        this.render();
      });
    }

    const platformFilter = document.getElementById('opps-filter-platform');
    if (platformFilter) {
      platformFilter.addEventListener('change', (e) => {
        this.currentFilter.platform = e.target.value;
        this.render();
      });
    }

    const sortSelect = document.getElementById('opps-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        const [field, order] = e.target.value.split('-');
        this.currentFilter.sortBy = field;
        this.currentFilter.sortOrder = order || 'asc';
        this.render();
      });
    }
  }

  getFilteredList() {
    let list = window.storage.getProposals();

    // Filter by Status
    if (this.currentFilter.status !== 'ALL') {
      list = list.filter(p => p.status === this.currentFilter.status);
    }

    // Filter by Platform
    if (this.currentFilter.platform !== 'ALL') {
      list = list.filter(p => p.platform === this.currentFilter.platform);
    }

    // Filter by Search Query
    if (this.currentFilter.search) {
      const q = this.currentFilter.search;
      list = list.filter(p =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.clientName && p.clientName.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.platform && p.platform.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      let valA = a[this.currentFilter.sortBy];
      let valB = b[this.currentFilter.sortBy];

      if (this.currentFilter.sortBy === 'value') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return this.currentFilter.sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return this.currentFilter.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }

  render() {
    const tableBody = document.getElementById('opportunities-table-body');
    const emptyState = document.getElementById('opportunities-empty-state');
    if (!tableBody) return;

    const items = this.getFilteredList();

    if (items.length === 0) {
      tableBody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    tableBody.innerHTML = items.map(p => {
      const statusBadgeClass = this.getStatusBadgeClass(p.status);
      const isOverdue = p.deadline && p.deadline < new Date().toISOString().split('T')[0] && p.status !== 'Accepted';

      return `
        <tr data-id="${p.id}">
          <td style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">
            ${p.id}
          </td>
          <td>
            <div style="font-weight: 600; color: var(--text-primary); cursor: pointer;" onclick="window.app.viewOpportunityDetail('${p.id}')">
              ${this.escapeHTML(p.title)}
            </div>
            <div class="cell-subtext" style="max-width: 380px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${this.escapeHTML(p.description || 'No description provided')}
            </div>
          </td>
          <td>
            <span style="font-weight: 500; color: var(--text-primary);">${this.escapeHTML(p.clientName)}</span>
          </td>
          <td>
            <span class="platform-tag">${this.escapeHTML(p.platform || 'Direct')}</span>
          </td>
          <td>
            <span style="font-weight: 700; color: var(--text-primary);">${p.currency || 'USD'} ${Number(p.value || 0).toLocaleString()}</span>
          </td>
          <td>
            <div style="font-size: 0.8125rem; ${isOverdue ? 'color: var(--danger-500); font-weight: 600;' : ''}">
              ${p.deadline || '<span class="text-muted">None</span>'}
            </div>
            ${isOverdue ? '<span style="font-size: 0.6875rem; color: var(--danger-500);">Overdue</span>' : ''}
          </td>
          <td>
            <select class="form-control" style="padding: 3px 6px; font-size: 0.75rem; height: 30px; border-radius: var(--radius-sm); font-weight: 600;" onchange="window.opportunities.quickStatusChange('${p.id}', this.value)">
              <option value="Draft" ${p.status === 'Draft' ? 'selected' : ''}>Draft</option>
              <option value="Ready to Submit" ${p.status === 'Ready to Submit' ? 'selected' : ''}>Ready to Submit</option>
              <option value="Submitted" ${p.status === 'Submitted' ? 'selected' : ''}>Submitted</option>
              <option value="Under Review" ${p.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
              <option value="Interview" ${p.status === 'Interview' ? 'selected' : ''}>Interview</option>
              <option value="Negotiation" ${p.status === 'Negotiation' ? 'selected' : ''}>Negotiation</option>
              <option value="Accepted" ${p.status === 'Accepted' ? 'selected' : ''}>Accepted (Won)</option>
              <option value="Rejected" ${p.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
              <option value="Withdrawn" ${p.status === 'Withdrawn' ? 'selected' : ''}>Withdrawn</option>
            </select>
          </td>
          <td>
            <div class="table-actions">
              <button class="btn btn-icon-only" title="View Details" onclick="window.app.viewOpportunityDetail('${p.id}')">
                <i data-lucide="eye" style="width: 16px; height: 16px;"></i>
              </button>
              <button class="btn btn-icon-only" title="Edit Opportunity" onclick="window.opportunities.openEditModal('${p.id}')">
                <i data-lucide="edit-2" style="width: 16px; height: 16px;"></i>
              </button>
              <button class="btn btn-icon-only" title="Delete Opportunity" onclick="window.opportunities.confirmDelete('${p.id}')" style="color: var(--danger-500);">
                <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  getStatusBadgeClass(status) {
    switch (status) {
      case 'Accepted': return 'badge-accepted';
      case 'Ready to Submit': return 'badge-ready';
      case 'Submitted': return 'badge-submitted';
      case 'Under Review': return 'badge-under-review';
      case 'Interview': return 'badge-interview';
      case 'Negotiation': return 'badge-negotiation';
      case 'Rejected': return 'badge-rejected';
      case 'Withdrawn': return 'badge-withdrawn';
      default: return 'badge-draft';
    }
  }

  quickStatusChange(id, newStatus) {
    window.storage.updateProposal(id, { status: newStatus });
    window.app.showToast(`Updated proposal status to ${newStatus}`, 'success');
    window.app.refreshAll();
  }

  openCreateModal() {
    this.editingId = null;
    const form = document.getElementById('opportunity-form');
    if (form) form.reset();

    const titleEl = document.getElementById('modal-opportunity-title');
    if (titleEl) titleEl.textContent = 'Create Opportunity & Proposal';

    // Populate clients dropdown
    this.populateClientSelect();

    // Default dates
    const today = new Date().toISOString().split('T')[0];
    const discoveredInput = document.getElementById('opp-date-discovered');
    if (discoveredInput) discoveredInput.value = today;

    window.app.openModal('modal-opportunity-form');
  }

  openEditModal(id) {
    const opp = window.storage.getProposalById(id);
    if (!opp) return;

    this.editingId = id;
    const form = document.getElementById('opportunity-form');
    if (form) form.reset();

    const titleEl = document.getElementById('modal-opportunity-title');
    if (titleEl) titleEl.textContent = `Edit Opportunity (${opp.id})`;

    this.populateClientSelect(opp.clientId);

    document.getElementById('opp-title').value = opp.title || '';
    document.getElementById('opp-client').value = opp.clientId || '';
    document.getElementById('opp-platform').value = opp.platform || 'Upwork';
    document.getElementById('opp-value').value = opp.value || '';
    document.getElementById('opp-currency').value = opp.currency || 'USD';
    document.getElementById('opp-date-discovered').value = opp.dateDiscovered || '';
    document.getElementById('opp-deadline').value = opp.deadline || '';
    document.getElementById('opp-submission-date').value = opp.submissionDate || '';
    document.getElementById('opp-status').value = opp.status || 'Draft';
    document.getElementById('opp-followup-date').value = opp.followUpDate || '';
    document.getElementById('opp-priority').value = opp.priority || 'Medium';
    document.getElementById('opp-description').value = opp.description || '';
    document.getElementById('opp-notes').value = opp.notes || '';

    window.app.openModal('modal-opportunity-form');
  }

  populateClientSelect(selectedId = '') {
    const select = document.getElementById('opp-client');
    if (!select) return;

    const clients = window.storage.getClients();
    select.innerHTML = '<option value="">-- Select Client or Company --</option>' +
      clients.map(c => `
        <option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>
          ${this.escapeHTML(c.name)} (${this.escapeHTML(c.contactPerson || 'Contact')})
        </option>
      `).join('');
  }

  handleFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('opp-title').value.trim();
    const clientId = document.getElementById('opp-client').value;
    const platform = document.getElementById('opp-platform').value;
    const value = parseFloat(document.getElementById('opp-value').value) || 0;
    const currency = document.getElementById('opp-currency').value;
    const dateDiscovered = document.getElementById('opp-date-discovered').value;
    const deadline = document.getElementById('opp-deadline').value;
    const submissionDate = document.getElementById('opp-submission-date').value;
    const status = document.getElementById('opp-status').value;
    const followUpDate = document.getElementById('opp-followup-date').value;
    const priority = document.getElementById('opp-priority').value;
    const description = document.getElementById('opp-description').value.trim();
    const notes = document.getElementById('opp-notes').value.trim();

    if (!title) {
      window.app.showToast('Please provide a project title', 'error');
      return;
    }
    if (!clientId) {
      window.app.showToast('Please select or create a client', 'error');
      return;
    }

    const client = window.storage.getClientById(clientId);
    const clientName = client ? client.name : 'Unknown Client';

    const oppData = {
      title,
      clientId,
      clientName,
      platform,
      value,
      currency,
      dateDiscovered,
      deadline,
      submissionDate,
      status,
      followUpDate,
      priority,
      description,
      notes
    };

    if (this.editingId) {
      window.storage.updateProposal(this.editingId, oppData);
      window.app.showToast('Opportunity updated successfully', 'success');
    } else {
      window.storage.addProposal(oppData);
      window.app.showToast('New opportunity created successfully', 'success');
    }

    // If follow-up date is provided, ensure a follow-up reminder exists
    if (followUpDate) {
      const followups = window.storage.getFollowups();
      const existing = followups.find(f => f.opportunityId === (this.editingId || ''));
      if (!existing) {
        window.storage.addFollowup({
          opportunityId: this.editingId || 'OPP-NEW',
          opportunityTitle: title,
          clientId: clientId,
          clientName: clientName,
          dueDate: followUpDate,
          type: 'Email',
          notes: `Follow up on proposal: ${title}`,
          completed: false
        });
      }
    }

    window.app.closeModal('modal-opportunity-form');
    window.app.refreshAll();
  }

  confirmDelete(id) {
    const opp = window.storage.getProposalById(id);
    if (!opp) return;

    window.app.confirmDialog({
      title: 'Delete Opportunity',
      message: `Are you sure you want to permanently delete "${opp.title}"? This action cannot be undone.`,
      confirmText: 'Delete Opportunity',
      isDanger: true,
      onConfirm: () => {
        window.storage.deleteProposal(id);
        window.app.showToast('Opportunity deleted', 'info');
        window.app.refreshAll();
      }
    });
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

// Global Opportunities Instance
window.opportunities = new OpportunitiesModule();

/* ===== js/proposals.js ===== */
/**
 * Freelancer Proposal Tracker - Proposals & Kanban Board Module
 * Handles Kanban visual pipeline, HTML5 drag-and-drop status changes, and pipeline analytics.
 */

class ProposalsModule {
  constructor() {
    this.columns = [
      {
        id: 'col-draft',
        title: 'Draft & Ready',
        statuses: ['Draft', 'Ready to Submit'],
        color: '#64748b'
      },
      {
        id: 'col-submitted',
        title: 'Submitted & In Review',
        statuses: ['Submitted', 'Under Review'],
        color: '#4f46e5'
      },
      {
        id: 'col-interview',
        title: 'Interview & Negotiation',
        statuses: ['Interview', 'Negotiation'],
        color: '#8b5cf6'
      },
      {
        id: 'col-accepted',
        title: 'Accepted (Won)',
        statuses: ['Accepted'],
        color: '#10b981'
      },
      {
        id: 'col-rejected',
        title: 'Rejected & Withdrawn',
        statuses: ['Rejected', 'Withdrawn'],
        color: '#ef4444'
      }
    ];

    this.draggedCardId = null;
    this.currentViewMode = 'kanban'; // 'kanban' or 'table'
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    const kanbanSearch = document.getElementById('kanban-search-input');
    if (kanbanSearch) {
      kanbanSearch.addEventListener('input', () => this.render());
    }

    const kanbanPlatform = document.getElementById('kanban-filter-platform');
    if (kanbanPlatform) {
      kanbanPlatform.addEventListener('change', () => this.render());
    }
  }

  setViewMode(mode) {
    this.currentViewMode = mode;
    const kanbanContainer = document.getElementById('proposals-kanban-view');
    const tableContainer = document.getElementById('proposals-table-view');
    const btnKanban = document.getElementById('btn-view-kanban');
    const btnTable = document.getElementById('btn-view-table');

    if (mode === 'kanban') {
      if (kanbanContainer) kanbanContainer.style.display = 'flex';
      if (tableContainer) tableContainer.style.display = 'none';
      if (btnKanban) { btnKanban.classList.add('btn-primary'); btnKanban.classList.remove('btn-outline'); }
      if (btnTable) { btnTable.classList.remove('btn-primary'); btnTable.classList.add('btn-outline'); }
      this.render();
    } else {
      if (kanbanContainer) kanbanContainer.style.display = 'none';
      if (tableContainer) tableContainer.style.display = 'block';
      if (btnKanban) { btnKanban.classList.remove('btn-primary'); btnKanban.classList.add('btn-outline'); }
      if (btnTable) { btnTable.classList.add('btn-primary'); btnTable.classList.remove('btn-outline'); }
      window.opportunities.render();
    }
  }

  render() {
    const board = document.getElementById('proposals-kanban-board');
    if (!board) return;

    let proposals = window.storage.getProposals();
    const searchVal = (document.getElementById('kanban-search-input')?.value || '').toLowerCase().trim();
    const platformVal = document.getElementById('kanban-filter-platform')?.value || 'ALL';

    if (searchVal) {
      proposals = proposals.filter(p =>
        (p.title && p.title.toLowerCase().includes(searchVal)) ||
        (p.clientName && p.clientName.toLowerCase().includes(searchVal))
      );
    }

    if (platformVal !== 'ALL') {
      proposals = proposals.filter(p => p.platform === platformVal);
    }

    board.innerHTML = this.columns.map(col => {
      const colCards = proposals.filter(p => col.statuses.includes(p.status));
      const colValue = colCards.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

      return `
        <div class="kanban-column" data-col-id="${col.id}">
          <div class="kanban-column-header">
            <div>
              <div class="kanban-column-title">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${col.color};"></span>
                ${col.title}
                <span class="kanban-count-badge">${colCards.length}</span>
              </div>
              <div style="font-size: 0.6875rem; color: var(--text-muted); margin-top: 2px;">
                $${colValue.toLocaleString()} total
              </div>
            </div>
            <button class="btn btn-icon-only btn-sm" title="Add to this stage" onclick="window.proposals.quickAddToStage('${col.statuses[0]}')">
              <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
            </button>
          </div>

          <div class="kanban-cards-wrapper" 
               ondragover="window.proposals.onDragOver(event)" 
               ondragleave="window.proposals.onDragLeave(event)" 
               ondrop="window.proposals.onDrop(event, '${col.id}')">
            ${colCards.map(p => this.renderCard(p)).join('')}
            ${colCards.length === 0 ? '<div style="text-align: center; color: var(--text-muted); font-size: 0.75rem; padding: 2rem 0;">No proposals here</div>' : ''}
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  renderCard(p) {
    const isOverdue = p.deadline && p.deadline < new Date().toISOString().split('T')[0] && p.status !== 'Accepted';
    const statusBadgeClass = window.opportunities.getStatusBadgeClass(p.status);

    return `
      <div class="kanban-card" 
           draggable="true" 
           data-id="${p.id}"
           ondragstart="window.proposals.onDragStart(event, '${p.id}')"
           ondragend="window.proposals.onDragEnd(event)">
        <div class="kanban-card-top">
          <span class="badge ${statusBadgeClass}">${p.status}</span>
          <span class="platform-tag">${p.platform || 'Direct'}</span>
        </div>
        
        <div class="kanban-card-title" onclick="window.app.viewOpportunityDetail('${p.id}')">
          ${this.escapeHTML(p.title)}
        </div>
        
        <div class="kanban-card-client">
          <i data-lucide="building" style="width: 12px; height: 12px; color: var(--text-muted);"></i>
          ${this.escapeHTML(p.clientName)}
        </div>

        <div class="kanban-card-footer">
          <div class="kanban-card-value">
            ${p.currency || 'USD'} ${Number(p.value || 0).toLocaleString()}
          </div>
          <div class="kanban-card-date" ${isOverdue ? 'style="color: var(--danger-500); font-weight: 600;"' : ''}>
            <i data-lucide="calendar" style="width: 12px; height: 12px;"></i>
            ${p.deadline ? p.deadline : 'No date'}
          </div>
        </div>
      </div>
    `;
  }

  // --- DRAG AND DROP HANDLERS ---
  onDragStart(e, id) {
    this.draggedCardId = id;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  }

  onDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.kanban-cards-wrapper').forEach(wrapper => {
      wrapper.classList.remove('drag-over');
    });
  }

  onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const wrapper = e.currentTarget;
    if (!wrapper.classList.contains('drag-over')) {
      wrapper.classList.add('drag-over');
    }
  }

  onDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
  }

  onDrop(e, columnId) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const id = this.draggedCardId || e.dataTransfer.getData('text/plain');
    if (!id) return;

    const column = this.columns.find(c => c.id === columnId);
    if (!column) return;

    const newStatus = column.statuses[0]; // Set to primary status of column
    const opp = window.storage.getProposalById(id);
    if (!opp) return;

    if (opp.status !== newStatus) {
      window.storage.updateProposal(id, { status: newStatus });
      window.app.showToast(`Moved "${opp.title}" to ${newStatus}`, 'success');
      window.app.refreshAll();
    }

    this.draggedCardId = null;
  }

  quickAddToStage(defaultStatus) {
    window.opportunities.openCreateModal();
    const statusSelect = document.getElementById('opp-status');
    if (statusSelect) {
      statusSelect.value = defaultStatus;
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

// Global Proposals Instance
window.proposals = new ProposalsModule();

/* ===== js/clients.js ===== */
/**
 * Freelancer Proposal Tracker - Client Management Module
 * Handles Client directory, CRUD, related proposals breakdown, and client profile view.
 */

class ClientsModule {
  constructor() {
    this.searchQuery = '';
    this.selectedIndustry = 'ALL';
    this.editingClientId = null;
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    const searchInput = document.getElementById('clients-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    const industryFilter = document.getElementById('clients-filter-industry');
    if (industryFilter) {
      industryFilter.addEventListener('change', (e) => {
        this.selectedIndustry = e.target.value;
        this.render();
      });
    }
  }

  render() {
    const grid = document.getElementById('clients-cards-grid');
    const emptyState = document.getElementById('clients-empty-state');
    if (!grid) return;

    let clients = window.storage.getClients();
    const proposals = window.storage.getProposals();

    // Filter by search
    if (this.searchQuery) {
      clients = clients.filter(c =>
        (c.name && c.name.toLowerCase().includes(this.searchQuery)) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(this.searchQuery)) ||
        (c.email && c.email.toLowerCase().includes(this.searchQuery)) ||
        (c.location && c.location.toLowerCase().includes(this.searchQuery)) ||
        (c.industry && c.industry.toLowerCase().includes(this.searchQuery))
      );
    }

    // Filter by industry
    if (this.selectedIndustry !== 'ALL') {
      clients = clients.filter(c => c.industry === this.selectedIndustry);
    }

    if (clients.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    grid.innerHTML = clients.map(client => {
      // Calculate related proposals stats
      const clientProposals = proposals.filter(p => p.clientId === client.id);
      const totalProposals = clientProposals.length;
      const wonProposals = clientProposals.filter(p => p.status === 'Accepted').length;
      const totalEarned = clientProposals
        .filter(p => p.status === 'Accepted')
        .reduce((sum, p) => sum + (Number(p.value) || 0), 0);

      return `
        <div class="card" style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between;">
          <div class="card-header" style="background: transparent; border-bottom: 1px solid var(--border-color);">
            <div>
              <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); cursor: pointer;" onclick="window.clients.viewClientProfile('${client.id}')">
                ${this.escapeHTML(client.name)}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                ${this.escapeHTML(client.industry || 'General Industry')}
              </div>
            </div>
            <div class="table-actions">
              <button class="btn btn-icon-only btn-sm" title="Edit Client" onclick="window.clients.openEditModal('${client.id}')">
                <i data-lucide="edit-2" style="width: 15px; height: 15px;"></i>
              </button>
              <button class="btn btn-icon-only btn-sm" title="Delete Client" onclick="window.clients.confirmDelete('${client.id}')" style="color: var(--danger-500);">
                <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
              </button>
            </div>
          </div>

          <div class="card-body" style="padding: var(--space-4);">
            <div style="display: flex; flex-direction: column; gap: var(--space-2); font-size: 0.8125rem;">
              <div style="display: flex; align-items: center; gap: 8px; color: var(--text-secondary);">
                <i data-lucide="user" style="width: 14px; height: 14px; color: var(--text-muted);"></i>
                <span style="font-weight: 600;">${this.escapeHTML(client.contactPerson || 'Not specified')}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; color: var(--text-secondary);">
                <i data-lucide="mail" style="width: 14px; height: 14px; color: var(--text-muted);"></i>
                <a href="mailto:${client.email}" style="color: var(--primary-600);">${this.escapeHTML(client.email || 'No email')}</a>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; color: var(--text-secondary);">
                <i data-lucide="map-pin" style="width: 14px; height: 14px; color: var(--text-muted);"></i>
                <span>${this.escapeHTML(client.location || 'Remote')}</span>
              </div>
              ${client.website ? `
              <div style="display: flex; align-items: center; gap: 8px; color: var(--text-secondary);">
                <i data-lucide="globe" style="width: 14px; height: 14px; color: var(--text-muted);"></i>
                <a href="${client.website}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-600); word-break: break-all;">${this.escapeHTML(client.website.replace('https://', ''))}</a>
              </div>` : ''}
            </div>

            <!-- Stats Bar -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle); text-align: center;">
              <div>
                <div style="font-size: 0.6875rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Proposals</div>
                <div style="font-weight: 700; font-size: 0.9375rem; color: var(--text-primary);">${totalProposals}</div>
              </div>
              <div>
                <div style="font-size: 0.6875rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Won</div>
                <div style="font-weight: 700; font-size: 0.9375rem; color: var(--success-600);">${wonProposals}</div>
              </div>
              <div>
                <div style="font-size: 0.6875rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Earned</div>
                <div style="font-weight: 700; font-size: 0.9375rem; color: var(--primary-600);">$${totalEarned.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div class="card-footer" style="padding: var(--space-3) var(--space-4);">
            <button class="btn btn-outline btn-sm" style="width: 100%; justify-content: center;" onclick="window.clients.viewClientProfile('${client.id}')">
              <i data-lucide="file-text" style="width: 14px; height: 14px;"></i> View Client Details & History
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  openCreateModal() {
    this.editingClientId = null;
    const form = document.getElementById('client-form');
    if (form) form.reset();

    const titleEl = document.getElementById('modal-client-title');
    if (titleEl) titleEl.textContent = 'Add New Client';

    window.app.openModal('modal-client-form');
  }

  openEditModal(id) {
    const client = window.storage.getClientById(id);
    if (!client) return;

    this.editingClientId = id;
    const form = document.getElementById('client-form');
    if (form) form.reset();

    const titleEl = document.getElementById('modal-client-title');
    if (titleEl) titleEl.textContent = `Edit Client (${client.name})`;

    document.getElementById('client-name').value = client.name || '';
    document.getElementById('client-contact').value = client.contactPerson || '';
    document.getElementById('client-email').value = client.email || '';
    document.getElementById('client-phone').value = client.phone || '';
    document.getElementById('client-website').value = client.website || '';
    document.getElementById('client-location').value = client.location || '';
    document.getElementById('client-industry').value = client.industry || '';
    document.getElementById('client-notes').value = client.notes || '';

    window.app.openModal('modal-client-form');
  }

  handleFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('client-name').value.trim();
    const contactPerson = document.getElementById('client-contact').value.trim();
    const email = document.getElementById('client-email').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    const website = document.getElementById('client-website').value.trim();
    const location = document.getElementById('client-location').value.trim();
    const industry = document.getElementById('client-industry').value.trim();
    const notes = document.getElementById('client-notes').value.trim();

    if (!name) {
      window.app.showToast('Client or Company name is required', 'error');
      return;
    }

    const clientData = {
      name,
      contactPerson,
      email,
      phone,
      website,
      location,
      industry,
      notes
    };

    if (this.editingClientId) {
      window.storage.updateClient(this.editingClientId, clientData);
      window.app.showToast('Client profile updated successfully', 'success');
    } else {
      window.storage.addClient(clientData);
      window.app.showToast('New client created successfully', 'success');
    }

    window.app.closeModal('modal-client-form');
    window.app.refreshAll();
  }

  confirmDelete(id) {
    const client = window.storage.getClientById(id);
    if (!client) return;

    const proposals = window.storage.getProposals().filter(p => p.clientId === id);

    let message = `Are you sure you want to delete "${client.name}"?`;
    if (proposals.length > 0) {
      message += ` This client has ${proposals.length} associated proposal(s). They will remain unlinked.`;
    }

    window.app.confirmDialog({
      title: 'Delete Client',
      message: message,
      confirmText: 'Delete Client',
      isDanger: true,
      onConfirm: () => {
        window.storage.deleteClient(id);
        window.app.showToast('Client deleted', 'info');
        window.app.refreshAll();
      }
    });
  }

  viewClientProfile(id) {
    const client = window.storage.getClientById(id);
    if (!client) return;

    const proposals = window.storage.getProposals().filter(p => p.clientId === id);
    const notes = window.storage.getNotes().filter(n => n.clientId === id);

    const titleEl = document.getElementById('modal-client-profile-title');
    if (titleEl) titleEl.textContent = client.name;

    const bodyEl = document.getElementById('modal-client-profile-body');
    if (!bodyEl) return;

    const totalEarned = proposals
      .filter(p => p.status === 'Accepted')
      .reduce((sum, p) => sum + (Number(p.value) || 0), 0);

    bodyEl.innerHTML = `
      <div class="detail-meta-grid">
        <div class="detail-meta-item">
          <span class="detail-label">Contact Person</span>
          <span class="detail-value">${this.escapeHTML(client.contactPerson || 'None')}</span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-label">Email Address</span>
          <span class="detail-value"><a href="mailto:${client.email}">${this.escapeHTML(client.email || 'None')}</a></span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-label">Phone Number</span>
          <span class="detail-value">${this.escapeHTML(client.phone || 'None')}</span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-label">Location</span>
          <span class="detail-value">${this.escapeHTML(client.location || 'Remote')}</span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-label">Website</span>
          <span class="detail-value">${client.website ? `<a href="${client.website}" target="_blank">${client.website}</a>` : 'None'}</span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-label">Industry</span>
          <span class="detail-value">${this.escapeHTML(client.industry || 'General')}</span>
        </div>
      </div>

      <div style="margin-bottom: var(--space-6);">
        <h4 style="font-size: 0.9375rem; font-weight: 700; margin-bottom: var(--space-2);">Client Notes</h4>
        <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; background: var(--bg-surface-secondary); padding: var(--space-3); border-radius: var(--radius-md);">
          ${this.escapeHTML(client.notes || 'No specific notes recorded for this client.')}
        </p>
      </div>

      <div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3);">
          <h4 style="font-size: 0.9375rem; font-weight: 700;">Associated Proposals & Opportunities (${proposals.length})</h4>
          <span style="font-size: 0.8125rem; font-weight: 700; color: var(--primary-600);">Total Won: $${totalEarned.toLocaleString()}</span>
        </div>

        ${proposals.length === 0 ? '<p class="text-muted" style="font-size: 0.875rem;">No proposals associated with this client yet.</p>' : `
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${proposals.map(p => `
                  <tr>
                    <td style="font-weight: 600;">${this.escapeHTML(p.title)}</td>
                    <td>${p.currency} ${Number(p.value).toLocaleString()}</td>
                    <td><span class="badge ${window.opportunities.getStatusBadgeClass(p.status)}">${p.status}</span></td>
                    <td>${p.deadline || '-'}</td>
                    <td>
                      <button class="btn btn-outline btn-sm" onclick="window.app.closeModal('modal-client-profile'); window.app.viewOpportunityDetail('${p.id}')">
                        View
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;

    window.app.openModal('modal-client-profile');
    if (window.lucide) window.lucide.createIcons();
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

// Global Clients Instance
window.clients = new ClientsModule();

/* ===== js/followups.js ===== */
/**
 * Freelancer Proposal Tracker - Follow-up Reminders Module
 * Organizes follow-ups into Overdue, Today, Upcoming and Completed lists.
 */

class FollowupsModule {
  constructor() {
    this.currentTab = 'today'; // 'overdue', 'today', 'upcoming', 'completed'
    this.editingFollowupId = null;
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    const tabs = document.querySelectorAll('.followup-tab-btn');
    tabs.forEach(btn => {
      btn.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentTab = e.currentTarget.getAttribute('data-tab');
        this.render();
      });
    });
  }

  setTab(tabName) {
    this.currentTab = tabName;
    const tabs = document.querySelectorAll('.followup-tab-btn');
    tabs.forEach(t => {
      if (t.getAttribute('data-tab') === tabName) t.classList.add('active');
      else t.classList.remove('active');
    });
    this.render();
  }

  render() {
    const container = document.getElementById('followups-list-container');
    const emptyState = document.getElementById('followups-empty-state');
    if (!container) return;

    const followups = window.storage.getFollowups();
    const today = new Date().toISOString().split('T')[0];

    // Partition followups
    const overdue = followups.filter(f => !f.completed && f.dueDate < today);
    const todayList = followups.filter(f => !f.completed && f.dueDate === today);
    const upcoming = followups.filter(f => !f.completed && f.dueDate > today);
    const completed = followups.filter(f => f.completed);

    // Update tab counters
    this.setCounterText('tab-count-overdue', overdue.length);
    this.setCounterText('tab-count-today', todayList.length);
    this.setCounterText('tab-count-upcoming', upcoming.length);
    this.setCounterText('tab-count-completed', completed.length);

    let currentList = [];
    if (this.currentTab === 'overdue') currentList = overdue;
    else if (this.currentTab === 'today') currentList = todayList;
    else if (this.currentTab === 'upcoming') currentList = upcoming;
    else if (this.currentTab === 'completed') currentList = completed;

    if (currentList.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = currentList.map(f => {
      return `
        <div class="card" style="margin-bottom: var(--space-3); border-left: 4px solid ${this.getBorderColorForFollowup(f, today)};">
          <div class="card-body" style="padding: var(--space-4); display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4);">
            <div style="display: flex; align-items: flex-start; gap: var(--space-3); flex: 1;">
              <input type="checkbox" ${f.completed ? 'checked' : ''} 
                     onchange="window.followups.toggleComplete('${f.id}')"
                     style="width: 18px; height: 18px; margin-top: 3px; cursor: pointer; accent-color: var(--primary-600);">
              
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap;">
                  <span style="font-weight: 700; font-size: 0.9375rem; color: var(--text-primary); ${f.completed ? 'text-decoration: line-through; opacity: 0.7;' : ''}">
                    ${this.escapeHTML(f.opportunityTitle || 'Opportunity Follow-up')}
                  </span>
                  <span class="badge badge-draft" style="font-size: 0.6875rem;">
                    <i data-lucide="message-square" style="width: 11px; height: 11px;"></i> ${f.type || 'Email'}
                  </span>
                </div>

                <div style="font-size: 0.8125rem; color: var(--text-secondary); margin-top: 3px;">
                  Client: <strong style="color: var(--text-primary);">${this.escapeHTML(f.clientName)}</strong>
                </div>

                <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-top: 6px; background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: var(--radius-sm); line-height: 1.4;">
                  ${this.escapeHTML(f.notes || 'No notes specified')}
                </p>

                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 6px; display: flex; align-items: center; gap: 12px;">
                  <span>Due Date: <strong style="color: ${f.dueDate < today && !f.completed ? 'var(--danger-500)' : 'var(--text-primary)'};">${f.dueDate}</strong></span>
                  ${f.opportunityId ? `<a href="#" onclick="window.app.viewOpportunityDetail('${f.opportunityId}'); return false;" style="color: var(--primary-600); font-weight: 600;">View Opportunity &rarr;</a>` : ''}
                </div>
              </div>
            </div>

            <div class="table-actions">
              <button class="btn btn-icon-only btn-sm" title="Edit Follow-up" onclick="window.followups.openEditModal('${f.id}')">
                <i data-lucide="edit-2" style="width: 15px; height: 15px;"></i>
              </button>
              <button class="btn btn-icon-only btn-sm" title="Delete Follow-up" onclick="window.followups.confirmDelete('${f.id}')" style="color: var(--danger-500);">
                <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  getBorderColorForFollowup(f, today) {
    if (f.completed) return 'var(--success-500)';
    if (f.dueDate < today) return 'var(--danger-500)';
    if (f.dueDate === today) return 'var(--warning-500)';
    return 'var(--primary-500)';
  }

  setCounterText(id, count) {
    const el = document.getElementById(id);
    if (el) el.textContent = count;
  }

  toggleComplete(id) {
    window.storage.toggleFollowupComplete(id);
    window.app.refreshAll();
  }

  openCreateModal(defaultOppId = '') {
    this.editingFollowupId = null;
    const form = document.getElementById('followup-form');
    if (form) form.reset();

    const titleEl = document.getElementById('modal-followup-title');
    if (titleEl) titleEl.textContent = 'Schedule Follow-up Reminder';

    this.populateOpportunitiesSelect(defaultOppId);

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('followup-date').value = today;

    window.app.openModal('modal-followup-form');
  }

  openEditModal(id) {
    const followups = window.storage.getFollowups();
    const item = followups.find(f => f.id === id);
    if (!item) return;

    this.editingFollowupId = id;
    const form = document.getElementById('followup-form');
    if (form) form.reset();

    const titleEl = document.getElementById('modal-followup-title');
    if (titleEl) titleEl.textContent = 'Edit Follow-up Reminder';

    this.populateOpportunitiesSelect(item.opportunityId);

    document.getElementById('followup-opportunity').value = item.opportunityId || '';
    document.getElementById('followup-date').value = item.dueDate || '';
    document.getElementById('followup-type').value = item.type || 'Email';
    document.getElementById('followup-notes').value = item.notes || '';

    window.app.openModal('modal-followup-form');
  }

  populateOpportunitiesSelect(selectedId = '') {
    const select = document.getElementById('followup-opportunity');
    if (!select) return;

    const proposals = window.storage.getProposals();
    select.innerHTML = '<option value="">-- Select Opportunity (or Generic) --</option>' +
      proposals.map(p => `
        <option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>
          ${this.escapeHTML(p.title)} (${this.escapeHTML(p.clientName)})
        </option>
      `).join('');
  }

  handleFormSubmit(e) {
    e.preventDefault();

    const oppId = document.getElementById('followup-opportunity').value;
    const dueDate = document.getElementById('followup-date').value;
    const type = document.getElementById('followup-type').value;
    const notes = document.getElementById('followup-notes').value.trim();

    if (!dueDate) {
      window.app.showToast('Please specify a due date', 'error');
      return;
    }

    let oppTitle = 'General Follow-up';
    let clientId = '';
    let clientName = 'Client';

    if (oppId) {
      const opp = window.storage.getProposalById(oppId);
      if (opp) {
        oppTitle = opp.title;
        clientId = opp.clientId;
        clientName = opp.clientName;
      }
    }

    const data = {
      opportunityId: oppId,
      opportunityTitle: oppTitle,
      clientId: clientId,
      clientName: clientName,
      dueDate: dueDate,
      type: type,
      notes: notes
    };

    if (this.editingFollowupId) {
      window.storage.updateFollowup(this.editingFollowupId, data);
      window.app.showToast('Follow-up updated successfully', 'success');
    } else {
      window.storage.addFollowup(data);
      window.app.showToast('Follow-up scheduled successfully', 'success');
    }

    window.app.closeModal('modal-followup-form');
    window.app.refreshAll();
  }

  confirmDelete(id) {
    window.app.confirmDialog({
      title: 'Delete Follow-up',
      message: 'Are you sure you want to delete this reminder?',
      confirmText: 'Delete',
      isDanger: true,
      onConfirm: () => {
        window.storage.deleteFollowup(id);
        window.app.showToast('Follow-up reminder deleted', 'info');
        window.app.refreshAll();
      }
    });
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

// Global Followups Instance
window.followups = new FollowupsModule();

/* ===== js/calendar.js ===== */
/**
 * Freelancer Proposal Tracker - Calendar Module
 * Interactive monthly calendar displaying application deadlines, submissions and follow-ups.
 */

class CalendarModule {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = null;
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    const prevBtn = document.getElementById('cal-prev-month');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
      });
    }

    const nextBtn = document.getElementById('cal-next-month');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
      });
    }

    const todayBtn = document.getElementById('cal-today-btn');
    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        this.currentDate = new Date();
        this.render();
      });
    }
  }

  render() {
    const grid = document.getElementById('calendar-grid-cells');
    const headerTitle = document.getElementById('cal-month-title');
    if (!grid) return;

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (headerTitle) {
      headerTitle.textContent = `${monthNames[month]} ${year}`;
    }

    // Days calculation
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const proposals = window.storage.getProposals();
    const followups = window.storage.getFollowups();
    const todayStr = new Date().toISOString().split('T')[0];

    let html = '';

    // Previous month filler days
    for (let x = firstDayIndex; x > 0; x--) {
      const dayNum = prevMonthDays - x + 1;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

      html += this.renderDayCell(dayNum, dateStr, true, false, proposals, followups);
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;

      html += this.renderDayCell(i, dateStr, false, isToday, proposals, followups);
    }

    // Next month filler days to complete grid (42 cells: 6 rows of 7)
    const totalRendered = firstDayIndex + totalDaysInMonth;
    const remainingCells = (totalRendered > 35 ? 42 : 35) - totalRendered;

    for (let j = 1; j <= remainingCells; j++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(j).padStart(2, '0')}`;

      html += this.renderDayCell(j, dateStr, true, false, proposals, followups);
    }

    grid.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  }

  renderDayCell(dayNum, dateStr, isOtherMonth, isToday, proposals, followups) {
    // Events on this day
    const deadlines = proposals.filter(p => p.deadline === dateStr);
    const submissions = proposals.filter(p => p.submissionDate === dateStr);
    const dayFollowups = followups.filter(f => f.dueDate === dateStr);

    const totalEvents = deadlines.length + submissions.length + dayFollowups.length;

    let eventPills = '';
    let renderedCount = 0;
    const maxPills = 3;

    deadlines.forEach(p => {
      if (renderedCount < maxPills) {
        eventPills += `
          <div class="cal-event-pill cal-event-deadline" title="Deadline: ${this.escapeHTML(p.title)}">
            ⏳ ${this.escapeHTML(p.title)}
          </div>
        `;
        renderedCount++;
      }
    });

    submissions.forEach(p => {
      if (renderedCount < maxPills) {
        eventPills += `
          <div class="cal-event-pill cal-event-submission" title="Submitted: ${this.escapeHTML(p.title)}">
            🚀 ${this.escapeHTML(p.title)}
          </div>
        `;
        renderedCount++;
      }
    });

    dayFollowups.forEach(f => {
      if (renderedCount < maxPills) {
        eventPills += `
          <div class="cal-event-pill cal-event-followup" title="Follow-up: ${this.escapeHTML(f.clientName)}">
            🔔 ${this.escapeHTML(f.clientName)}
          </div>
        `;
        renderedCount++;
      }
    });

    if (totalEvents > maxPills) {
      eventPills += `<div class="cal-more-events">+${totalEvents - maxPills} more</div>`;
    }

    return `
      <div class="calendar-day-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'is-today' : ''}" 
           onclick="window.calendar.openDayAgenda('${dateStr}')">
        <div class="day-header">
          <span class="day-number">${dayNum}</span>
          ${totalEvents > 0 ? `<span style="width: 6px; height: 6px; border-radius: 50%; background: var(--primary-600);"></span>` : ''}
        </div>
        <div class="calendar-events-list">
          ${eventPills}
        </div>
      </div>
    `;
  }

  openDayAgenda(dateStr) {
    this.selectedDate = dateStr;
    const proposals = window.storage.getProposals();
    const followups = window.storage.getFollowups();

    const deadlines = proposals.filter(p => p.deadline === dateStr);
    const submissions = proposals.filter(p => p.submissionDate === dateStr);
    const dayFollowups = followups.filter(f => f.dueDate === dateStr);

    const titleEl = document.getElementById('modal-agenda-title');
    if (titleEl) {
      const d = new Date(dateStr + 'T00:00:00');
      titleEl.textContent = `Schedule for ${d.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}`;
    }

    const bodyEl = document.getElementById('modal-agenda-body');
    if (!bodyEl) return;

    let content = '';

    // Deadlines Section
    if (deadlines.length > 0) {
      content += `
        <div style="margin-bottom: var(--space-4);">
          <h4 style="font-size: 0.875rem; font-weight: 700; color: var(--danger-600); margin-bottom: var(--space-2); display: flex; align-items: center; gap: 6px;">
            <i data-lucide="clock" style="width: 14px; height: 14px;"></i> Application Deadlines (${deadlines.length})
          </h4>
          <div style="display: flex; flex-direction: column; gap: var(--space-2);">
            ${deadlines.map(p => `
              <div style="background: var(--bg-surface-secondary); padding: var(--space-3); border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 600; font-size: 0.875rem;">${this.escapeHTML(p.title)}</div>
                  <div style="font-size: 0.75rem; color: var(--text-secondary);">${this.escapeHTML(p.clientName)} &bull; ${p.currency} ${Number(p.value).toLocaleString()}</div>
                </div>
                <button class="btn btn-outline btn-sm" onclick="window.app.closeModal('modal-agenda'); window.app.viewOpportunityDetail('${p.id}')">View</button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Submissions Section
    if (submissions.length > 0) {
      content += `
        <div style="margin-bottom: var(--space-4);">
          <h4 style="font-size: 0.875rem; font-weight: 700; color: var(--primary-600); margin-bottom: var(--space-2); display: flex; align-items: center; gap: 6px;">
            <i data-lucide="send" style="width: 14px; height: 14px;"></i> Proposal Submissions (${submissions.length})
          </h4>
          <div style="display: flex; flex-direction: column; gap: var(--space-2);">
            ${submissions.map(p => `
              <div style="background: var(--bg-surface-secondary); padding: var(--space-3); border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 600; font-size: 0.875rem;">${this.escapeHTML(p.title)}</div>
                  <div style="font-size: 0.75rem; color: var(--text-secondary);">${this.escapeHTML(p.clientName)} &bull; Status: ${p.status}</div>
                </div>
                <button class="btn btn-outline btn-sm" onclick="window.app.closeModal('modal-agenda'); window.app.viewOpportunityDetail('${p.id}')">View</button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Follow-ups Section
    if (dayFollowups.length > 0) {
      content += `
        <div style="margin-bottom: var(--space-4);">
          <h4 style="font-size: 0.875rem; font-weight: 700; color: var(--purple-600); margin-bottom: var(--space-2); display: flex; align-items: center; gap: 6px;">
            <i data-lucide="bell" style="width: 14px; height: 14px;"></i> Follow-up Reminders (${dayFollowups.length})
          </h4>
          <div style="display: flex; flex-direction: column; gap: var(--space-2);">
            ${dayFollowups.map(f => `
              <div style="background: var(--bg-surface-secondary); padding: var(--space-3); border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 600; font-size: 0.875rem;">${this.escapeHTML(f.clientName)} (${f.type})</div>
                  <div style="font-size: 0.75rem; color: var(--text-secondary);">${this.escapeHTML(f.notes || 'No notes')}</div>
                </div>
                <input type="checkbox" ${f.completed ? 'checked' : ''} onchange="window.storage.toggleFollowupComplete('${f.id}'); window.app.refreshAll();" style="cursor: pointer;">
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (!content) {
      content = `
        <div class="empty-state" style="padding: var(--space-6) 0;">
          <div class="empty-state-icon"><i data-lucide="calendar-check"></i></div>
          <div class="empty-state-title">No events for this date</div>
          <p class="empty-state-desc">You don't have any proposal deadlines, submissions, or follow-ups scheduled for this day.</p>
        </div>
      `;
    }

    bodyEl.innerHTML = content;
    window.app.openModal('modal-agenda');
    if (window.lucide) window.lucide.createIcons();
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

// Global Calendar Instance
window.calendar = new CalendarModule();

/* ===== js/notes.js ===== */
/**
 * Freelancer Proposal Tracker - Notes Management Module
 * Create, edit, delete and search rich notes associated with clients and opportunities.
 */

class NotesModule {
  constructor() {
    this.searchQuery = '';
    this.editingNoteId = null;
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    const searchInput = document.getElementById('notes-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      });
    }
  }

  render() {
    const container = document.getElementById('notes-cards-grid');
    const emptyState = document.getElementById('notes-empty-state');
    if (!container) return;

    let notes = window.storage.getNotes();

    if (this.searchQuery) {
      notes = notes.filter(n =>
        (n.title && n.title.toLowerCase().includes(this.searchQuery)) ||
        (n.content && n.content.toLowerCase().includes(this.searchQuery)) ||
        (n.clientName && n.clientName.toLowerCase().includes(this.searchQuery)) ||
        (n.tags && n.tags.some(t => t.toLowerCase().includes(this.searchQuery)))
      );
    }

    if (notes.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = notes.map(n => {
      const tagsList = Array.isArray(n.tags) ? n.tags : [];

      return `
        <div class="card" style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between;">
          <div class="card-header" style="background: transparent;">
            <div>
              <div style="font-size: 1rem; font-weight: 700; color: var(--text-primary);">${this.escapeHTML(n.title)}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                ${this.escapeHTML(n.clientName || 'General Client')}
              </div>
            </div>
            <div class="table-actions">
              <button class="btn btn-icon-only btn-sm" title="Edit Note" onclick="window.notes.openEditModal('${n.id}')">
                <i data-lucide="edit-2" style="width: 14px; height: 14px;"></i>
              </button>
              <button class="btn btn-icon-only btn-sm" title="Delete Note" onclick="window.notes.confirmDelete('${n.id}')" style="color: var(--danger-500);">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
              </button>
            </div>
          </div>

          <div class="card-body" style="padding: var(--space-4);">
            <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6; white-space: pre-wrap;">${this.escapeHTML(n.content)}</p>

            ${tagsList.length > 0 ? `
              <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 1rem;">
                ${tagsList.map(t => `<span class="badge badge-draft" style="font-size: 0.6875rem;">#${this.escapeHTML(t)}</span>`).join('')}
              </div>
            ` : ''}
          </div>

          <div class="card-footer" style="padding: var(--space-2) var(--space-4); font-size: 0.6875rem; color: var(--text-muted);">
            <span>Created: ${n.createdAt}</span>
            ${n.opportunityId ? `<a href="#" onclick="window.app.viewOpportunityDetail('${n.opportunityId}'); return false;" style="color: var(--primary-600); font-weight: 600;">View Opportunity</a>` : ''}
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  openCreateModal() {
    this.editingNoteId = null;
    const form = document.getElementById('note-form');
    if (form) form.reset();

    const titleEl = document.getElementById('modal-note-title');
    if (titleEl) titleEl.textContent = 'Create Note';

    this.populateClientSelect();
    this.populateOpportunitySelect();

    window.app.openModal('modal-note-form');
  }

  openEditModal(id) {
    const note = window.storage.getNotes().find(n => n.id === id);
    if (!note) return;

    this.editingNoteId = id;
    const form = document.getElementById('note-form');
    if (form) form.reset();

    const titleEl = document.getElementById('modal-note-title');
    if (titleEl) titleEl.textContent = 'Edit Note';

    this.populateClientSelect(note.clientId);
    this.populateOpportunitySelect(note.opportunityId);

    document.getElementById('note-title').value = note.title || '';
    document.getElementById('note-content').value = note.content || '';
    document.getElementById('note-tags').value = (note.tags || []).join(', ');

    window.app.openModal('modal-note-form');
  }

  populateClientSelect(selectedId = '') {
    const select = document.getElementById('note-client');
    if (!select) return;

    const clients = window.storage.getClients();
    select.innerHTML = '<option value="">-- Associate with Client (Optional) --</option>' +
      clients.map(c => `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${this.escapeHTML(c.name)}</option>`).join('');
  }

  populateOpportunitySelect(selectedId = '') {
    const select = document.getElementById('note-opportunity');
    if (!select) return;

    const proposals = window.storage.getProposals();
    select.innerHTML = '<option value="">-- Associate with Opportunity (Optional) --</option>' +
      proposals.map(p => `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${this.escapeHTML(p.title)}</option>`).join('');
  }

  handleFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();
    const clientId = document.getElementById('note-client').value;
    const opportunityId = document.getElementById('note-opportunity').value;
    const tagsRaw = document.getElementById('note-tags').value;

    if (!title || !content) {
      window.app.showToast('Note title and content are required', 'error');
      return;
    }

    let clientName = '';
    if (clientId) {
      const client = window.storage.getClientById(clientId);
      if (client) clientName = client.name;
    }

    const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

    const noteData = {
      title,
      content,
      clientId,
      clientName,
      opportunityId,
      tags
    };

    if (this.editingNoteId) {
      window.storage.updateNote(this.editingNoteId, noteData);
      window.app.showToast('Note updated successfully', 'success');
    } else {
      window.storage.addNote(noteData);
      window.app.showToast('Note created successfully', 'success');
    }

    window.app.closeModal('modal-note-form');
    window.app.refreshAll();
  }

  confirmDelete(id) {
    window.app.confirmDialog({
      title: 'Delete Note',
      message: 'Are you sure you want to permanently delete this note?',
      confirmText: 'Delete Note',
      isDanger: true,
      onConfirm: () => {
        window.storage.deleteNote(id);
        window.app.showToast('Note deleted', 'info');
        window.app.refreshAll();
      }
    });
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

// Global Notes Instance
window.notes = new NotesModule();

/* ===== js/analytics.js ===== */
/**
 * Freelancer Proposal Tracker - Analytics & Performance Insights Module
 * Provides comprehensive statistical analysis, platform performance comparisons, and deep KPIs.
 */

class AnalyticsModule {
  constructor() {
    this.charts = {
      platformRoi: null,
      winLoss: null
    };
  }

  init() {
    this.render();
  }

  render() {
    this.renderKPIs();
    this.renderPlatformPerformanceTable();
    this.renderAnalyticsCharts();
  }

  renderKPIs() {
    const proposals = window.storage.getProposals();

    const totalOpps = proposals.length;
    const acceptedList = proposals.filter(p => p.status === 'Accepted');
    const rejectedList = proposals.filter(p => p.status === 'Rejected');
    const decidedCount = acceptedList.length + rejectedList.length;

    const winRate = decidedCount > 0 ? ((acceptedList.length / decidedCount) * 100).toFixed(1) : 0;
    const rejectionRate = decidedCount > 0 ? ((rejectedList.length / decidedCount) * 100).toFixed(1) : 0;

    const totalValue = proposals.reduce((acc, p) => acc + (Number(p.value) || 0), 0);
    const avgValue = totalOpps > 0 ? Math.round(totalValue / totalOpps) : 0;

    const totalWonValue = acceptedList.reduce((acc, p) => acc + (Number(p.value) || 0), 0);
    const avgWonValue = acceptedList.length > 0 ? Math.round(totalWonValue / acceptedList.length) : 0;

    const pipelineStatuses = ['Draft', 'Ready to Submit', 'Submitted', 'Under Review', 'Interview', 'Negotiation'];
    const pipelineValue = proposals
      .filter(p => pipelineStatuses.includes(p.status))
      .reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

    // Update DOM
    this.setDOMText('analytics-kpi-total-opps', totalOpps);
    this.setDOMText('analytics-kpi-win-rate', `${winRate}%`);
    this.setDOMText('analytics-kpi-rejection-rate', `${rejectionRate}%`);
    this.setDOMText('analytics-kpi-avg-value', `$${avgValue.toLocaleString()}`);
    this.setDOMText('analytics-kpi-won-value', `$${totalWonValue.toLocaleString()}`);
    this.setDOMText('analytics-kpi-avg-won', `$${avgWonValue.toLocaleString()}`);
    this.setDOMText('analytics-kpi-pipeline', `$${pipelineValue.toLocaleString()}`);
  }

  setDOMText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  renderPlatformPerformanceTable() {
    const tableBody = document.getElementById('analytics-platform-table-body');
    if (!tableBody) return;

    const proposals = window.storage.getProposals();

    // Group by platform
    const platformMap = {};
    proposals.forEach(p => {
      const plat = p.platform || 'Direct';
      if (!platformMap[plat]) {
        platformMap[plat] = {
          total: 0,
          accepted: 0,
          rejected: 0,
          pending: 0,
          totalValue: 0,
          earnedValue: 0
        };
      }
      platformMap[plat].total++;
      platformMap[plat].totalValue += Number(p.value) || 0;

      if (p.status === 'Accepted') {
        platformMap[plat].accepted++;
        platformMap[plat].earnedValue += Number(p.value) || 0;
      } else if (p.status === 'Rejected') {
        platformMap[plat].rejected++;
      } else {
        platformMap[plat].pending++;
      }
    });

    const platforms = Object.keys(platformMap);

    tableBody.innerHTML = platforms.map(plat => {
      const data = platformMap[plat];
      const decided = data.accepted + data.rejected;
      const winRate = decided > 0 ? Math.round((data.accepted / decided) * 100) : (data.accepted > 0 ? 100 : 0);
      const avgProjectValue = data.total > 0 ? Math.round(data.totalValue / data.total) : 0;

      return `
        <tr>
          <td><strong style="color: var(--text-primary);">${plat}</strong></td>
          <td style="text-align: center;">${data.total}</td>
          <td style="text-align: center; color: var(--success-600); font-weight: 600;">${data.accepted}</td>
          <td style="text-align: center; color: var(--warning-600);">${data.pending}</td>
          <td style="text-align: center; color: var(--danger-600);">${data.rejected}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="flex: 1; height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden;">
                <div style="width: ${winRate}%; height: 100%; background: var(--success-500);"></div>
              </div>
              <span style="font-weight: 700; font-size: 0.75rem;">${winRate}%</span>
            </div>
          </td>
          <td><strong>$${data.earnedValue.toLocaleString()}</strong></td>
          <td>$${avgProjectValue.toLocaleString()}</td>
        </tr>
      `;
    }).join('');
  }

  renderAnalyticsCharts() {
    if (typeof Chart === 'undefined') return;

    const proposals = window.storage.getProposals();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? '#273549' : '#e2e8f0';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    // 1. Platform Revenue Comparison Bar Chart
    const ctxPlatform = document.getElementById('chart-analytics-platform');
    if (ctxPlatform) {
      if (this.charts.platformRoi) this.charts.platformRoi.destroy();

      const platformEarnings = {};
      proposals.forEach(p => {
        const plat = p.platform || 'Direct';
        if (p.status === 'Accepted') {
          platformEarnings[plat] = (platformEarnings[plat] || 0) + (Number(p.value) || 0);
        }
      });

      this.charts.platformRoi = new Chart(ctxPlatform, {
        type: 'bar',
        data: {
          labels: Object.keys(platformEarnings),
          datasets: [{
            label: 'Total Won Earnings ($)',
            data: Object.values(platformEarnings),
            backgroundColor: '#10b981',
            borderRadius: 6,
            barThickness: 28
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { family: 'Inter' } } },
            y: {
              beginAtZero: true,
              ticks: { callback: v => `$${v.toLocaleString()}`, color: textColor, font: { family: 'Inter' } },
              grid: { color: gridColor }
            }
          }
        }
      });
    }

    // 2. Win / Loss Ratio Doughnut Chart
    const ctxWinLoss = document.getElementById('chart-analytics-winloss');
    if (ctxWinLoss) {
      if (this.charts.winLoss) this.charts.winLoss.destroy();

      const accepted = proposals.filter(p => p.status === 'Accepted').length;
      const rejected = proposals.filter(p => p.status === 'Rejected').length;
      const active = proposals.filter(p => p.status !== 'Accepted' && p.status !== 'Rejected' && p.status !== 'Withdrawn').length;

      this.charts.winLoss = new Chart(ctxWinLoss, {
        type: 'doughnut',
        data: {
          labels: ['Accepted (Won)', 'Rejected (Lost)', 'Active In-Progress'],
          datasets: [{
            data: [accepted, rejected, active],
            backgroundColor: ['#10b981', '#ef4444', '#6366f1'],
            borderColor: isDark ? '#111827' : '#ffffff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { family: 'Inter', size: 11 }, color: textColor }
            }
          },
          cutout: '65%'
        }
      });
    }
  }
}

// Global Analytics Instance
window.analyticsModule = new AnalyticsModule();

/* ===== js/app.js ===== */
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
