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
