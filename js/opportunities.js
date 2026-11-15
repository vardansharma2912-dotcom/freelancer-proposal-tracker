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
