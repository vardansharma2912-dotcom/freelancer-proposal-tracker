/**
 * Freelancer Proposal Tracker - Storage Engine & Data Management
 * Manages localStorage operations, seed data, export/import features.
 */

const STORAGE_KEYS = {
  PROPOSALS: 'ftp_proposals',
  CLIENTS: 'ftp_clients',
  FOLLOWUPS: 'ftp_followups',
  NOTES: 'ftp_notes',
  ACTIVITIES: 'ftp_activities',
  SETTINGS: 'ftp_settings'
};

// Realistic Seed Dataset
const SEED_CLIENTS = [
  {
    id: 'CLI-101',
    name: 'Apex FinTech Solutions',
    contactPerson: 'David Miller',
    email: 'david@apexfintech.io',
    phone: '+1 (555) 234-5678',
    website: 'https://apexfintech.io',
    location: 'New York, USA',
    industry: 'FinTech / Banking',
    notes: 'Fast-moving Series B startup building modern investment tooling. Strict on security standards.',
    createdAt: '2026-09-10'
  },
  {
    id: 'CLI-102',
    name: 'Nexa Health Tech',
    contactPerson: 'Sarah Jenkins',
    email: 'sarah.j@nexahealth.com',
    phone: '+1 (555) 876-5432',
    website: 'https://nexahealth.com',
    location: 'Boston, MA, USA',
    industry: 'Healthcare / SaaS',
    notes: 'HIPAA-compliant telemedicine web dashboard. High-budget enterprise client.',
    createdAt: '2026-09-22'
  },
  {
    id: 'CLI-103',
    name: 'CloudScale Infrastructure',
    contactPerson: 'Elena Rostova',
    email: 'elena@cloudscale.net',
    phone: '+44 20 7946 0912',
    website: 'https://cloudscale.net',
    location: 'London, UK',
    industry: 'DevOps / Cloud Services',
    notes: 'Kubernetes monitoring and developer platform tooling. Very technical team.',
    createdAt: '2026-10-01'
  },
  {
    id: 'CLI-104',
    name: 'Aurora Creative Studio',
    contactPerson: 'Marc Dupont',
    email: 'marc@auroracreative.fr',
    phone: '+33 1 42 68 55 00',
    website: 'https://auroracreative.fr',
    location: 'Paris, France',
    industry: 'Design & E-Commerce',
    notes: 'Luxury lifestyle brand needing bespoke Shopify & 3D WebGL experiences.',
    createdAt: '2026-10-14'
  },
  {
    id: 'CLI-105',
    name: 'Kite AI Labs',
    contactPerson: 'Kenji Sato',
    email: 'kenji@kitelabs.ai',
    phone: '+81 3 5555 0143',
    website: 'https://kitelabs.ai',
    location: 'Tokyo, Japan',
    industry: 'Artificial Intelligence',
    notes: 'AI prompt workbench and multimodal agent playground. Looking for frontend specialist.',
    createdAt: '2026-10-28'
  },
  {
    id: 'CLI-106',
    name: 'Vanguard Logistics',
    contactPerson: 'Michael Chang',
    email: 'mchang@vanguardlog.com',
    phone: '+1 (555) 432-1987',
    website: 'https://vanguardlog.com',
    location: 'Chicago, IL, USA',
    industry: 'Supply Chain & Logistics',
    notes: 'Fleet management tracking portal rewrite. Long-term retainer potential.',
    createdAt: '2026-11-02'
  }
];

const SEED_PROPOSALS = [
  {
    id: 'OPP-2026-001',
    title: 'High-Frequency Crypto Analytics Dashboard',
    description: 'Build a low-latency real-time trading dashboard using WebSockets, dynamic charts and responsive tabular data.',
    clientId: 'CLI-101',
    clientName: 'Apex FinTech Solutions',
    platform: 'Upwork',
    value: 6500,
    currency: 'USD',
    dateDiscovered: '2026-10-05',
    deadline: '2026-10-20',
    submissionDate: '2026-10-12',
    status: 'Accepted',
    followUpDate: '2026-11-18',
    priority: 'High',
    notes: 'Client was impressed with previous Chart.js and WebSocket portfolio examples. Kickoff meeting held.',
    createdAt: '2026-10-05'
  },
  {
    id: 'OPP-2026-002',
    title: 'Telehealth Patient Portal UI Overhaul',
    description: 'Modernize patient appointment scheduling, prescription tracking and video consultation interface with WCAG 2.1 AA compliance.',
    clientId: 'CLI-102',
    clientName: 'Nexa Health Tech',
    platform: 'LinkedIn',
    value: 12000,
    currency: 'USD',
    dateDiscovered: '2026-10-12',
    deadline: '2026-11-05',
    submissionDate: '2026-10-25',
    status: 'Negotiation',
    followUpDate: '2026-11-16',
    priority: 'High',
    notes: 'Final review of contract scope. Discussing milestone payment breakdown.',
    createdAt: '2026-10-12'
  },
  {
    id: 'OPP-2026-003',
    title: 'Kubernetes Cluster Cost Optimization CLI & Web UI',
    description: 'Design interactive visualizer for AWS and GCP multi-cluster cost allocation and idle pod detection.',
    clientId: 'CLI-103',
    clientName: 'CloudScale Infrastructure',
    platform: 'Direct Outreach',
    value: 8500,
    currency: 'USD',
    dateDiscovered: '2026-10-18',
    deadline: '2026-11-10',
    submissionDate: '2026-10-29',
    status: 'Interview',
    followUpDate: '2026-11-15', // Today's follow-up
    priority: 'High',
    notes: 'Technical interview completed with CTO. Follow up today on architectural recommendations document.',
    createdAt: '2026-10-18'
  },
  {
    id: 'OPP-2026-004',
    title: 'Luxury Boutique Shopify Custom Theme Development',
    description: 'Develop custom Liquid theme with animated micro-interactions, currency switcher and bespoke filtering.',
    clientId: 'CLI-104',
    clientName: 'Aurora Creative Studio',
    platform: 'Referral',
    value: 4800,
    currency: 'USD',
    dateDiscovered: '2026-10-22',
    deadline: '2026-11-14',
    submissionDate: '2026-11-02',
    status: 'Under Review',
    followUpDate: '2026-11-17',
    priority: 'Medium',
    notes: 'Submitted proposal with video walkthrough of previous luxury fashion brand build.',
    createdAt: '2026-10-22'
  },
  {
    id: 'OPP-2026-005',
    title: 'Multimodal AI Agent Workflow Builder',
    description: 'Create an interactive node-based canvas for chaining LLM prompts, tool execution and API fallbacks.',
    clientId: 'CLI-105',
    clientName: 'Kite AI Labs',
    platform: 'Twitter/X',
    value: 9500,
    currency: 'USD',
    dateDiscovered: '2026-10-30',
    deadline: '2026-11-20',
    submissionDate: '2026-11-06',
    status: 'Submitted',
    followUpDate: '2026-11-15', // Today
    priority: 'High',
    notes: 'Check in on prompt engineer review status.',
    createdAt: '2026-10-30'
  },
  {
    id: 'OPP-2026-006',
    title: 'Real-Time Fleet Dispatch & Route Optimization',
    description: 'Full stack progressive web app with offline caching and live GPS telemetry updates.',
    clientId: 'CLI-106',
    clientName: 'Vanguard Logistics',
    platform: 'Upwork',
    value: 14500,
    currency: 'USD',
    dateDiscovered: '2026-11-01',
    deadline: '2026-11-25',
    submissionDate: '2026-11-08',
    status: 'Under Review',
    followUpDate: '2026-11-19',
    priority: 'High',
    notes: 'Submitted customized proposal outlining offline-first ServiceWorker architecture.',
    createdAt: '2026-11-01'
  },
  {
    id: 'OPP-2026-007',
    title: 'Automated Real Estate Scraper & Lead Notifier',
    description: 'Python & Node web scraper tracking municipal building permit filings with email alerts.',
    clientId: 'CLI-101',
    clientName: 'Apex FinTech Solutions',
    platform: 'Contra',
    value: 2800,
    currency: 'USD',
    dateDiscovered: '2026-10-02',
    deadline: '2026-10-15',
    submissionDate: '2026-10-06',
    status: 'Accepted',
    followUpDate: '2026-10-25',
    priority: 'Low',
    notes: 'Project completed successfully and payment settled. Generated 5-star review.',
    createdAt: '2026-10-02'
  },
  {
    id: 'OPP-2026-008',
    title: 'Headless CMS Migration to Strapi',
    description: 'Migrate legacy WordPress content to headless Strapi instance with GraphQL schema design.',
    clientId: 'CLI-104',
    clientName: 'Aurora Creative Studio',
    platform: 'Upwork',
    value: 3600,
    currency: 'USD',
    dateDiscovered: '2026-10-10',
    deadline: '2026-10-26',
    submissionDate: '2026-10-15',
    status: 'Rejected',
    followUpDate: '',
    priority: 'Medium',
    notes: 'Client went with an in-house developer due to existing team capacity.',
    createdAt: '2026-10-10'
  },
  {
    id: 'OPP-2026-009',
    title: 'SaaS Billing & Stripe Metered Invoicing Engine',
    description: 'Integrate Stripe Customer Portal, usage-based metering and automated dunning workflows.',
    clientId: 'CLI-102',
    clientName: 'Nexa Health Tech',
    platform: 'Fiverr Pro',
    value: 5200,
    currency: 'USD',
    dateDiscovered: '2026-11-05',
    deadline: '2026-11-28',
    submissionDate: '',
    status: 'Ready to Submit',
    followUpDate: '2026-11-20',
    priority: 'Medium',
    notes: 'Cover letter drafted. Needs final rate check against deliverables breakdown.',
    createdAt: '2026-11-05'
  },
  {
    id: 'OPP-2026-010',
    title: 'Design System & Figma Component Library',
    description: 'Design accessible token-based UI kit and Figma library for multi-brand engineering teams.',
    clientId: 'CLI-103',
    clientName: 'CloudScale Infrastructure',
    platform: 'Direct Outreach',
    value: 4200,
    currency: 'USD',
    dateDiscovered: '2026-11-08',
    deadline: '2026-11-30',
    submissionDate: '',
    status: 'Draft',
    followUpDate: '2026-11-22',
    priority: 'Low',
    notes: 'Gathering sample component tokens to include in pitch deck.',
    createdAt: '2026-11-08'
  },
  {
    id: 'OPP-2026-011',
    title: 'Microservices Observability & OpenTelemetry Tracing',
    description: 'Implement distributed tracing and Jaeger exporter integration across 12 Golang microservices.',
    clientId: 'CLI-103',
    clientName: 'CloudScale Infrastructure',
    platform: 'LinkedIn',
    value: 7800,
    currency: 'USD',
    dateDiscovered: '2026-10-25',
    deadline: '2026-11-08',
    submissionDate: '2026-10-28',
    status: 'Withdrawn',
    followUpDate: '',
    priority: 'Medium',
    notes: 'Withdrew after client modified scope to require 24/7 on-call duty.',
    createdAt: '2026-10-25'
  },
  {
    id: 'OPP-2026-012',
    title: 'Interactive WebGL 3D Product Customizer',
    description: 'Three.js powered 3D model configurator allowing customers to personalize materials, colors and engravings.',
    clientId: 'CLI-104',
    clientName: 'Aurora Creative Studio',
    platform: 'Upwork',
    value: 6200,
    currency: 'USD',
    dateDiscovered: '2026-11-10',
    deadline: '2026-12-05',
    submissionDate: '2026-11-12',
    status: 'Submitted',
    followUpDate: '2026-11-21',
    priority: 'High',
    notes: 'Sent interactive CodePen demo showcasing GLTF model texture swapping.',
    createdAt: '2026-11-10'
  }
];

const SEED_FOLLOWUPS = [
  {
    id: 'FOL-001',
    opportunityId: 'OPP-2026-003',
    opportunityTitle: 'Kubernetes Cluster Cost Optimization CLI & Web UI',
    clientId: 'CLI-103',
    clientName: 'CloudScale Infrastructure',
    dueDate: '2026-11-15', // Today
    type: 'Email',
    notes: 'Follow up on technical proposal review and architecture diagram.',
    completed: false,
    createdAt: '2026-11-10'
  },
  {
    id: 'FOL-002',
    opportunityId: 'OPP-2026-005',
    opportunityTitle: 'Multimodal AI Agent Workflow Builder',
    clientId: 'CLI-105',
    clientName: 'Kite AI Labs',
    dueDate: '2026-11-15', // Today
    type: 'Platform Message',
    notes: 'Inquire if engineering team had a chance to test the interactive sandbox demo.',
    completed: false,
    createdAt: '2026-11-11'
  },
  {
    id: 'FOL-003',
    opportunityId: 'OPP-2026-002',
    opportunityTitle: 'Telehealth Patient Portal UI Overhaul',
    clientId: 'CLI-102',
    clientName: 'Nexa Health Tech',
    dueDate: '2026-11-16', // Upcoming
    type: 'Call / Meeting',
    notes: 'Contract review call with Sarah Jenkins to finalize timeline milestones.',
    completed: false,
    createdAt: '2026-11-12'
  },
  {
    id: 'FOL-004',
    opportunityId: 'OPP-2026-004',
    opportunityTitle: 'Luxury Boutique Shopify Custom Theme Development',
    clientId: 'CLI-104',
    clientName: 'Aurora Creative Studio',
    dueDate: '2026-11-17', // Upcoming
    type: 'Email',
    notes: 'Check proposal status and offer reference contacts from past luxury e-commerce projects.',
    completed: false,
    createdAt: '2026-11-12'
  },
  {
    id: 'FOL-005',
    opportunityId: 'OPP-2026-006',
    opportunityTitle: 'Real-Time Fleet Dispatch & Route Optimization',
    clientId: 'CLI-106',
    clientName: 'Vanguard Logistics',
    dueDate: '2026-11-19', // Upcoming
    type: 'LinkedIn Message',
    notes: 'Share article on WebSocket connection resiliency in low-connectivity areas.',
    completed: false,
    createdAt: '2026-11-13'
  },
  {
    id: 'FOL-006',
    opportunityId: 'OPP-2026-008',
    opportunityTitle: 'Headless CMS Migration to Strapi',
    clientId: 'CLI-104',
    clientName: 'Aurora Creative Studio',
    dueDate: '2026-11-05', // Overdue
    type: 'Email',
    notes: 'Send follow-up courtesy note thanking Marc for the consideration.',
    completed: false,
    createdAt: '2026-10-30'
  },
  {
    id: 'FOL-007',
    opportunityId: 'OPP-2026-001',
    opportunityTitle: 'High-Frequency Crypto Analytics Dashboard',
    clientId: 'CLI-101',
    clientName: 'Apex FinTech Solutions',
    dueDate: '2026-10-18', // Completed
    type: 'Call / Meeting',
    notes: 'Sprint planning and GitHub repo access provisioning.',
    completed: true,
    createdAt: '2026-10-12'
  },
  {
    id: 'FOL-008',
    opportunityId: 'OPP-2026-007',
    opportunityTitle: 'Automated Real Estate Scraper & Lead Notifier',
    clientId: 'CLI-101',
    clientName: 'Apex FinTech Solutions',
    dueDate: '2026-10-22', // Completed
    type: 'Email',
    notes: 'Deliver final documentation and request Upwork feedback.',
    completed: true,
    createdAt: '2026-10-15'
  }
];

const SEED_NOTES = [
  {
    id: 'NOT-001',
    title: 'Apex FinTech Security Requirements',
    content: 'Client mandates SOC2 compliance and zero third-party telemetry scripts. All UI dependencies must be packaged locally or pinned via SRI hashes.',
    clientId: 'CLI-101',
    clientName: 'Apex FinTech Solutions',
    opportunityId: 'OPP-2026-001',
    tags: ['Security', 'Requirements'],
    createdAt: '2026-10-08 14:30'
  },
  {
    id: 'NOT-002',
    title: 'Nexa Health Milestone Breakdown',
    content: 'Phase 1: Wireframing and design tokens ($3,000). Phase 2: Telehealth appointment flow ($4,500). Phase 3: Video consultation component ($4,500).',
    clientId: 'CLI-102',
    clientName: 'Nexa Health Tech',
    opportunityId: 'OPP-2026-002',
    tags: ['Billing', 'Milestones'],
    createdAt: '2026-10-26 11:15'
  },
  {
    id: 'NOT-003',
    title: 'CloudScale CTO Meeting Notes',
    content: 'Elena stressed that their primary pain point is engineers leaving test Kubernetes clusters active over the weekend. Dashboard must highlight idle clusters with dollar cost estimates.',
    clientId: 'CLI-103',
    clientName: 'CloudScale Infrastructure',
    opportunityId: 'OPP-2026-003',
    tags: ['Meeting', 'Insights'],
    createdAt: '2026-10-29 16:45'
  },
  {
    id: 'NOT-004',
    title: 'Aurora Studio Visual Identity Rules',
    content: 'Brand fonts: Editorial New and Helvetica Neue. Primary palette is obsidian and off-white with micro-animations on hover states.',
    clientId: 'CLI-104',
    clientName: 'Aurora Creative Studio',
    opportunityId: 'OPP-2026-004',
    tags: ['Design', 'Branding'],
    createdAt: '2026-11-03 09:20'
  },
  {
    id: 'NOT-005',
    title: 'Kite AI Node Canvas Architecture',
    content: 'Recommend React Flow or custom SVG canvas. Need fast zoom and pan support with minimum 60fps performance on 200+ connected nodes.',
    clientId: 'CLI-105',
    clientName: 'Kite AI Labs',
    opportunityId: 'OPP-2026-005',
    tags: ['Architecture', 'Canvas'],
    createdAt: '2026-11-07 15:10'
  }
];

const SEED_ACTIVITIES = [
  {
    id: 'ACT-001',
    action: 'Opportunity Added',
    details: 'Created "Interactive WebGL 3D Product Customizer" ($6,200)',
    timestamp: '2026-11-10 10:15',
    icon: 'plus-circle'
  },
  {
    id: 'ACT-002',
    action: 'Status Updated',
    details: 'Moved "High-Frequency Crypto Analytics Dashboard" to Accepted',
    timestamp: '2026-11-11 14:20',
    icon: 'check-circle'
  },
  {
    id: 'ACT-003',
    action: 'Proposal Submitted',
    details: 'Submitted proposal for "Interactive WebGL 3D Product Customizer"',
    timestamp: '2026-11-12 11:00',
    icon: 'send'
  },
  {
    id: 'ACT-004',
    action: 'Follow-up Scheduled',
    details: 'Scheduled reminder with CloudScale Infrastructure for technical review',
    timestamp: '2026-11-13 16:30',
    icon: 'bell'
  },
  {
    id: 'ACT-005',
    action: 'Status Updated',
    details: 'Moved "Telehealth Patient Portal UI Overhaul" to Negotiation',
    timestamp: '2026-11-14 09:45',
    icon: 'trending-up'
  }
];

const DEFAULT_SETTINGS = {
  theme: 'light',
  currency: 'USD',
  userProfile: {
    name: 'Vardaan',
    email: 'vardaan@tech-titans.dev',
    role: 'Senior Full-Stack Freelancer',
    rate: '$95/hr'
  }
};

/**
 * Storage Controller Class
 */
class StorageController {
  constructor() {
    this.init();
  }

  init() {
    // Check if initial data exists, if not, populate demo data
    if (!localStorage.getItem(STORAGE_KEYS.PROPOSALS)) {
      this.resetDemoData();
    }
  }

  // Generic Get & Set
  getItem(key, defaultValue = []) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage:`, e);
      return defaultValue;
    }
  }

  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error saving ${key} to localStorage:`, e);
      return false;
    }
  }

  // --- PROPOSALS / OPPORTUNITIES ---
  getProposals() {
    return this.getItem(STORAGE_KEYS.PROPOSALS, []);
  }

  getProposalById(id) {
    return this.getProposals().find(p => p.id === id);
  }

  saveProposals(proposals) {
    return this.setItem(STORAGE_KEYS.PROPOSALS, proposals);
  }

  addProposal(proposalData) {
    const proposals = this.getProposals();
    const newId = `OPP-2026-${String(proposals.length + 1).padStart(3, '0')}`;
    const newProposal = {
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
      ...proposalData
    };
    proposals.unshift(newProposal);
    this.saveProposals(proposals);

    this.logActivity('Opportunity Added', `Created "${newProposal.title}" (${newProposal.currency} ${Number(newProposal.value).toLocaleString()})`, 'plus-circle');
    return newProposal;
  }

  updateProposal(id, updatedData) {
    const proposals = this.getProposals();
    const index = proposals.findIndex(p => p.id === id);
    if (index === -1) return null;

    const oldStatus = proposals[index].status;
    proposals[index] = { ...proposals[index], ...updatedData };
    this.saveProposals(proposals);

    if (updatedData.status && updatedData.status !== oldStatus) {
      this.logActivity('Status Changed', `Updated "${proposals[index].title}" to ${updatedData.status}`, 'trending-up');
    } else {
      this.logActivity('Proposal Updated', `Modified details of "${proposals[index].title}"`, 'edit');
    }
    return proposals[index];
  }

  deleteProposal(id) {
    const proposals = this.getProposals();
    const target = proposals.find(p => p.id === id);
    const filtered = proposals.filter(p => p.id !== id);
    this.saveProposals(filtered);

    // Also remove any follow-ups attached
    const followups = this.getFollowups().filter(f => f.opportunityId !== id);
    this.saveFollowups(followups);

    if (target) {
      this.logActivity('Opportunity Deleted', `Removed "${target.title}"`, 'trash');
    }
    return true;
  }

  // --- CLIENTS ---
  getClients() {
    return this.getItem(STORAGE_KEYS.CLIENTS, []);
  }

  getClientById(id) {
    return this.getClients().find(c => c.id === id);
  }

  saveClients(clients) {
    return this.setItem(STORAGE_KEYS.CLIENTS, clients);
  }

  addClient(clientData) {
    const clients = this.getClients();
    const newId = `CLI-${100 + clients.length + 1}`;
    const newClient = {
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
      ...clientData
    };
    clients.unshift(newClient);
    this.saveClients(clients);

    this.logActivity('Client Added', `Added new client "${newClient.name}"`, 'user-plus');
    return newClient;
  }

  updateClient(id, updatedData) {
    const clients = this.getClients();
    const index = clients.findIndex(c => c.id === id);
    if (index === -1) return null;

    clients[index] = { ...clients[index], ...updatedData };
    this.saveClients(clients);

    // Update client name in linked proposals if changed
    if (updatedData.name) {
      const proposals = this.getProposals();
      let changed = false;
      proposals.forEach(p => {
        if (p.clientId === id) {
          p.clientName = updatedData.name;
          changed = true;
        }
      });
      if (changed) this.saveProposals(proposals);
    }

    this.logActivity('Client Updated', `Updated profile of "${clients[index].name}"`, 'user-check');
    return clients[index];
  }

  deleteClient(id) {
    const clients = this.getClients();
    const target = clients.find(c => c.id === id);
    const filtered = clients.filter(c => c.id !== id);
    this.saveClients(filtered);

    if (target) {
      this.logActivity('Client Deleted', `Removed client "${target.name}"`, 'trash');
    }
    return true;
  }

  // --- FOLLOW-UPS ---
  getFollowups() {
    return this.getItem(STORAGE_KEYS.FOLLOWUPS, []);
  }

  saveFollowups(followups) {
    return this.setItem(STORAGE_KEYS.FOLLOWUPS, followups);
  }

  addFollowup(followupData) {
    const followups = this.getFollowups();
    const newId = `FOL-${String(followups.length + 1).padStart(3, '0')}`;
    const newFollowup = {
      id: newId,
      completed: false,
      createdAt: new Date().toISOString().split('T')[0],
      ...followupData
    };
    followups.unshift(newFollowup);
    this.saveFollowups(followups);

    this.logActivity('Follow-up Scheduled', `Reminder for "${newFollowup.clientName}" on ${newFollowup.dueDate}`, 'bell');
    return newFollowup;
  }

  updateFollowup(id, updatedData) {
    const followups = this.getFollowups();
    const index = followups.findIndex(f => f.id === id);
    if (index === -1) return null;

    followups[index] = { ...followups[index], ...updatedData };
    this.saveFollowups(followups);
    return followups[index];
  }

  toggleFollowupComplete(id) {
    const followups = this.getFollowups();
    const index = followups.findIndex(f => f.id === id);
    if (index === -1) return null;

    followups[index].completed = !followups[index].completed;
    this.saveFollowups(followups);

    const statusText = followups[index].completed ? 'Completed' : 'Reopened';
    this.logActivity('Follow-up Updated', `${statusText} follow-up for "${followups[index].clientName}"`, 'check');
    return followups[index];
  }

  deleteFollowup(id) {
    const followups = this.getFollowups();
    const filtered = followups.filter(f => f.id !== id);
    this.saveFollowups(filtered);
    return true;
  }

  // --- NOTES ---
  getNotes() {
    return this.getItem(STORAGE_KEYS.NOTES, []);
  }

  saveNotes(notes) {
    return this.setItem(STORAGE_KEYS.NOTES, notes);
  }

  addNote(noteData) {
    const notes = this.getNotes();
    const newId = `NOT-${String(notes.length + 1).padStart(3, '0')}`;
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newNote = {
      id: newId,
      createdAt: formattedDate,
      ...noteData
    };
    notes.unshift(newNote);
    this.saveNotes(notes);

    this.logActivity('Note Added', `Added note: "${newNote.title}"`, 'file-text');
    return newNote;
  }

  updateNote(id, updatedData) {
    const notes = this.getNotes();
    const index = notes.findIndex(n => n.id === id);
    if (index === -1) return null;

    notes[index] = { ...notes[index], ...updatedData };
    this.saveNotes(notes);
    return notes[index];
  }

  deleteNote(id) {
    const notes = this.getNotes();
    const filtered = notes.filter(n => n.id !== id);
    this.saveNotes(filtered);
    return true;
  }

  // --- ACTIVITIES ---
  getActivities() {
    return this.getItem(STORAGE_KEYS.ACTIVITIES, []);
  }

  logActivity(action, details, icon = 'activity') {
    const activities = this.getActivities();
    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newActivity = {
      id: `ACT-${Date.now()}`,
      action,
      details,
      timestamp,
      icon
    };
    activities.unshift(newActivity);
    // Keep max 50 recent activities
    if (activities.length > 50) activities.pop();
    this.setItem(STORAGE_KEYS.ACTIVITIES, activities);
  }

  // --- SETTINGS ---
  getSettings() {
    return this.getItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  saveSettings(settings) {
    return this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  // --- SEED RESET & CLEAR ---
  resetDemoData() {
    this.setItem(STORAGE_KEYS.CLIENTS, JSON.parse(JSON.stringify(SEED_CLIENTS)));
    this.setItem(STORAGE_KEYS.PROPOSALS, JSON.parse(JSON.stringify(SEED_PROPOSALS)));
    this.setItem(STORAGE_KEYS.FOLLOWUPS, JSON.parse(JSON.stringify(SEED_FOLLOWUPS)));
    this.setItem(STORAGE_KEYS.NOTES, JSON.parse(JSON.stringify(SEED_NOTES)));
    this.setItem(STORAGE_KEYS.ACTIVITIES, JSON.parse(JSON.stringify(SEED_ACTIVITIES)));
    this.setItem(STORAGE_KEYS.SETTINGS, JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
    return true;
  }

  clearAllData() {
    this.setItem(STORAGE_KEYS.PROPOSALS, []);
    this.setItem(STORAGE_KEYS.CLIENTS, []);
    this.setItem(STORAGE_KEYS.FOLLOWUPS, []);
    this.setItem(STORAGE_KEYS.NOTES, []);
    this.setItem(STORAGE_KEYS.ACTIVITIES, []);
    this.logActivity('Data Reset', 'All records were cleared by user', 'alert-triangle');
    return true;
  }

  // --- EXPORT FUNCTIONALITY ---
  exportToCSV(type = 'proposals') {
    let csvContent = '';
    let filename = '';

    if (type === 'proposals') {
      const proposals = this.getProposals();
      const headers = ['ID', 'Title', 'Client', 'Platform', 'Value', 'Currency', 'Status', 'Discovered Date', 'Deadline', 'Submission Date', 'Follow-up Date', 'Notes'];
      const rows = proposals.map(p => [
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
      const clients = this.getClients();
      const headers = ['ID', 'Company Name', 'Contact Person', 'Email', 'Phone', 'Website', 'Location', 'Industry', 'Notes'];
      const rows = clients.map(c => [
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
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      proposals: this.getProposals(),
      clients: this.getClients(),
      followups: this.getFollowups(),
      notes: this.getNotes(),
      activities: this.getActivities(),
      settings: this.getSettings()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `freelancer_tracker_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }

  importFromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.proposals && !parsed.clients) {
        throw new Error('Invalid file structure. Expected proposal or client data.');
      }

      if (Array.isArray(parsed.proposals)) this.setItem(STORAGE_KEYS.PROPOSALS, parsed.proposals);
      if (Array.isArray(parsed.clients)) this.setItem(STORAGE_KEYS.CLIENTS, parsed.clients);
      if (Array.isArray(parsed.followups)) this.setItem(STORAGE_KEYS.FOLLOWUPS, parsed.followups);
      if (Array.isArray(parsed.notes)) this.setItem(STORAGE_KEYS.NOTES, parsed.notes);

      this.logActivity('Data Imported', 'Successfully imported database backup from JSON', 'download-cloud');
      return { success: true };
    } catch (e) {
      console.error('Import error:', e);
      return { success: false, error: e.message };
    }
  }
}

// Global Storage Instance
window.storage = new StorageController();
