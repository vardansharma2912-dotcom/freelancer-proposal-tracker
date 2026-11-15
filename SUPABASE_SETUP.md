# Supabase Integration & Multi-User Setup Guide

This guide walks you through connecting **ProposalFlow (Freelancer Proposal Tracker)** to a live Supabase PostgreSQL database with Row Level Security (RLS) for complete multi-tenant user isolation.

---

## 1. Create a Supabase Project

1. Navigate to [Supabase](https://supabase.com) and sign in (or create a free account).
2. Click **New Project**.
3. Choose an organization, enter a project name (e.g., `proposalflow-production`), and generate a strong database password.
4. Select the geographic region closest to your target audience.
5. Click **Create new project** and wait ~2 minutes for the database to provision.

---

## 2. Execute Database Schema & RLS Policies

1. In the Supabase Dashboard, open the **SQL Editor** from the left navigation.
2. Click **New Query**.
3. Open [`supabase_schema.sql`](./supabase_schema.sql) from the root of this repository.
4. Copy and paste the entire SQL script into the query editor.
5. Click **Run** (or press `Ctrl + Enter`).

### What this creates:
- `public.profiles`: Stores user name, role, email, and target hourly rate (auto-created on signup via trigger).
- `public.clients`: Stores client organizations, contacts, locations, and industries with `user_id` foreign key.
- `public.opportunities`: Stores all proposals, bids, values, currencies, platforms, and deadlines with `user_id` foreign key.
- `public.followups`: Stores date-driven reminders and completion status with `user_id` foreign key.
- `public.notes`: Stores rich notes, tags, and client associations with `user_id` foreign key.
- `public.activities`: Audit trail of actions with `user_id` foreign key.
- **Row Level Security (RLS)** enabled on all 6 tables:
  - Users can **only** `SELECT`, `INSERT`, `UPDATE`, and `DELETE` records where `auth.uid() = user_id`.
  - Zero cross-tenant data leakage is possible at the database level.

---

## 3. Retrieve Project API Credentials

1. In the left navigation, go to **Project Settings** (gear icon) > **API**.
2. Copy the following two values:
   - **Project URL**: e.g., `https://abcdefghijklm.supabase.co`
   - **Project API Keys**: Copy the **`anon` `public`** key (e.g., `eyJhbGciOi...`).
   > ⚠️ **IMPORTANT**: Never copy or expose the `service_role` secret key in the frontend. Only the public `anon` key is needed because Supabase Row Level Security (RLS) protects the database directly.

---

## 4. Configure Authentication & Redirect URLs

1. In the left navigation, go to **Authentication** > **URL Configuration**.
2. Set the **Site URL** to your live deployment URL:
   ```
   https://vardansharma2912-dotcom.github.io/freelancer-proposal-tracker/
   ```
3. Under **Redirect URLs**, add the following URLs (for local development and production recovery):
   - `https://vardansharma2912-dotcom.github.io/freelancer-proposal-tracker/`
   - `http://localhost:8000`
   - `http://localhost:8000/`
   - `http://127.0.0.1:8000`
   - `http://127.0.0.1:8000/`
4. Click **Save**.

### Email Confirmations (Optional):
- By default, Supabase sends confirmation emails. To allow instant login during testing or academic evaluation without waiting for email delivery, go to **Authentication** > **Providers** > **Email** and toggle off **Confirm email**.

---

## 5. Connect ProposalFlow to Your Supabase Cloud

You can connect your Supabase credentials in two convenient ways:

### Method A: Connect from the UI (Zero Code Changes)
1. Launch ProposalFlow in your browser.
2. In the top navigation bar, click the **Supabase Status Pill** or click the **User Menu** > **Supabase Settings** (or go to *Data & Settings* > *Configure Supabase*).
3. Paste your **Supabase Project URL** and **Public Anon Key**.
4. Click **Save & Connect**. The application will instantly switch to Supabase Cloud and show a green dot: `Supabase Cloud (RLS Active)`.

### Method B: Pre-configure in Code
Open [`js/supabase-config.js`](./js/supabase-config.js) and update the default constants:
```javascript
const DEFAULT_SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'YOUR_PUBLIC_ANON_KEY';
```

---

## 6. Multi-User Verification & Testing

Verify that user isolation works properly:

1. **Register User A**:
   - Go to the Sign Up screen.
   - Enter Name: `Alice Freelancer`, Email: `alice@test.com`, Password: `Password123!`.
   - Click **Create Account**.
   - Notice: The dashboard opens with **completely empty records** (0 opportunities, $0 pipeline).
   - Click *Add Opportunity* and create a project: "Alice's Web App" ($5,000).
   - In the top right user menu, click **Sign Out**.

2. **Register User B**:
   - Go to the Sign Up screen.
   - Enter Name: `Bob Consultant`, Email: `bob@test.com`, Password: `Password123!`.
   - Click **Create Account**.
   - Notice: Bob's workspace is **completely clean** (0 opportunities, $0 pipeline).
   - Alice's project "Alice's Web App" is **completely invisible** to Bob!
   - Bob creates his own project: "Bob's Cloud Migration" ($12,000).
   - Click **Sign Out**.

3. **Log back in as User A (`alice@test.com`)**:
   - Log in with `alice@test.com`.
   - Alice's project "Alice's Web App" ($5,000) is restored from the cloud.
   - Bob's project is not visible to Alice.

4. **Database Row Level Security Proof**:
   - Even if User B inspects network requests and attempts to make a `fetch` request using their own JWT to query Alice's record ID, PostgreSQL automatically rejects or returns empty results because `auth.uid() != user_id`.
