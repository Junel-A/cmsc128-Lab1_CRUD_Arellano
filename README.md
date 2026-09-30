# task ISKedyuler

A secure, high-performance, and aesthetic task management web application built for **CMSC 128**. Features user-exclusive data isolation, persistent authentication, live schedule tracking, and a custom dark-mode glassmorphism UI styled with UP Maroon and Green branding.

---

## Key Features

1. **Secure Authentication Flow**: 
   - User registration, login, password recovery, and password reset handling powered by Supabase Auth (JWT session management).
2. **Account Profile & Credentials Management**:
   - Dedicated landing page greeting users upon login (`"Hello, [Name]!"`).
   - Allows users to securely update their display name, email (with unique validation), and password, persisting instantly to the backend database.
3. **Exclusive User Data Isolation (Row Level Security)**:
   - Database security policies (RLS) configured via PostgreSQL to ensure users can only view, create, update, or delete their own task records. No task sharing or cross-account data leaks.
4. **Interactive Tasks Workspace**:
   - Real-time CRUD operations, priority tagging (Low, Medium, High), category filters (School, Personal, Others), sorting options, and completion toggles.
5. **Live Schedule Calendar Drawer**:
   - Smooth slide-out calendar drawer displaying task deadlines automatically across the month.
6. **Custom Glassmorphism UI**:
   - Modern dark-mode styling with custom modals, replacing native browser alerts and dialogs.

---

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS
- **Backend & Database**: Supabase (PostgreSQL with Row Level Security)
- **Version Control**: Git & GitHub (`act2-accounts` branch)

---

## Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone [https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git](https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git)
   cd YOUR_REPOSITORY
   git checkout act2-accounts

Install dependencies:
`npm install`

Configure Environment Variables:
Create a .env file in the root directory and add your Supabase project credentials:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the development server:
`npm run dev`

Database Schema & Security Setup (Supabase)
Ensure your Supabase project has the tasks table configured with a user_id column referencing auth.users(id), and enable Row Level Security (RLS) with the following SQL policies:

```
-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);
```

Author:
Junel Arellano (BS Computer Science, University of the Philippines Visayas)