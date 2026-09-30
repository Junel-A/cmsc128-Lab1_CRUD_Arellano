# UP Task Manager (CMSC 128 Lab 2: Authentication and User Access)
**Author:** Junel Arellano

## Application Description & Implemented Features
This project is an advanced task management web application built for CMSC 128[cite: 6]. Building upon the core CRUD operations from Activity 1, Activity 2 introduces a robust user account management and security layer[cite: 6].

**Implemented Features:**
* **Account Registration:** Allows new users to sign up using an email address, password, and custom display name, complete with uniqueness validation and secure server-side processing.
* **Account Login & Session Persistence:** Users can securely sign in using their credentials[cite: 9]. Sessions persist across browser refreshes and page navigation using Supabase's secure JWT session storage.
* **Protected Routes:** The main Task Manager workspace is strictly guarded; unauthenticated users are automatically routed to authentication views[cite: 12].
* **Password Recovery via Email:** Users can request recovery instructions through their registered email address to securely reset forgotten credentials[cite: 11].
* **Secure Logout:** Invalidates the active session and locks the application view back to public access.

## Chosen Frontend, Backend, Database, and Authentication Approach
* **Frontend:** React (bootstrapped with Vite) utilizing modular components and pages (`Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`).
* **Styling:** Tailwind CSS styled with a custom dark-mode aesthetic, glassmorphism, and UP-inspired Maroon and Green branding.
* **Database:** Supabase (PostgreSQL) storing tasks and utilizing Supabase Auth schema tables for user records[cite: 6].
* **Authentication Mechanism:** Supabase Auth manages secure password hashing (utilizing industry-standard bcrypt hashing under the hood) and token-based session handling, eliminating plaintext password risks[cite: 9, 11].

## Installation and Local Run Instructions
1. Clone the repository to your local machine:
   `git clone <repository-url>`
2. Switch to the required assignment branch:
   `git checkout act2-accounts`
3. Navigate into the project directory:
   `cd cmsc128-Lab1_CRUD_Arellano`
4. Install the required Node dependencies:
   `npm install`
5. **Environment Variables:** Create a `.env.local` file in the root directory and add your Supabase credentials to securely connect to the database (this file is excluded from Git via `.gitignore`)[cite: 11]:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key