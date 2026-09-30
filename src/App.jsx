import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'

export default function App() {
  // Track the currently logged-in user session
  const [user, setUser] = useState(null)
  // Track whether the app is still checking Supabase for an existing session on startup
  const [authLoading, setAuthLoading] = useState(true)
  // Control which auth screen is currently visible ('login', 'register', or 'forgot')
  const [authView, setAuthView] = useState('login')

  // Main task state storage
  const [tasks, setTasks] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    due_date: '',
    priority: 'Low',
    tag: 'School' 
  })
  const [editingId, setEditingId] = useState(null)
  const [sortBy, setSortBy] = useState('created_at')
  const [filterTag, setFilterTag] = useState('All')

  // Check with Supabase on initial load to see if a user is already signed in
  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setAuthLoading(false)
    }

    checkUserSession()

    // Listen for any real-time changes to authentication state (sign in, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Fetch tasks only when a user is successfully logged in
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error("Error fetching tasks:", error)
      return
    }
    setTasks(data)
  }

  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user])

  // Handle task creation and updating
  const handleSubmit = async (e) => {
    e.preventDefault() 
    
    if (editingId) {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: formData.title,
          due_date: formData.due_date || null,
          priority: formData.priority,
          tag: formData.tag
        })
        .eq('id', editingId)

      if (!error) {
        setEditingId(null)
        setFormData({ title: '', due_date: '', priority: 'Low', tag: 'School' })
        fetchTasks()
      }
    } else {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          title: formData.title,
          due_date: formData.due_date || null,
          priority: formData.priority,
          tag: formData.tag,
          user_id: user.id
        }])

      if (!error) {
        setFormData({ title: '', due_date: '', priority: 'Low', tag: 'School' })
        fetchTasks() 
      }
    }
  }

  const startEdit = (task) => {
    setEditingId(task.id)
    setFormData({
      title: task.title,
      due_date: task.due_date ? task.due_date.split('T')[0] : '', 
      priority: task.priority || 'Low',
      tag: task.tag || 'School'
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ title: '', due_date: '', priority: 'Low', tag: 'School' })
  }

  const toggleDone = async (id, currentStatus) => {
    const { error } = await supabase.from('tasks').update({ is_done: !currentStatus }).eq('id', id)
    if (!error) fetchTasks()
  }

  const deleteTask = async (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (!error) fetchTasks()
    }
  }

  // Handle user sign out
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const getPriorityValue = (p) => (p === 'High' ? 3 : p === 'Medium' ? 2 : 1)

  let displayedTasks = tasks.filter(task => filterTag === 'All' || task.tag === filterTag)

  displayedTasks = [...displayedTasks].sort((a, b) => {
    if (sortBy === 'priority') {
      return getPriorityValue(b.priority) - getPriorityValue(a.priority)
    }
    if (sortBy === 'due_date') {
      if (!a.due_date) return 1 
      if (!b.due_date) return -1
      return new Date(a.due_date) - new Date(b.due_date) 
    }
    if (sortBy === 'tag') {
      return (a.tag || '').localeCompare(b.tag || '') 
    }
    return 0 
  })

  // Show a loading screen while Supabase verifies if a session is already stored in the browser
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center font-sans">
        <p className="animate-pulse text-lg font-bold">Verifying secure session...</p>
      </div>
    )
  }

  // If no user is authenticated, route them to the appropriate authentication screen
  if (!user) {
    if (authView === 'register') {
      return <Register onRegisterSuccess={(newUser) => setUser(newUser)} switchToLogin={() => setAuthView('login')} />
    }
    if (authView === 'forgot') {
      return <ForgotPassword switchToLogin={() => setAuthView('login')} />
    }
    return <Login onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} switchToRegister={() => setAuthView('register')} />
  }

  // If the user is authenticated, render the main task management workspace
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans relative overflow-hidden pb-12">
      
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] rounded-full bg-up-maroon/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[600px] h-[600px] rounded-full bg-up-green/10 blur-[120px] pointer-events-none"></div>

      <nav className="w-full bg-slate-900/50 backdrop-blur-lg border-b border-slate-800 sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-up-maroon to-red-900 flex items-center justify-center font-black text-white shadow-lg">
            ✓
          </div>
          <span className="text-xl font-black tracking-tight text-white">UPbeat Tasks</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm font-bold text-slate-300 hidden sm:block">
            Hello, <span className="text-up-green">{user.user_metadata?.display_name || user.email}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-950/40 border border-red-900/50 text-red-400 font-bold rounded-xl text-sm hover:bg-red-600 hover:text-white transition-all shadow-sm"
          >
            Log Out
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto pt-10 px-4 relative z-10">
        
        <div className="w-full bg-slate-900/60 backdrop-blur-xl p-6 sm:p-10 rounded-3xl shadow-2xl border border-slate-700/50">
          
          <form 
            onSubmit={handleSubmit} 
            className={`mb-10 space-y-5 p-6 rounded-2xl border transition-all duration-500 ease-out ${
              editingId 
                ? 'bg-slate-800/90 ring-2 ring-up-green/50 shadow-[0_0_30px_rgba(0,200,100,0.1)] scale-[1.02] relative z-20 border-up-green/30' 
                : 'bg-slate-800/40 border-slate-700 shadow-lg hover:bg-slate-800/60'
            }`}
          >
            <h2 className="text-xl font-extrabold text-slate-100 border-b-2 border-slate-700/60 pb-3 flex items-center gap-2">
              {editingId ? '✨ Modifying Data...' : '🚀 Initialize New Task'}
            </h2>
            
            <div>
              <label className="block text-sm font-bold mb-1.5 text-slate-400">Task Title *</label>
              <input 
                type="text" 
                required
                className="w-full border border-slate-700 bg-slate-950/50 text-slate-100 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-up-maroon focus:bg-slate-900 transition-all shadow-inner placeholder-slate-600" 
                placeholder="What needs to be done?"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-bold mb-1.5 text-slate-400">Target Date</label>
                <input 
                  type="date" 
                  className="w-full border border-slate-700 bg-slate-950/50 text-slate-100 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-up-maroon focus:bg-slate-900 transition-all shadow-inner [color-scheme:dark]"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-1.5 text-slate-400">Priority Level</label>
                <select 
                  className="w-full border border-slate-700 bg-slate-950/50 text-slate-100 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-up-maroon focus:bg-slate-900 transition-all shadow-inner font-semibold"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="Low">🟢 Low Impact</option>
                  <option value="Medium">🟡 Normal</option>
                  <option value="High">🔴 Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5 text-slate-400">System Tag</label>
                <select 
                  className="w-full border border-slate-700 bg-slate-950/50 text-slate-100 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-up-maroon focus:bg-slate-900 transition-all shadow-inner font-semibold"
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                >
                  <option value="School">🎓 School</option>
                  <option value="Personal">👤 Personal</option>
                  <option value="Others">📂 Others</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button 
                type="submit" 
                className={`flex-1 text-white font-black py-3.5 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-0.5 ${editingId ? 'bg-gradient-to-r from-up-green to-emerald-800 hover:shadow-emerald-500/20' : 'bg-gradient-to-r from-up-maroon to-red-950 hover:shadow-red-900/20'}`}
              >
                {editingId ? 'Commit Changes' : 'Deploy Task'}
              </button>
              
              {editingId && (
                <button 
                  type="button" 
                  onClick={cancelEdit}
                  className="flex-1 bg-slate-800 border border-slate-600 text-slate-300 font-black py-3.5 rounded-xl hover:bg-slate-700 hover:text-white transition-all duration-300 shadow-md hover:-translate-y-0.5"
                >
                  Abort
                </button>
              )}
            </div>
          </form>

          <div className={`transition-all duration-500 ${editingId ? 'opacity-20 pointer-events-none grayscale blur-[2px]' : 'opacity-100'}`}>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b-2 border-slate-700/60 pb-4 gap-4">
              <h2 className="text-2xl font-black text-slate-100">Database Records</h2>
              
              <div className="flex space-x-3 w-full sm:w-auto">
                <select 
                  value={filterTag} 
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="flex-1 sm:flex-none text-sm bg-slate-800 border border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-up-maroon font-bold text-slate-200 shadow-sm"
                >
                  <option value="All">Filter: All Tags</option>
                  <option value="School">School</option>
                  <option value="Personal">Personal</option>
                  <option value="Others">Others</option>
                </select>

                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 sm:flex-none text-sm bg-slate-800 border border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-up-maroon font-bold text-slate-200 shadow-sm"
                >
                  <option value="created_at">Sort: Recent</option>
                  <option value="priority">Sort: Priority</option>
                  <option value="due_date">Sort: Deadline</option>
                  <option value="tag">Sort: Category</option>
                </select>
              </div>
            </div>
            
            {displayedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
                <span className="text-4xl mb-3 opacity-50">📂</span>
                <p className="text-slate-400 font-bold text-lg">No records found.</p>
                <p className="text-slate-500 text-sm">Deploy a new task to populate the list.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {displayedTasks.map((task) => (
                  <li 
                    key={task.id} 
                    className={`p-5 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl border ${
                      task.is_done 
                        ? 'bg-slate-900/50 border-slate-800 opacity-60' 
                        : 'bg-slate-800/80 border-slate-700 shadow-md border-l-4 border-l-up-maroon'
                    }`}
                  >
                    
                    <div className={`flex-1 ${task.is_done ? 'line-through text-slate-500' : ''}`}>
                      <h3 className="font-extrabold text-xl text-slate-100 mb-2">{task.title}</h3>
                      <div className="text-sm flex flex-wrap gap-2">
                        {task.due_date && (
                          <span className="px-3 py-1 bg-slate-900 rounded-lg text-slate-400 font-bold flex items-center gap-1.5 border border-slate-800">
                            📅 {task.due_date.split('T')[0]}
                          </span>
                        )}
                        {task.priority && (
                          <span className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center shadow-sm border ${
                            task.priority === 'High' ? 'bg-red-950/40 border-red-900/50 text-red-400' : 
                            task.priority === 'Medium' ? 'bg-yellow-950/40 border-yellow-900/50 text-yellow-500' : 
                            'bg-slate-900 border-slate-800 text-slate-400'
                          }`}>
                            {task.priority} Priority
                          </span>
                        )}
                        {task.tag && (
                          <span className="px-3 py-1 bg-up-green/10 text-up-green rounded-lg text-xs font-black shadow-sm uppercase tracking-wider border border-up-green/20">
                            #{task.tag}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2 w-full md:w-auto mt-2 md:mt-0">
                      <button 
                        onClick={() => toggleDone(task.id, task.is_done)}
                        className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-black text-sm transition-all duration-200 shadow-sm hover:-translate-y-1 ${task.is_done ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-up-green/90 text-white hover:bg-up-green shadow-emerald-500/20 hover:shadow-lg'}`}
                      >
                        {task.is_done ? 'Revert' : 'Resolve'}
                      </button>
                      
                      <button 
                        onClick={() => startEdit(task)}
                        disabled={task.is_done}
                        className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-black text-sm transition-all duration-200 shadow-sm ${task.is_done ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' : 'bg-slate-200 text-slate-900 hover:bg-white hover:-translate-y-1 hover:shadow-lg'}`}
                      >
                        Modify
                      </button>

                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="flex-1 md:flex-none px-5 py-2.5 rounded-xl font-black text-sm bg-red-950/30 text-red-500 hover:bg-red-600 hover:text-white border border-red-900/30 hover:border-red-600 transition-all duration-200 shadow-sm hover:-translate-y-1 hover:shadow-lg"
                      >
                        Purge
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}