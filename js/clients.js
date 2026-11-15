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
