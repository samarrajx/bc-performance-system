# BC Performance System 🚀

![BC Performance System](https://img.shields.io/badge/Status-Live-success) ![Next.js](https://img.shields.io/badge/Built_with-Next.js_15-black) ![Flutter](https://img.shields.io/badge/Mobile-Flutter-blue)

A comprehensive, state-of-the-art performance management system built for Business Correspondents (BCs) and the administrative team of the **Sanjivani Vikas Foundation**. 

It features a powerful **Admin Dashboard** with a stunning modern glassmorphic UI for network operations, and a cross-platform **Agent App** for daily field data tracking.

---

## 🌍 Live Demo
**Admin Portal Live URL:** [https://bc-performance-system.onrender.com](https://bc-performance-system.onrender.com)

*(Note: Access is restricted to authorized Administrator accounts via Supabase Row Level Security.)*

---

## 🏗️ Technology Stack

### 🌐 Admin Dashboard (Web)
*   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
*   **Language**: TypeScript
*   **Design System**: Custom **Minimal Glassmorphic UI** using [Tailwind CSS v4](https://tailwindcss.com/)
*   **Data Handling**: Supabase Client, PapaParse (Dynamic CSV processing)
*   **State Management**: React Hooks & Context

### 📱 Agent App (Mobile)
*   **Framework**: [Flutter](https://flutter.dev/) (Cross-platform Android & iOS)
*   **Language**: Dart
*   **Backend Integration**: `supabase_flutter` package
*   **UI/UX**: Material 3 Design with comprehensive Dark Mode support

### ☁️ Backend & Database
*   **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
*   **Authentication**: Supabase Auth
*   **Security**: Strict Row Level Security (RLS) policies isolating Agent and Admin data
*   **Automation**: PostgreSQL Triggers & Functions (RPCs)

---

## ✨ Key Features & Modules

### 🖥️ Admin Panel
1. **Intelligent Dashboard**: Real-time metrics tracking agents, assigned devices, unassigned orphans, and daily transaction summaries.
2. **Dynamic Commission Engine**:
   *   **CSV Upload Engine**: Advanced drag-and-drop CSV processor that handles complex banking sheets.
   *   **Dynamic Column Mapping**: Administrators can map custom vendor CSV headers to internal database fields dynamically via the UI without touching code.
   *   **Validation Rules**: Strict financial checks (e.g., ensuring `BC_COMM + CORP_COMM = NET COMMISSION`) and duplicate agent detection.
   *   **Automated TDS**: Application-layer 2% TDS deduction calculation.
   *   **Approvals Pipeline**: Review, audit, and approve commission payouts before they are visible to agents.
3. **Master Data Management**:
   *   **Agents Profile Management**: View, add, deactivate, and track agent device assignments.
   *   **Hardware Inventory**: Complete device tracking mapped to states, districts, and regions.
   *   **Master Export Module**: Comprehensive reporting tools exporting filterable CSVs across all entities.
4. **Daily Operations**:
   *   **Daily Upload Pipeline**: Bulk data ingestion for daily financial and non-financial agent performance.
   *   **System Audit Logs**: Track every file uploaded by administrators, including success states and error logs.
5. **System Tools**:
   *   **Health Console**: Auto-diagnosing dashboard checking system integrity (e.g., locating orphan devices or agents without valid assignments).
   *   **Password Management**: Tools to force-reset agent passwords to network defaults securely.

### 📱 Agent App
1. **Secure Access**: Agent ID & Password login with a strict **Mandatory Password Change** protocol on first application use.
2. **Interactive Telemetry Dashboard**:
   *   **Today's View**: Live tracking of deposits, withdrawals, AEPS, and remittance numbers.
   *   **Month View**: Aggregate performance data controlled via custom date pickers.
   *   **Government Schemes**: Dedicated trackers for PMJDY, PMJJBY, PMSBY, and APY enrollments.
3. **Performance Diagnostics**: Detailed breakdown of financial and non-financial metrics per agent.
4. **Statements & Commissions**: Secure viewing of only approved monthly commission statements, providing complete transparency to the field agent.
5. **Profile Module**: Manage account metadata and secure application logout.

---

## 🎨 Design Philosophy: Minimal Glassmorphism

The entire administrative web platform was redesigned from the ground up to break away from generic B2B dashboard styling. It utilizes:
*   **Translucent Panel Overlays (`glass-panel`)**: Multi-layered shadows and backdrop blurs over deep slate backgrounds.
*   **Abstract Gradients**: Avoiding flat colors by implementing dynamic text gradients (Emeralds, Cyans, and Violets) to denote hierarchy and interactability.
*   **Advanced Typography**: Refined letter-spacing and varied font weights to construct an effortlessly readable and highly premium interface.
*   **Adaptive Threoming**: 100% native toggleable Light and Dark Mode that completely shifts the ambient UI environment without breaking contrast accessibility.

---

## 🚀 Local Development Setup

### Prerequisites
*   Node.js 18+
*   Flutter SDK (for the mobile application)
*   Supabase Project

### 1. Clone the Repository
```bash
git clone https://github.com/samarrajx/bc-performance-system.git
cd bc-performance-system
```

### 2. Admin Panel Setup
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Set up your `.env.local`:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    ```
3.  Launch the development server:
    ```bash
    npm run dev
    ```
4.  Navigate to `http://localhost:3000`.

### 3. Agent App Setup
1.  Navigate to the mobile directory:
    ```bash
    cd agent-app
    ```
2.  Pull dependencies:
    ```bash
    flutter pub get
    ```
3.  Run on emulator/device:
    ```bash
    flutter run
    ```

---

## 🔒 Security Architecture
*   **Row Level Security (RLS)**: PostgreSQL policies guarantee Agents can *only* query rows tagged with their specific `agent_id`.
*   **Administrative Isolation**: The `/app/admin/*` and dashboard routes are guarded; access is granted exclusively to user UUIDs flagged with the `role: "admin"` in the protected profiles table.
*   **Data Integrity Checksums**: Application-layer validation rejects anomalous financial commission matrices prior to database insertion.

---

*Built with precision for the Sanjivani Vikas Foundation.*
