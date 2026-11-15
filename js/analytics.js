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
