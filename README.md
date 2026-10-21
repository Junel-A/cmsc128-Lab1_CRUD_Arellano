# ISKedyuler

A secure, high-performance, and aesthetic task management web application built for CMSC 128. It features user-exclusive data isolation, persistent authentication, live schedule tracking, and a modern, high-contrast light-mode UI inspired by premium SaaS platforms.

---

## Key Features

1. **Secure Authentication Flow & Persistence:** User registration, login, password recovery, and password reset handling powered by Supabase Auth (JWT session management)[cite: 16]. Accounts, sessions, and tasks persist seamlessly across browser refreshes and restarts[cite: 17].
2. **Account Profile Management:** Users can securely update their display name, email, and password, complete with a 3-step old-password verification process for security.
3. **User-Based Access Control (UBAC):** A logged-in user can exclusively view, create, update, and delete their own tasks and workspaces[cite: 16]. 
4. **Collaborative Workspaces:** Users can switch between Personal and Collaborative to-do lists. List owners can invite team members using their unique UUID[cite: 18]. Users can only see collaborative lists they explicitly own or have been added to[cite: 18].
5. **Interactive Tasks Engine:** Real-time CRUD operations, priority tagging, category filters, sorting options, and completion toggles.
6. **Modern HCI Aesthetics:** Custom modals replace native browser alerts, integrated with glassmorphism components, interactive hover states, and smooth grid transitions.

---

## Database Schema & Relational Structure

To ensure normalized data and strict separation between user accounts and their tasks[cite: 16, 18], the application relies on the following relational PostgreSQL schema:

* **`auth.users` (Supabase Native):** Handles identity, authentication, and secure session management.
* **`lists` (Workspaces):** 
  * Fields: `id` (UUID, Primary Key), `title` (Text), `owner_id` (UUID, Foreign Key to `auth.users`), `is_collaborative` (Boolean).
  * Purpose: Defines the parent container for tasks, assigning strict ownership to the creator.
* **`tasks`:** 
  * Fields: `id` (UUID), `title` (Text), `due_date` (Date), `priority` (Text), `tag` (Text), `is_done` (Boolean), `list_id` (UUID, Foreign Key to `lists(id)` with `ON DELETE CASCADE`).
  * Purpose: Stores individual to-do items. By referencing `list_id`, tasks inherit the security policies of their parent workspace.
* **`list_members` (Collaborators):**
  * Fields: `list_id` (UUID, Foreign Key), `user_id` (UUID, Foreign Key).
  * Purpose: A junction table that resolves the many-to-many relationship for shared collaborative lists, granting read/write access to invited members.

---

## Security & Ownership Checks (Backend)

We do not rely solely on client-side UI hiding[cite: 16, 18]. Security and IDOR prevention are strictly enforced at the database level using PostgreSQL Row-Level Security (RLS)[cite: 18]. Every database query automatically filters against the logged-in user's `auth.uid()`[cite: 18].

**Example RLS Policy (Tasks Table Read/Write Authorization):**
Instead of a traditional API endpoint checking ownership, Supabase intercepts the request and applies this policy before executing any operation:

```sql
CREATE POLICY "Users can manage tasks in accessible lists"
ON tasks FOR ALL
USING (
  list_id IN (SELECT id FROM lists WHERE owner_id = auth.uid())
  OR 
  list_id IN (SELECT list_id FROM list_members WHERE user_id = auth.uid())
);

# Branch & Merge Strategy (Act 1 + Act 2)
To combine the initial frontend UI from Activity 1 with the authentication backend from Activity 2, the following integration strategy was executed:
1. Branching: Checked out a new feature branch (act3-ubac) from the main repository to safely combine both codebases.
2. Component Integration: The standalone task CRUD components from Act 1 were refactored into the primary App.jsx router, which was originally built in Act 2 to handle Login, Register, and session state.
3. Conflict Resolution: Merge conflicts occurred primarily around local state management. Act 1 relied on unprotected frontend state arrays. This was resolved by stripping the local storage logic and replacing it with asynchronous supabase.from().select() calls that only execute if user (from Act 2s session) is authenticated.
4. Data Binding: Task insertions were updated to attach the active list_id, dynamically bridging Act 1's UI with Act 2's user identities.

# Tech Stack
*Frontend: React.js (Vite), Tailwind CSS
*Backend & Database: Supabase, PostgreSQL
*Security: JWT Authentication, Row-Level Security (RLS)

# Installation & Local Run Instructions

Clone the repository:
```
git clone [https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git](https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git)
cd YOUR_REPOSITORY
git checkout act2-accounts
```

Install dependencies:
`npm install`

Configure Environment Variables:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the development server:
`npm run dev`

Open http://localhost:5173 in your browser.

Author: Junel Arellano (BS Computer Science, University of the Philippines Visayas)