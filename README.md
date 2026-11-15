# ProposalFlow | Freelancer Proposal & Pipeline Tracker

A modern, high-performance, responsive web application engineered for independent software engineers, consultants, designers, and creative freelancers to centrally manage project opportunities, client relationships, proposal pipelines, deadlines, follow-up touchpoints, and financial performance analytics.

Developed strictly with **HTML5, CSS3, and Vanilla JavaScript (ES6+)** with **zero frontend frameworks**, backed by **Supabase Auth** and **PostgreSQL with Row Level Security (RLS)** for true multi-user data isolation.

---

## 1. Architecture Highlights

- **Multi-Tenant User Isolation**: Every user has their own isolated account. User A can never access, edit, or see records belonging to User B.
- **Supabase Cloud Backend**: Authenticated sessions, JWT verification, and PostgreSQL tables with strict Row Level Security policies (`auth.uid() = user_id`).
- **Zero Frontend Frameworks**: 100% native Web Standards (HTML5 Semantic Elements, Modern CSS Custom Properties, ES6+ Object-Oriented JavaScript Modules).
- **GitHub Pages Static Hosting**: Fully compatible with static web hosting without requiring a Node.js backend server.
- **Zero Hardcoded Identities**: New user accounts start with an empty, clean workspace. No hardcoded names or pre-populated demo records for real accounts.
- **Optional On-Demand Demo Data**: A "Load Sample Demo Data" action is provided in Settings for evaluation purposes, strictly tagged to the requesting user.

---

## 2. Authentication System (Supabase Auth)

1. **Sign In (Login)**:
   - Email and password authentication with client-side format validation.
   - Show/Hide password toggle.
   - "Remember Me" session persistence.
   - Comprehensive error alerts (invalid credentials, rate limiting).
2. **Registration (Sign Up)**:
   - Captures Full Name, Work Email, Password, and Confirm Password.
   - Enforces minimum 6-character password length and exact confirmation match.
   - Automatically initializes user profile record in `public.profiles`.
   - Supports Supabase email confirmation flows with an email verification notice screen.
3. **Forgot & Reset Password**:
   - Request password recovery instructions via email.
   - Secure token handling from Supabase recovery redirect URL (`#access_token=...&type=recovery`).
   - Dedicated password reset view with validation and instant session update.
4. **Session Management & Sign Out**:
   - Automatic session restoration on page reload (`supabase.auth.getSession()`).
   - Initial loading state prevents unauthorized dashboard flash.
   - Session termination clears in-memory user cache and redirects to login.

---

## 3. Database Security & Row Level Security (RLS)

All database entities are defined in [`supabase_schema.sql`](./supabase_schema.sql):

| Table | Purpose | Security Policy (RLS) |
|---|---|---|
| `profiles` | Extended user identity, role, hourly rate | `auth.uid() = id` (SELECT, UPDATE, INSERT) |
| `clients` | Organizations, key contacts, locations | `auth.uid() = user_id` (SELECT, INSERT, UPDATE, DELETE) |
| `opportunities` | Proposals, bids, values, currencies, stages | `auth.uid() = user_id` (SELECT, INSERT, UPDATE, DELETE) |
| `followups` | Time-sensitive reminders and touchpoints | `auth.uid() = user_id` (SELECT, INSERT, UPDATE, DELETE) |
| `notes` | Research briefs, cover letters, meeting minutes | `auth.uid() = user_id` (SELECT, INSERT, UPDATE, DELETE) |
| `activities` | User audit log | `auth.uid() = user_id` (SELECT, INSERT) |

---

## 4. Application Modules

### 4.1 Executive Dashboard
- **Real-Time KPIs**: Total Opportunities, Active Pipeline Value ($), Realized Earnings ($), Proposal Win Rate (%), Submitted Bids, In-Review Opportunities, and Active Follow-ups.
- **4 Dynamic Chart.js Visualizations**:
  - *Monthly Proposal Submissions*: 6-month historical submission volume.
  - *Status Distribution*: Doughnut chart mapping proposals across 6 distinct lifecycle stages.
  - *Lead Acquisition by Platform*: Channel breakdown (Upwork, LinkedIn, Referral, Direct, etc.).
  - *Pipeline vs. Realized Earnings*: Financial bar comparison of unclosed bids to settled revenue.
- **Urgent Action Widgets**: Upcoming deadlines within 7-14 days, urgent follow-up checklist with 1-click completion, and chronological activity audit trail.

### 4.2 Opportunity Directory (CRUD & Filtering)
- Complete Create, Read, Update, and Delete operations.
- Data fields: Unique ID, Project Title, Description, Client Association, Platform, Value, Currency, Discovery Date, Application Deadline, Submission Date, Lifecycle Status, Follow-up Date, Priority, and Cover Letter Notes.
- Multi-parameter live search, status filtering, platform filtering, and sorting (by Value, Date Discovered, Deadline, Title).
- Quick inline lifecycle status switcher.

### 4.3 Proposal Kanban Pipeline
- Visual 5-stage drag-and-drop workflow:
  1. *Draft & Ready to Submit*
  2. *Submitted & Under Review*
  3. *Interview & Negotiation*
  4. *Accepted (Won)*
  5. *Rejected & Withdrawn*
- Native HTML5 Drag and Drop API integration with dropzone highlights and automatic KPI recalculation.
- Stage-level value aggregators (e.g., "$24,500 across 3 proposals").
- 1-click toggle between Kanban Pipeline view and Tabular view.

### 4.4 Client Management Directory
- Detailed client profiles: Company Name, Key Contact Person, Email, Phone, Website, Physical/Remote Location, Industry, and Internal Notes.
- Computed lifetime stats per client: Total Proposals, Deals Won, and Total Revenue Settled.
- Dedicated Client Details Modal displaying all linked opportunities and historical performance.

### 4.5 Follow-up Reminders System
- Categorized tab navigation: **Today's Reminders**, **Upcoming**, **Overdue**, and **Completed**.
- Follow-up scheduling with communication medium tagging (Email, Call/Meeting, Marketplace Message, LinkedIn DM).
- Instant checkbox completion toggle with activity logging.

### 4.6 Interactive Deadline Calendar
- Full monthly grid with previous/next month navigation, "Today" shortcut, and week day headers.
- Multi-colored event badges plotted directly on day cells:
  - ⏳ Application Deadlines (Red/Coral)
  - 🚀 Proposal Submissions (Indigo/Blue)
  - 🔔 Follow-up Reminders (Purple)
- Day Agenda Modal detailing all milestones for any clicked date with direct links to view or schedule events.

### 4.7 Client & Proposal Notes
- Searchable notes repository with tagging (`#Security`, `#Milestones`, `#Architecture`).
- Direct association with specific clients and opportunities with automatic timestamping.

### 4.8 Deep Performance Analytics
- Win Rate %, Rejection Rate %, Average Opportunity Size, and Average Won Deal Value.
- Platform ROI Conversion Matrix: Total Bids, Won Deals, Active Reviews, Rejections, Win Rate %, Total Earned, and Average Project Value per marketplace.
- Platform Cash Generation bar chart and Deal Outcome ratio doughnut chart.

---

## 5. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Structure** | HTML5 | Semantic markup, accessible forms, modal dialogs |
| **Styling** | CSS3 (Custom Variables) | Responsive layout, design tokens, light/dark theme engine |
| **Logic** | Vanilla JavaScript (ES6+) | Object-oriented modular controllers, router, state management |
| **Authentication** | Supabase Auth | User registration, login, session persistence, password reset |
| **Database** | Supabase PostgreSQL + RLS | Isolated multi-tenant cloud storage |
| **Visualizations** | Chart.js (v4.x via CDN) | Interactive canvas-based dynamic charts |
| **Icons** | Lucide Icons (via CDN) | Professional SVG iconography |
| **Testing** | Node.js Test Harness & Headless Chrome | Automated end-to-end browser integration testing |

---

## 6. Project Folder Structure

```
freelancer-proposal-tracker/
│
├── index.html              # Main application shell, auth views and modals
├── supabase_schema.sql     # PostgreSQL database schema and RLS policies
├── SUPABASE_SETUP.md       # Step-by-step Supabase cloud configuration guide
├── README.md               # Project documentation and architectural overview
├── .gitignore              # Git ignore rules for OS and temporary files
│
├── css/
│   ├── style.css           # Design tokens, reset, typography, auth views, themes & app shell
│   ├── components.css      # Buttons, cards, badges, tables, modals, Kanban & calendar
│   └── responsive.css      # Media queries, mobile drawer, responsive breakpoints
│
└── js/
    ├── supabase-config.js  # Supabase client manager & isolated multi-user fallback engine
    ├── auth.js             # Authentication controller (login, signup, reset, session)
    ├── storage.js          # Multi-user storage engine with Supabase cloud persistence
    ├── app.js              # Application orchestrator, router, theme, global search, toasts
    ├── dashboard.js        # KPI calculations, Chart.js instances, activity feed
    ├── opportunities.js    # Opportunity CRUD, filters, sorting, table renderer
    ├── proposals.js        # Kanban board controller, HTML5 drag-and-drop
    ├── clients.js          # Client directory, profile view, linked deal calculations
    ├── followups.js        # Follow-up scheduler, overdue/today/upcoming tabs
    ├── calendar.js         # Monthly interactive calendar & day agenda modal
    ├── notes.js            # Notes manager, association tagging, search
    └── analytics.js        # Deep-dive analytics, platform ROI matrix
```

---

## 7. How to Setup and Run Locally

### Option 1: Direct Browser Launch
Because ProposalFlow is built purely with native Web Standards, no build step or node installation is required:
1. Clone or download the repository.
2. Double-click `index.html` to open it directly in any modern browser.
3. Sign up with any test account (e.g., `user@test.com`) to begin.

### Option 2: Local Web Server
```powershell
python -m http.server 8000
```
Navigate to `http://localhost:8000`.

### Option 3: Connect to Live Supabase Cloud
Read the step-by-step instructions in [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md).

---

## 8. Multi-User Verification & Security Tests

Run the automated test suite (`scratch/test_multiuser.js`) to verify:
- Registration of User A.
- Clean initial workspace for User A.
- Creation of records under User A.
- Sign out.
- Registration of User B.
- Verification that User A's records are completely invisible to User B.
- User B adds separate records.
- User A logs back in and only sees User A's original records.
- Zero runtime errors or security leaks.

---

## 9. Live Deployment

- **GitHub Repository**: [https://github.com/vardansharma2912-dotcom/freelancer-proposal-tracker](https://github.com/vardansharma2912-dotcom/freelancer-proposal-tracker)
- **Live Deployed Website**: [https://vardansharma2912-dotcom.github.io/freelancer-proposal-tracker/](https://vardansharma2912-dotcom.github.io/freelancer-proposal-tracker/)
