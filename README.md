# ISKedyuler - Collaborative Task Management Web App

## Live Production URL
* **Deployed App:** [https://cmsc128-lab1-crud-arellano.vercel.app/](https://cmsc128-lab1-crud-arellano.vercel.app/)

## Tech Stack & Architecture

* **Frontend:** React (Vite), Tailwind CSS, Custom Modern UI
* **Backend & Database:** Supabase (PostgreSQL, Row Level Security, RPC Functions, Auth)
* **Hosting / Deployment:** Vercel (Production Static Deployment)

## Summary of Refactoring & Optimizations (Lab 4)

* **Code Clean-up:** Removed dead code, unused console logs, and organized component concerns cleanly.
* **Backend Optimization:** Eliminated redundant queries by leveraging robust PostgreSQL views/RPC functions (`get_workspace_users`) with `SECURITY DEFINER` to securely bypass RLS recursion while keeping strict UBAC (User-Based Access Control) rules intact.
* **UX/UI Audit:** Implemented clear feedback loops (loading states, custom alert modals, smooth animations), consistent component styling, and a gated workspace UI requiring explicit invite acceptance or rejection before rendering content.

## Local Setup & Running Instructions

To run this repository locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Junel-A/cmsc128-Lab1_CRUD_Arellano.git
   cd cmsc128-Lab1_CRUD_Arellano
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Supabase project credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

## 🔌 Example Database Operations & Endpoints (Supabase RPC)

* `invite_member_by_email(target_list_id UUID, target_email TEXT)` — Invites a user to a shared workspace by email.
* `accept_workspace_invite(target_list_id UUID)` — Accepts a pending workspace invitation for the current session user.
* `reject_workspace_invite(target_list_id UUID)` — Declines or removes a pending workspace invitation.
* `get_workspace_users(target_list_id UUID)` — Securely retrieves list owners and members along with their roles and status.