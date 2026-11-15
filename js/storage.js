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

    const SAMPLE_CLIENTS = [
      { id: `CLI-DEMO-1`, name: 'Apex FinTech Solutions', contactPerson: 'David Miller', email: 'david@apexfintech.io', location: 'New York, USA', industry: 'FinTech / Banking', notes: 'Series B crypto analytics client.' },
      { id: `CLI-DEMO-2`, name: 'Nexa Health Tech', contactPerson: 'Sarah Jenkins', email: 'sarah.j@nexahealth.com', location: 'Boston, MA', industry: 'Healthcare / SaaS', notes: 'Telemedicine web platform.' },
      { id: `CLI-DEMO-3`, name: 'CloudScale Infrastructure', contactPerson: 'Elena Rostova', email: 'elena@cloudscale.net', location: 'London, UK', industry: 'DevOps / Cloud Services', notes: 'Kubernetes monitoring tool.' }
    ];

    const SAMPLE_OPPS = [
      { id: `OPP-DEMO-1`, title: 'High-Frequency Crypto Analytics Dashboard', clientId: `CLI-DEMO-1`, clientName: 'Apex FinTech Solutions', platform: 'Upwork', value: 6500, currency: curr, dateDiscovered: '2026-10-15', deadline: '2026-11-25', submissionDate: '2026-10-22', status: 'Accepted', priority: 'High', description: 'Real-time WebSocket market trading dashboard with Chart.js.', notes: 'Kickoff call completed.' },
      { id: `OPP-DEMO-2`, title: 'Telehealth Patient Portal UI Overhaul', clientId: `CLI-DEMO-2`, clientName: 'Nexa Health Tech', platform: 'LinkedIn', value: 12000, currency: curr, dateDiscovered: '2026-10-20', deadline: '2026-12-05', submissionDate: '2026-11-01', status: 'Negotiation', priority: 'High', description: 'Accessible HIPAA-compliant medical patient appointment dashboard.', notes: 'Discussing milestone structure.' },
      { id: `OPP-DEMO-3`, title: 'Kubernetes Cluster Cost Optimization CLI & Web UI', clientId: `CLI-DEMO-3`, clientName: 'CloudScale Infrastructure', platform: 'Direct Outreach', value: 8500, currency: curr, dateDiscovered: '2026-11-01', deadline: '2026-11-30', submissionDate: '2026-11-08', status: 'Interview', priority: 'High', description: 'Tool for visual multi-cluster AWS cost monitoring.', notes: 'Technical interview completed.' }
    ];

    const todayStr = new Date().toISOString().split('T')[0];
    const SAMPLE_FOLLOWUPS = [
      { id: `FOL-DEMO-1`, opportunityId: `OPP-DEMO-2`, opportunityTitle: 'Telehealth Patient Portal UI Overhaul', clientId: `CLI-DEMO-2`, clientName: 'Nexa Health Tech', dueDate: todayStr, type: 'Call / Meeting', notes: 'Milestone scope review meeting', completed: false }
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

    this.logActivity('Sample Data Loaded', 'Loaded sample demo opportunities and clients for evaluation', 'download');
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
