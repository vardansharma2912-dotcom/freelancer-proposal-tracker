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
