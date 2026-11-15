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
