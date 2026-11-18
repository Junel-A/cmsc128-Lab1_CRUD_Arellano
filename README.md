# ISKedyuler - Collaborative Task Management Web App

## Tech Stack & Architecture
* **Frontend:** React (Vite), Tailwind CSS, Custom Modern UI
* **Backend & Database:** Supabase (PostgreSQL, Row Level Security, RPC Functions, Auth)
* **Hosting / Deployment:** Vite Build / Static Deployment

---

## Summary of Refactoring & Optimizations (Lab 4)
* **Code Clean-up:** Removed dead code, unused console logs, and organized component concerns cleanly.
* **Backend Optimization:** Eliminated redundant queries by leveraging robust PostgreSQL views/RPC functions (`get_workspace_users`) with `SECURITY DEFINER` to securely bypass RLS recursion while keeping strict UBAC (User-Based Access Control) rules intact.
* **UX/UI Audit:** Implemented clear feedback loops (loading states, custom alert modals, smooth animations), consistent component styling, and a gated workspace UI requiring explicit invite acceptance or rejection before rendering content.

---

## Local Setup & Running Instructions

To run this repository locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd <repo-folder>
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

---

## Accessing the App (Deployment / Tunneling Instructions)

* **Minimum Requirement (Local Tunnel via ngrok):**
  If running locally during defense, expose your local port using ngrok:
  ```bash
  ngrok http 5173
  ```
  Share the generated public HTTPS URL with the instructor so they can access it outside `localhost`.

* **Expanded Requirement (Remote Hosting):**
  The frontend can be built and deployed statically to hosting platforms like Vercel, Netlify, or GitHub Pages. 
  * Run `npm run build` to generate production assets.
  * Connect your repository to your hosting provider dashboard and inject the production environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).

---

## Example Database Operations & Endpoints (Supabase RPC)
* `invite_member_by_email(target_list_id UUID, target_email TEXT)` — Invites a user to a shared workspace by email.
* `accept_workspace_invite(target_list_id UUID)` — Accepts a pending workspace invitation for the current session user.
* `reject_workspace_invite(target_list_id UUID)` — Declines or removes a pending workspace invitation.
* `get_workspace_users(target_list_id UUID)` — Securely retrieves list owners and members along with their roles and status.