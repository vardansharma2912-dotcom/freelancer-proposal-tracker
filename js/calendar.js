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
