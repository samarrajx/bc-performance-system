# BC Performance Admin Panel & Agent App 🚀

A comprehensive performance management system for Business Correspondents (BCs), featuring a powerful **Admin Dashboard** for management and a cross-platform **Agent App** for field operations.

---

## 🏗️ Technology Stack

### 🌐 Admin Dashboard (Web)
*   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
*   **Language**: TypeScript
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **Data Handling**: Supabase Client, PapaParse (CSV)
*   **State Management**: React Hooks & Context

### 📱 Agent App (Mobile)
*   **Framework**: [Flutter](https://flutter.dev/) (Cross-platform)
*   **Language**: Dart
*   **Backend Integration**: `supabase_flutter` package
*   **UI/UX**: Material 3 Design

### ☁️ Backend & Database
*   **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
*   **Authentication**: Supabase Auth (Email/Password)
*   **Security**: Row Level Security (RLS) policies
*   **API**: Next.js API Routes (Serverless)

---

## ✨ Key Features

### 🖥️ Admin Panel
1.  **Dashboard**: Real-time metrics, PMJDY tracking, and daily transaction summaries.
2.  **Master Data Management**:
    *   **Agents**: View, add, deactivate, and manage agents (with Region/Status filters).
    *   **Devices**: Inventory management with location tracking (State/District/Region).
    *   **Master Sync**: Upload CSV to sync agents and devices in bulk.
3.  **Commission Engine**:
    *   **Upload**: Drag-and-drop CSV upload for monthly commissions.
    *   **Approvals**: Review and approve commission payouts before release.
    *   **Column Settings**: Dynamic configuration of commission CSV headers and visibility.
4.  **Daily Operations**:
    *   **Daily Upload**: Upload daily performance performance data.
    *   **Upload Logs**: Audit trail of all data uploads.
5.  **System Tools**:
    *   **System Health Console**: Auto-diagnose data integrity issues (e.g., unassigned devices).
    *   **Password Reset**: Admin tool to reset agent passwords to default.

### 📱 Agent App
1.  **Secure Login**: Agent ID & Password login with **Mandatory Password Change** on first use.
2.  **Interactive Dashboard**:
    *   **Today's View**: Live tracking of deposits, withdrawals, AEPS, and remittance.
    *   **Month View**: Aggregate performance data with date pickers.
    *   **Schemes**: Track PMJDY, PMJJBY, PMSBY, and APY enrollments.
3.  **Performance Tab**: Detailed breakdown of financial and non-financial metrics.
4.  **Commission History**: View approved monthly commission statements.
5.  **Profile**: Manage account details and secure logout.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   Flutter SDK (for mobile app)
*   Supabase Account

### 1. Clone the Repository
```bash
git clone https://github.com/your-repo/bc-performance-admin.git
cd bc-performance-admin
```

### 2. Admin Panel Setup
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Set up environment variables in `.env.local`:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000).

### 3. Agent App Setup
1.  Navigate to the app directory:
    ```bash
    cd agent-app
    ```
2.  Get dependencies:
    ```bash
    flutter pub get
    ```
3.  Run on emulator or device:
    ```bash
    flutter run
    ```

---

## 🔒 Security
*   **Row Level Security (RLS)**: Ensures agents can only access their own data.
*   **Admin Privileges**: Only users with `role: admin` in the `profiles` table can access the Admin Panel.
*   **Secure Storage**: Passwords are hashed and managed by Supabase Auth.

---

## 📂 Project Structure
*   `/app`: Next.js App Router pages (Admin Panel).
*   `/components`: Reusable React components (Layouts, UI elements).
*   `/supabase`: SQL schemas, migrations, and utility scripts.
*   `/agent-app`: Flutter source code for the mobile application.

---

Built with ❤️ for efficient BC Management.
