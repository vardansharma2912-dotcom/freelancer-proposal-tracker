/**
 * Freelancer Proposal Tracker (ProposalFlow) - Multi-User Cloud Storage Engine
 * Backed by Supabase PostgreSQL with Row Level Security (RLS) data isolation.
 */

class StorageController {
  constructor() {
    this.currentUserId = null;
    this.currentUserEmail = null;
    this.currentProfile = null;

    // In-memory cache for the authenticated user
    this.proposals = [];
    this.clients = [];
    this.followups = [];
    this.notes = [];
    this.activities = [];
    this.isLoading = false;
  }

  getClient() {
    return window.supabaseManager.getClient();
  }

  /**
   * Initializes data store for the authenticated user.
   * Pulls user-isolated records from Supabase cloud database.
   */
  async initForUser(user) {
    if (!user) return;
    this.currentUserId = user.id;
    this.currentUserEmail = user.email;
    this.isLoading = true;

    try {
      const client = this.getClient();

      // 1. Fetch Profile
      const { data: profileData } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id);

      if (profileData && profileData.length > 0) {
        this.currentProfile = profileData[0];
      } else {
        // Fallback to user metadata
        this.currentProfile = {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email.split('@')[0],
          email: user.email,
          role: user.user_metadata?.role || 'Full-Stack Freelancer',
          target_hourly_rate: '$85/hr'
        };
      }

      // 2. Fetch User-Isolated Opportunities
      const { data: opps } = await client
        .from('opportunities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      this.proposals = (opps || []).map(p => this.mapDboToProposal(p));

      // 3. Fetch User-Isolated Clients
      const { data: clientRows } = await client
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      this.clients = (clientRows || []).map(c => this.mapDboToClient(c));

      // 4. Fetch User-Isolated Follow-ups
      const { data: folRows } = await client
        .from('followups')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      this.followups = (folRows || []).map(f => this.mapDboToFollowup(f));

      // 5. Fetch User-Isolated Notes
      const { data: noteRows } = await client
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      this.notes = (noteRows || []).map(n => this.mapDboToNote(n));

      // 6. Fetch User Activities
      const { data: actRows } = await client
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      this.activities = (actRows || []).map(a => this.mapDboToActivity(a));

      console.log(`✅ Loaded ${this.proposals.length} opportunities, ${this.clients.length} clients for user ${user.email}`);
    } catch (err) {
      console.error('Error fetching user data from Supabase:', err);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Purges all user data from memory upon logout to prevent state leakage.
   */
  purgeUserData() {
    this.currentUserId = null;
    this.currentUserEmail = null;
    this.currentProfile = null;
    this.proposals = [];
    this.clients = [];
    this.followups = [];
    this.notes = [];
    this.activities = [];
    console.log('🧹 In-memory user state purged.');
  }

  // --- PROPOSALS & OPPORTUNITIES ---
  getProposals() {
    return this.proposals;
  }

  getProposalById(id) {
    return this.proposals.find(p => p.id === id);
  }

  async addProposal(proposalData) {
    if (!this.currentUserId) return null;

    const newId = `OPP-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;
    const nowStr = new Date().toISOString().split('T')[0];

    const proposal = {
      id: newId,
      userId: this.currentUserId,
      createdAt: nowStr,
      ...proposalData
    };

    // Update in-memory cache
    this.proposals.unshift(proposal);

    // Persist to Supabase with RLS
    try {
      const client = this.getClient();
      await client.from('opportunities').insert([{
        id: proposal.id,
        user_id: this.currentUserId,
        title: proposal.title,
        description: proposal.description || '',
        client_id: proposal.clientId || null,
        client_name: proposal.clientName || '',
        platform: proposal.platform || 'Direct Outreach',
        value: Number(proposal.value) || 0,
        currency: proposal.currency || 'USD',
        date_discovered: proposal.dateDiscovered || null,
        deadline: proposal.deadline || null,
        submission_date: proposal.submissionDate || null,
        status: proposal.status || 'Draft',
        follow_up_date: proposal.followUpDate || null,
        priority: proposal.priority || 'Medium',
        notes: proposal.notes || ''
      }]);
    } catch (err) {
      console.error('Failed to save opportunity to Supabase:', err);
    }

    this.logActivity('Opportunity Added', `Created "${proposal.title}" (${proposal.currency} ${Number(proposal.value).toLocaleString()})`, 'plus-circle');
    return proposal;
  }

  async updateProposal(id, updatedData) {
    if (!this.currentUserId) return null;

    const index = this.proposals.findIndex(p => p.id === id);
    if (index === -1) return null;

    const oldStatus = this.proposals[index].status;
    this.proposals[index] = { ...this.proposals[index], ...updatedData };

    // Persist to Supabase with RLS
    try {
      const client = this.getClient();
      const updatePayload = {};

      if (updatedData.title !== undefined) updatePayload.title = updatedData.title;
      if (updatedData.description !== undefined) updatePayload.description = updatedData.description;
      if (updatedData.clientId !== undefined) updatePayload.client_id = updatedData.clientId;
      if (updatedData.clientName !== undefined) updatePayload.client_name = updatedData.clientName;
      if (updatedData.platform !== undefined) updatePayload.platform = updatedData.platform;
      if (updatedData.value !== undefined) updatePayload.value = Number(updatedData.value) || 0;
      if (updatedData.currency !== undefined) updatePayload.currency = updatedData.currency;
      if (updatedData.dateDiscovered !== undefined) updatePayload.date_discovered = updatedData.dateDiscovered || null;
      if (updatedData.deadline !== undefined) updatePayload.deadline = updatedData.deadline || null;
      if (updatedData.submissionDate !== undefined) updatePayload.submission_date = updatedData.submissionDate || null;
      if (updatedData.status !== undefined) updatePayload.status = updatedData.status;
      if (updatedData.followUpDate !== undefined) updatePayload.follow_up_date = updatedData.followUpDate || null;
      if (updatedData.priority !== undefined) updatePayload.priority = updatedData.priority;
      if (updatedData.notes !== undefined) updatePayload.notes = updatedData.notes;

      await client.from('opportunities').update(updatePayload).eq('id', id).eq('user_id', this.currentUserId);
    } catch (err) {
      console.error('Failed to update opportunity in Supabase:', err);
    }

    if (updatedData.status && updatedData.status !== oldStatus) {
      this.logActivity('Status Changed', `Updated "${this.proposals[index].title}" to ${updatedData.status}`, 'trending-up');
    } else {
      this.logActivity('Proposal Updated', `Modified details of "${this.proposals[index].title}"`, 'edit');
    }

    return this.proposals[index];
  }

  async deleteProposal(id) {
    if (!this.currentUserId) return false;

    const target = this.proposals.find(p => p.id === id);
    this.proposals = this.proposals.filter(p => p.id !== id);

    // Also remove associated follow-ups
    this.followups = this.followups.filter(f => f.opportunityId !== id);

    // Persist to Supabase
    try {
      const client = this.getClient();
      await client.from('opportunities').delete().eq('id', id).eq('user_id', this.currentUserId);
      await client.from('followups').delete().eq('opportunity_id', id).eq('user_id', this.currentUserId);
    } catch (err) {
      console.error('Failed to delete opportunity from Supabase:', err);
    }

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
    if (!this.currentUserId) return null;

    const newId = `CLI-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;
    const nowStr = new Date().toISOString().split('T')[0];

    const client = {
      id: newId,
      userId: this.currentUserId,
      createdAt: nowStr,
      ...clientData
    };

    this.clients.unshift(client);

    try {
      const sb = this.getClient();
      await sb.from('clients').insert([{
        id: client.id,
        user_id: this.currentUserId,
        name: client.name,
        contact_person: client.contactPerson || '',
        email: client.email || '',
        phone: client.phone || '',
        website: client.website || '',
        location: client.location || '',
        industry: client.industry || '',
        notes: client.notes || ''
      }]);
    } catch (err) {
      console.error('Failed to save client to Supabase:', err);
    }

    this.logActivity('Client Added', `Added new client "${client.name}"`, 'user-plus');
    return client;
  }

  async updateClient(id, updatedData) {
    if (!this.currentUserId) return null;

    const index = this.clients.findIndex(c => c.id === id);
    if (index === -1) return null;

    this.clients[index] = { ...this.clients[index], ...updatedData };

    try {
      const sb = this.getClient();
      const payload = {};
      if (updatedData.name !== undefined) payload.name = updatedData.name;
      if (updatedData.contactPerson !== undefined) payload.contact_person = updatedData.contactPerson;
      if (updatedData.email !== undefined) payload.email = updatedData.email;
      if (updatedData.phone !== undefined) payload.phone = updatedData.phone;
      if (updatedData.website !== undefined) payload.website = updatedData.website;
      if (updatedData.location !== undefined) payload.location = updatedData.location;
      if (updatedData.industry !== undefined) payload.industry = updatedData.industry;
      if (updatedData.notes !== undefined) payload.notes = updatedData.notes;

      await sb.from('clients').update(payload).eq('id', id).eq('user_id', this.currentUserId);
    } catch (err) {
      console.error('Failed to update client in Supabase:', err);
    }

    this.logActivity('Client Updated', `Updated profile of "${this.clients[index].name}"`, 'user-check');
    return this.clients[index];
  }

  async deleteClient(id) {
    if (!this.currentUserId) return false;

    const target = this.clients.find(c => c.id === id);
    this.clients = this.clients.filter(c => c.id !== id);

    try {
      const sb = this.getClient();
      await sb.from('clients').delete().eq('id', id).eq('user_id', this.currentUserId);
    } catch (err) {
      console.error('Failed to delete client from Supabase:', err);
    }

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
    if (!this.currentUserId) return null;

    const newId = `FOL-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;
    const nowStr = new Date().toISOString().split('T')[0];

    const followup = {
      id: newId,
      userId: this.currentUserId,
      completed: false,
      createdAt: nowStr,
      ...followupData
    };

    this.followups.unshift(followup);

    try {
      const sb = this.getClient();
      await sb.from('followups').insert([{
        id: followup.id,
        user_id: this.currentUserId,
        opportunity_id: followup.opportunityId || null,
        opportunity_title: followup.opportunityTitle || '',
        client_id: followup.clientId || null,
        client_name: followup.clientName || 'Client',
        due_date: followup.dueDate,
        type: followup.type || 'Email',
        notes: followup.notes || '',
        completed: false
      }]);
    } catch (err) {
      console.error('Failed to save follow-up to Supabase:', err);
    }

    this.logActivity('Follow-up Scheduled', `Reminder for "${followup.clientName}" on ${followup.dueDate}`, 'bell');
    return followup;
  }

  async updateFollowup(id, updatedData) {
    if (!this.currentUserId) return null;

    const index = this.followups.findIndex(f => f.id === id);
    if (index === -1) return null;

    this.followups[index] = { ...this.followups[index], ...updatedData };

    try {
      const sb = this.getClient();
      const payload = {};
      if (updatedData.dueDate !== undefined) payload.due_date = updatedData.dueDate;
      if (updatedData.type !== undefined) payload.type = updatedData.type;
      if (updatedData.notes !== undefined) payload.notes = updatedData.notes;
      if (updatedData.completed !== undefined) payload.completed = updatedData.completed;

      await sb.from('followups').update(payload).eq('id', id).eq('user_id', this.currentUserId);
    } catch (err) {
      console.error('Failed to update follow-up in Supabase:', err);
    }

    return this.followups[index];
  }

  async toggleFollowupComplete(id) {
    if (!this.currentUserId) return null;

    const index = this.followups.findIndex(f => f.id === id);
    if (index === -1) return null;

    this.followups[index].completed = !this.followups[index].completed;

    try {
      const sb = this.getClient();
      await sb.from('followups')
        .update({ completed: this.followups[index].completed })
        .eq('id', id)
        .eq('user_id', this.currentUserId);
    } catch (err) {
      console.error('Failed to toggle follow-up in Supabase:', err);
    }

    const statusText = this.followups[index].completed ? 'Completed' : 'Reopened';
    this.logActivity('Follow-up Updated', `${statusText} follow-up for "${this.followups[index].clientName}"`, 'check');
    return this.followups[index];
  }

  async deleteFollowup(id) {
    if (!this.currentUserId) return false;

    this.followups = this.followups.filter(f => f.id !== id);

    try {
      const sb = this.getClient();
      await sb.from('followups').delete().eq('id', id).eq('user_id', this.currentUserId);
    } catch (err) {
      console.error('Failed to delete follow-up from Supabase:', err);
    }

    return true;
  }

  // --- NOTES ---
  getNotes() {
    return this.notes;
  }

  async addNote(noteData) {
    if (!this.currentUserId) return null;

    const newId = `NOT-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const note = {
      id: newId,
      userId: this.currentUserId,
      createdAt: formattedDate,
      ...noteData
    };

    this.notes.unshift(note);

    try {
      const sb = this.getClient();
      await sb.from('notes').insert([{
        id: note.id,
        user_id: this.currentUserId,
        title: note.title,
        content: note.content,
        client_id: note.clientId || null,
        client_name: note.clientName || '',
        opportunity_id: note.opportunityId || null,
        tags: Array.isArray(note.tags) ? note.tags : []
      }]);
    } catch (err) {
      console.error('Failed to save note to Supabase:', err);
    }

    this.logActivity('Note Added', `Added note: "${note.title}"`, 'file-text');
    return note;
  }

  async updateNote(id, updatedData) {
    if (!this.currentUserId) return null;

    const index = this.notes.findIndex(n => n.id === id);
    if (index === -1) return null;

    this.notes[index] = { ...this.notes[index], ...updatedData };

    try {
      const sb = this.getClient();
      const payload = {};
      if (updatedData.title !== undefined) payload.title = updatedData.title;
      if (updatedData.content !== undefined) payload.content = updatedData.content;
      if (updatedData.tags !== undefined) payload.tags = updatedData.tags;

      await sb.from('notes').update(payload).eq('id', id).eq('user_id', this.currentUserId);
    } catch (err) {
      console.error('Failed to update note in Supabase:', err);
    }

    return this.notes[index];
  }

  async deleteNote(id) {
    if (!this.currentUserId) return false;

    this.notes = this.notes.filter(n => n.id !== id);

    try {
      const sb = this.getClient();
      await sb.from('notes').delete().eq('id', id).eq('user_id', this.currentUserId);
    } catch (err) {
      console.error('Failed to delete note from Supabase:', err);
    }

    return true;
  }

  // --- ACTIVITIES ---
  getActivities() {
    return this.activities;
  }

  async logActivity(action, details, icon = 'activity') {
    if (!this.currentUserId) return;

    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newActivity = {
      id: `ACT-${Date.now()}`,
      userId: this.currentUserId,
      action,
      details,
      timestamp,
      icon
    };

    this.activities.unshift(newActivity);
    if (this.activities.length > 50) this.activities.pop();

    try {
      const sb = this.getClient();
      await sb.from('activities').insert([{
        id: newActivity.id,
        user_id: this.currentUserId,
        action: newActivity.action,
        details: newActivity.details,
        icon: newActivity.icon,
        timestamp: newActivity.timestamp
      }]);
    } catch (e) {
      // Activity log non-critical error
    }
  }

  // --- USER PROFILE & SETTINGS ---
  getProfile() {
    return this.currentProfile || {
      full_name: 'Freelancer',
      email: this.currentUserEmail || '',
      role: 'Full-Stack Freelancer',
      target_hourly_rate: '$85/hr'
    };
  }

  async updateProfile(profileData) {
    if (!this.currentUserId) return false;

    this.currentProfile = { ...this.currentProfile, ...profileData };

    try {
      const sb = this.getClient();
      await sb.from('profiles').update({
        full_name: profileData.full_name,
        role: profileData.role,
        target_hourly_rate: profileData.target_hourly_rate
      }).eq('id', this.currentUserId);

      // Also update user metadata in Supabase Auth
      await sb.auth.updateUser({
        data: {
          full_name: profileData.full_name,
          role: profileData.role
        }
      });
    } catch (err) {
      console.error('Failed to update profile in Supabase:', err);
    }

    return true;
  }

  // --- OPTIONAL DEMO DATA (ONLY WHEN USER EXPLICITLY REQUESTS IT) ---
  async loadSampleDemoData() {
    if (!this.currentUserId) return false;

    const SAMPLE_CLIENTS = [
      { id: `CLI-DEMO-1`, name: 'Apex FinTech Solutions', contactPerson: 'David Miller', email: 'david@apexfintech.io', location: 'New York, USA', industry: 'FinTech / Banking', notes: 'Series B crypto analytics client.' },
      { id: `CLI-DEMO-2`, name: 'Nexa Health Tech', contactPerson: 'Sarah Jenkins', email: 'sarah.j@nexahealth.com', location: 'Boston, MA', industry: 'Healthcare / SaaS', notes: 'Telemedicine web platform.' },
      { id: `CLI-DEMO-3`, name: 'CloudScale Infrastructure', contactPerson: 'Elena Rostova', email: 'elena@cloudscale.net', location: 'London, UK', industry: 'DevOps / Cloud Services', notes: 'Kubernetes monitoring tool.' }
    ];

    const SAMPLE_OPPS = [
      { id: `OPP-DEMO-1`, title: 'High-Frequency Crypto Analytics Dashboard', clientId: `CLI-DEMO-1`, clientName: 'Apex FinTech Solutions', platform: 'Upwork', value: 6500, currency: 'USD', dateDiscovered: '2026-10-15', deadline: '2026-11-25', submissionDate: '2026-10-22', status: 'Accepted', priority: 'High', description: 'Real-time WebSocket market trading dashboard with Chart.js.', notes: 'Kickoff call completed.' },
      { id: `OPP-DEMO-2`, title: 'Telehealth Patient Portal UI Overhaul', clientId: `CLI-DEMO-2`, clientName: 'Nexa Health Tech', platform: 'LinkedIn', value: 12000, currency: 'USD', dateDiscovered: '2026-10-20', deadline: '2026-12-05', submissionDate: '2026-11-01', status: 'Negotiation', priority: 'High', description: 'Accessible HIPAA-compliant medical patient appointment dashboard.', notes: 'Discussing milestone structure.' },
      { id: `OPP-DEMO-3`, title: 'Kubernetes Cluster Cost Optimization CLI & Web UI', clientId: `CLI-DEMO-3`, clientName: 'CloudScale Infrastructure', platform: 'Direct Outreach', value: 8500, currency: 'USD', dateDiscovered: '2026-11-01', deadline: '2026-11-30', submissionDate: '2026-11-08', status: 'Interview', priority: 'High', description: 'Tool for visual multi-cluster AWS cost monitoring.', notes: 'Technical interview completed.' }
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

  async clearUserData() {
    if (!this.currentUserId) return false;

    try {
      const sb = this.getClient();
      await sb.from('opportunities').delete().eq('user_id', this.currentUserId);
      await sb.from('clients').delete().eq('user_id', this.currentUserId);
      await sb.from('followups').delete().eq('user_id', this.currentUserId);
      await sb.from('notes').delete().eq('user_id', this.currentUserId);
      await sb.from('activities').delete().eq('user_id', this.currentUserId);
    } catch (err) {
      console.error('Failed to clear user data in Supabase:', err);
    }

    this.proposals = [];
    this.clients = [];
    this.followups = [];
    this.notes = [];
    this.activities = [];

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
      version: '2.0.0',
      userId: this.currentUserId,
      userEmail: this.currentUserEmail,
      exportDate: new Date().toISOString(),
      proposals: this.proposals,
      clients: this.clients,
      followups: this.followups,
      notes: this.notes
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

  // --- DTO MAPPERS ---
  mapDboToProposal(dbo) {
    return {
      id: dbo.id,
      userId: dbo.user_id,
      title: dbo.title,
      description: dbo.description || '',
      clientId: dbo.client_id,
      clientName: dbo.client_name,
      platform: dbo.platform,
      value: Number(dbo.value) || 0,
      currency: dbo.currency || 'USD',
      dateDiscovered: dbo.date_discovered || '',
      deadline: dbo.deadline || '',
      submissionDate: dbo.submission_date || '',
      status: dbo.status || 'Draft',
      followUpDate: dbo.follow_up_date || '',
      priority: dbo.priority || 'Medium',
      notes: dbo.notes || '',
      createdAt: dbo.created_at
    };
  }

  mapDboToClient(dbo) {
    return {
      id: dbo.id,
      userId: dbo.user_id,
      name: dbo.name,
      contactPerson: dbo.contact_person || '',
      email: dbo.email || '',
      phone: dbo.phone || '',
      website: dbo.website || '',
      location: dbo.location || '',
      industry: dbo.industry || '',
      notes: dbo.notes || '',
      createdAt: dbo.created_at
    };
  }

  mapDboToFollowup(dbo) {
    return {
      id: dbo.id,
      userId: dbo.user_id,
      opportunityId: dbo.opportunity_id,
      opportunityTitle: dbo.opportunity_title || '',
      clientId: dbo.client_id,
      clientName: dbo.client_name,
      dueDate: dbo.due_date,
      type: dbo.type || 'Email',
      notes: dbo.notes || '',
      completed: !!dbo.completed,
      createdAt: dbo.created_at
    };
  }

  mapDboToNote(dbo) {
    return {
      id: dbo.id,
      userId: dbo.user_id,
      title: dbo.title,
      content: dbo.content,
      clientId: dbo.client_id,
      clientName: dbo.client_name || '',
      opportunityId: dbo.opportunity_id,
      tags: dbo.tags || [],
      createdAt: dbo.created_at
    };
  }

  mapDboToActivity(dbo) {
    return {
      id: dbo.id,
      userId: dbo.user_id,
      action: dbo.action,
      details: dbo.details,
      icon: dbo.icon || 'activity',
      timestamp: dbo.timestamp,
      createdAt: dbo.created_at
    };
  }
}

// Global Storage Instance
window.storage = new StorageController();
