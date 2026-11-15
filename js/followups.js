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
