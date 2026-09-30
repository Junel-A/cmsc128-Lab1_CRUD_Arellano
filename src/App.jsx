import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import UpdatePassword from './pages/UpdatePassword'
import ProfileView from './components/ProfileView'

export default function App() {
  // Store the active user session object when someone logs in
  const [user, setUser] = useState(null)
  // Track whether the application is still checking storage for an existing session
  const [authLoading, setAuthLoading] = useState(true)
  // Control which authentication screen is currently displayed on the screen
  const [authView, setAuthView] = useState('login')
  // Track whether the app is in password recovery mode
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)
  // Control whether the sliding schedule calendar drawer is open or closed
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  // Control whether the app displays 'profile' or 'tasks' after login (defaults to profile)
  const [currentView, setCurrentView] = useState('profile')

  // Hold the list of tasks fetched from the database
  const [tasks, setTasks] = useState([])
  // Hold whatever values the user types into the task input form
  const [formData, setFormData] = useState({
    title: '',
    due_date: '',
    priority: 'Low',
    tag: 'School' 
  })
  // Track the unique identifier of a task if the user clicks edit
  const [editingId, setEditingId] = useState(null)
  // Store the current sorting parameter chosen by the user from the dropdown
  const [sortBy, setSortBy] = useState('created_at')
  // Store the current category filter selected by the user
  const [filterTag, setFilterTag] = useState('All')
  // Track the task object currently pending deletion for the custom confirmation modal
  const [taskToDelete, setTaskToDelete] = useState(null)

  // Track the currently viewed month and year in the schedule calendar widget
  const [calendarDate, setCalendarDate] = useState(new Date())

  // Check Supabase immediately on startup to see if a valid session already exists in browser storage
  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setAuthLoading(false)
    }

    checkUserSession()

    // Listen continuously for any login or logout events triggered anywhere in the application
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true)
      }
      setUser(session?.user || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Talk to the database and pull all task records ordered by creation date
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

  // Automatically trigger a task fetch the moment a valid user session is detected
  useEffect(() => {
    const loadUserTasks = async () => {
      if (user && !isPasswordRecovery) {
        await fetchTasks()
      }
    }
    loadUserTasks()
  }, [user, isPasswordRecovery])

  // Handle saving form data either as a new database insertion or an existing record update
  const handleSubmit = async (e) => {
    // Prevent the default browser reload action
    e.preventDefault() 
    
    // If an editing identifier exists, perform an update operation on that specific row
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
      // If no editing identifier exists, insert a brand new task row linked to the logged-in user
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

  // Copy existing task attributes into the form state so the user can modify them
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

  // Reset the form state and clear out the editing identifier if the user cancels
  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ title: '', due_date: '', priority: 'Low', tag: 'School' })
  }

  // Flip the completion status of a task row in the database
  const toggleDone = async (id, currentStatus) => {
    const { error } = await supabase.from('tasks').update({ is_done: !currentStatus }).eq('id', id)
    if (!error) fetchTasks()
  }

  // Open the custom styled confirmation modal before deleting a task
  const confirmDelete = (task) => {
    setTaskToDelete(task)
  }

  // Execute the permanent deletion of the task after user confirmation in the custom modal
  const executeDelete = async () => {
    if (!taskToDelete) return
    const { error } = await supabase.from('tasks').delete().eq('id', taskToDelete.id)
    if (!error) {
      setTaskToDelete(null)
      fetchTasks()
    }
  }

  // Terminate the active user session and clear out local session data
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsPasswordRecovery(false)
  }

  // Convert text priorities into numeric values so the sorting logic can rank them properly
  const getPriorityValue = (p) => (p === 'High' ? 3 : p === 'Medium' ? 2 : 1)

  // Filter tasks based on whatever category tag is currently selected in the dropdown
  let displayedTasks = tasks.filter(task => filterTag === 'All' || task.tag === filterTag)

  // Sort the filtered task list based on the chosen sorting option
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

  // Calendar calculations for the sliding schedule widget
  const year = calendarDate.getFullYear()
  const month = calendarDate.getMonth()
  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ]
  const firstDayIndex = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1))

  // Show a temporary loading message while checking browser storage for an existing session
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center font-sans">
        <p className="animate-pulse text-lg font-bold">Verifying secure session...</p>
      </div>
    )
  }

  // If the user clicked a password recovery link, render the update password screen
  if (isPasswordRecovery) {
    return (
      <UpdatePassword 
        onUpdateSuccess={() => {
          alert("Password updated successfully! Please sign in with your new password.")
          supabase.auth.signOut()
          setIsPasswordRecovery(false)
          setAuthView('login')
        }} 
      />
    )
  }

  if (!user) {
    if (authView === 'register') {
      return <Register onRegisterSuccess={(newUser) => { setUser(newUser); setCurrentView('profile'); }} switchToLogin={() => setAuthView('login')} />
    }
    if (authView === 'forgot') {
      return <ForgotPassword switchToLogin={() => setAuthView('login')} />
    }
    return (
      <Login 
        onLoginSuccess={(loggedInUser) => { setUser(loggedInUser); setCurrentView('profile'); }} 
        switchToRegister={() => setAuthView('register')} 
        switchToForgot={() => setAuthView('forgot')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans relative overflow-hidden pb-12">
      
      {/* Background glowing effects to make the layout feel more dynamic */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] rounded-full bg-up-maroon/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[600px] h-[600px] rounded-full bg-up-green/10 blur-[120px] pointer-events-none"></div>

      {/* Click-Triggered Right Schedule Calendar Drawer */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-slate-900/95 backdrop-blur-2xl border-l border-slate-700/80 p-6 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] z-50 transform transition-transform duration-300 ease-out flex flex-col overflow-y-auto ${isCalendarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-white">📅 Schedule Calendar</h2>
            <p className="text-slate-400 text-xs mt-0.5">Live deadlines and schedules</p>
          </div>
          <button 
            onClick={() => setIsCalendarOpen(false)}
            className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 font-bold hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex justify-between items-center mb-4 bg-slate-950/50 p-2.5 rounded-2xl border border-slate-800">
          <button 
            onClick={prevMonth}
            className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-700 transition-all"
          >
            ← Prev
          </button>
          <span className="text-sm font-extrabold text-white">
            {monthNames[month]} {year}
          </span>
          <button 
            onClick={nextMonth}
            className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-700 transition-all"
          >
            Next →
          </button>
        </div>

        {/* Days of the Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 flex-1 pb-6">
          {Array.from({ length: firstDayIndex }).map((_, index) => (
            <div key={`empty-${index}`} className="h-20 bg-slate-950/20 rounded-xl border border-transparent opacity-30"></div>
          ))}

          {Array.from({ length: totalDays }).map((_, index) => {
            const dayNumber = index + 1
            const formattedMonth = String(month + 1).padStart(2, '0')
            const formattedDay = String(dayNumber).padStart(2, '0')
            const dateString = `${year}-${formattedMonth}-${formattedDay}`

            const dayTasks = tasks.filter(task => task.due_date && task.due_date.startsWith(dateString))

            return (
              <div 
                key={dayNumber} 
                className="h-20 bg-slate-950/60 border border-slate-800/80 rounded-xl p-1.5 flex flex-col overflow-y-auto hover:border-slate-700 transition-all"
              >
                <span className="text-[10px] font-bold text-slate-400 mb-1">{dayNumber}</span>
                <div className="space-y-1">
                  {dayTasks.map(task => (
                    <div 
                      key={task.id}
                      className={`text-[9px] font-bold px-1 py-0.5 rounded truncate shadow-sm border ${
                        task.is_done ? 'bg-slate-900 text-slate-500 line-through border-slate-800' :
                        task.priority === 'High' ? 'bg-red-950/60 text-red-400 border-red-900/50' :
                        task.priority === 'Medium' ? 'bg-yellow-950/60 text-yellow-400 border-yellow-900/50' :
                        'bg-up-green/10 text-up-green border-up-green/20'
                      }`}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Custom styled confirmation modal overlay for task deletion */}
      {taskToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 p-6 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-900/50 flex items-center justify-center font-black text-red-400 text-xl mx-auto shadow-lg mb-4">
              ⚠
            </div>
            <h3 className="text-xl font-black text-white text-center mb-2">Delete Task Confirmation</h3>
            <p className="text-slate-400 text-sm text-center mb-6">
              Are you sure you want to delete <span className="text-slate-200 font-bold">"{taskToDelete.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setTaskToDelete(null)}
                className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 font-black py-3 rounded-xl hover:bg-slate-700 hover:text-white transition-all shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                className="flex-1 bg-gradient-to-r from-red-900 to-red-950 text-white font-black py-3 rounded-xl shadow-lg hover:shadow-red-900/30 transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Navigation Bar with View Switcher buttons */}
      <nav className="w-full bg-slate-900/50 backdrop-blur-lg border-b border-slate-800 sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-up-maroon to-red-900 flex items-center justify-center font-black text-white shadow-lg">
          </div>
          <span className="text-xl font-black tracking-tight text-white">task ISKedyuler</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentView('profile')}
            className={`px-4 py-2 border rounded-xl text-sm font-bold transition-all shadow-sm ${currentView === 'profile' ? 'bg-up-green text-white border-up-green' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
          >
            ⚙️ Profile
          </button>

          <button 
            onClick={() => setCurrentView('tasks')}
            className={`px-4 py-2 border rounded-xl text-sm font-bold transition-all shadow-sm ${currentView === 'tasks' ? 'bg-up-green text-white border-up-green' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
          >
            📋 Tasks Workspace
          </button>

          <button 
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className="px-4 py-2 bg-up-maroon/40 border border-up-maroon text-slate-200 font-bold rounded-xl text-sm hover:bg-up-maroon hover:text-white transition-all shadow-sm flex items-center gap-1.5"
          >
            📅 Schedule
          </button>

          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-950/40 border border-red-900/50 text-red-400 font-bold rounded-xl text-sm hover:bg-red-600 hover:text-white transition-all shadow-sm"
          >
            Log Out
          </button>
        </div>
      </nav>

      {/* Conditional Rendering based on whether user is viewing Profile or Tasks */}
      {currentView === 'profile' ? (
        <ProfileView 
          user={user} 
          onUserUpdated={(updatedUser) => setUser(updatedUser)} 
          goToTasks={() => setCurrentView('tasks')} 
        />
      ) : (
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
                {editingId ? 'Edit Task' : 'Add a New Task'}
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
                  <label className="block text-sm font-bold mb-1.5 text-slate-400">Due Date</label>
                  <input 
                    type="date" 
                    className="w-full border border-slate-700 bg-slate-950/50 text-slate-100 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-up-maroon focus:bg-slate-900 transition-all shadow-inner [color-scheme:dark]"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-slate-400">Priority</label>
                  <select 
                    className="w-full border border-slate-700 bg-slate-950/50 text-slate-100 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-up-maroon focus:bg-slate-900 transition-all shadow-inner font-semibold"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1.5 text-slate-400">Category Tag</label>
                  <select 
                    className="w-full border border-slate-700 bg-slate-950/50 text-slate-100 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-up-maroon focus:bg-slate-900 transition-all shadow-inner font-semibold"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  >
                    <option value="School">School</option>
                    <option value="Personal">Personal</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button 
                  type="submit" 
                  className={`flex-1 text-white font-black py-3.5 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-0.5 ${editingId ? 'bg-gradient-to-r from-up-green to-emerald-800 hover:shadow-emerald-500/20' : 'bg-gradient-to-r from-up-maroon to-red-950 hover:shadow-red-900/20'}`}
                >
                  {editingId ? 'Update Task' : 'Add Task'}
                </button>
                
                {editingId && (
                  <button 
                    type="button" 
                    onClick={cancelEdit}
                    className="flex-1 bg-slate-800 border border-slate-600 text-slate-300 font-black py-3.5 rounded-xl hover:bg-slate-700 hover:text-white transition-all duration-300 shadow-md hover:-translate-y-0.5"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className={`transition-all duration-500 ${editingId ? 'opacity-20 pointer-events-none grayscale blur-[2px]' : 'opacity-100'}`}>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b-2 border-slate-700/60 pb-4 gap-4">
                <h2 className="text-2xl font-black text-slate-100">Current Tasks</h2>
                
                <div className="flex space-x-3 w-full sm:w-auto">
                  <select 
                    value={filterTag} 
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="flex-1 sm:flex-none text-sm bg-slate-800 border border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-up-maroon font-bold text-slate-200 shadow-sm"
                  >
                    <option value="All">Filter: All</option>
                    <option value="School">School</option>
                    <option value="Personal">Personal</option>
                    <option value="Others">Others</option>
                  </select>

                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 sm:flex-none text-sm bg-slate-800 border border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-up-maroon font-bold text-slate-200 shadow-sm"
                  >
                    <option value="created_at">Sort: Newest First</option>
                    <option value="priority">Sort: Priority</option>
                    <option value="due_date">Sort: Due Date</option>
                    <option value="tag">Sort: Category</option>
                  </select>
                </div>
              </div>
              
              {displayedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
                  <span className="text-4xl mb-3 opacity-50">🍃</span>
                  <p className="text-slate-400 font-bold text-lg">No tasks found.</p>
                  <p className="text-slate-500 text-sm">Add a new task above to get started.</p>
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
                          {task.is_done ? 'Undo' : 'Done'}
                        </button>
                        
                        <button 
                          onClick={() => startEdit(task)}
                          disabled={task.is_done}
                          className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-black text-sm transition-all duration-200 shadow-sm ${task.is_done ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' : 'bg-slate-200 text-slate-900 hover:bg-white hover:-translate-y-1 hover:shadow-lg'}`}
                        >
                          Edit
                        </button>

                        <button 
                          onClick={() => confirmDelete(task)}
                          className="flex-1 md:flex-none px-5 py-2.5 rounded-xl font-black text-sm bg-red-950/30 text-red-500 hover:bg-red-600 hover:text-white border border-red-900/30 hover:border-red-600 transition-all duration-200 shadow-sm hover:-translate-y-1 hover:shadow-lg"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}