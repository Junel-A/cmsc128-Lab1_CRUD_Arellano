import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import UpdatePassword from './pages/UpdatePassword'
import ProfileView from './components/ProfileView'

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authView, setAuthView] = useState('login')
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [currentView, setCurrentView] = useState('profile')

  const [customAlert, setCustomAlert] = useState(null)

  const [lists, setLists] = useState([])
  const [activeListId, setActiveListId] = useState(null)
  const [showNewListModal, setShowNewListModal] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [isCollaborative, setIsCollaborative] = useState(false)
  
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [collaboratorUserId, setCollaboratorUserId] = useState('')
  const [memberFeedback, setMemberFeedback] = useState({ type: '', message: '' })
  
  const [copied, setCopied] = useState(false)
  const [listToDelete, setListToDelete] = useState(null)
  
  const [listToRename, setListToRename] = useState(null)
  const [renameListTitle, setRenameListTitle] = useState('')

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
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [calendarDate, setCalendarDate] = useState(new Date())

  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setAuthLoading(false)
    }

    checkUserSession()

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

  useEffect(() => {
    const loadLists = async () => {
      if (!user || isPasswordRecovery) return

      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error("Error fetching lists:", error)
        return
      }

      if (data && data.length > 0) {
        setLists(data)
        setActiveListId(prev => prev && data.some(l => l.id === prev) ? prev : data[0].id)
      } else {
        const { data: newList, error: createError } = await supabase
          .from('lists')
          .insert([{ title: 'My Personal List', owner_id: user.id, is_collaborative: false }])
          .select()
        
        if (!createError && newList) {
          setLists(newList)
          setActiveListId(newList[0].id)
        }
      }
    }

    loadLists()
  }, [user, isPasswordRecovery])

  useEffect(() => {
    const loadTasks = async () => {
      if (!activeListId) return

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('list_id', activeListId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error("Error fetching tasks:", error)
        return
      }
      setTasks(data || [])
    }

    loadTasks()
  }, [activeListId])

  const handleSubmit = async (e) => {
    e.preventDefault() 
    if (!activeListId) {
      setCustomAlert({
        title: "Workspace Required",
        message: "Please select or create a space first before adding a task.",
        type: "warning"
      })
      return
    }
    
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
        const { data } = await supabase.from('tasks').select('*').eq('list_id', activeListId).order('created_at', { ascending: false })
        setTasks(data || [])
      }
    } else {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          title: formData.title,
          due_date: formData.due_date || null,
          priority: formData.priority,
          tag: formData.tag,
          list_id: activeListId
        }])

      if (!error) {
        setFormData({ title: '', due_date: '', priority: 'Low', tag: 'School' })
        const { data } = await supabase.from('tasks').select('*').eq('list_id', activeListId).order('created_at', { ascending: false })
        setTasks(data || [])
      }
    }
  }

  const handleCreateList = async (e) => {
    e.preventDefault()
    if (!newListName.trim()) return

    const { data, error } = await supabase
      .from('lists')
      .insert([{
        title: newListName.trim(),
        owner_id: user.id,
        is_collaborative: isCollaborative
      }])
      .select()

    if (error) {
      setCustomAlert({ title: "Creation Failed", message: error.message, type: "error" })
    } else if (data && data.length > 0) {
      setNewListName('')
      setIsCollaborative(false)
      setShowNewListModal(false)
      
      const { data: updatedLists } = await supabase.from('lists').select('*').order('created_at', { ascending: true })
      if (updatedLists) setLists(updatedLists)
      setActiveListId(data[0].id)
    }
  }

  const openRenameModal = (list) => {
    setListToRename(list)
    setRenameListTitle(list.title)
  }

  const executeRenameList = async (e) => {
    e.preventDefault()
    if (!listToRename || !renameListTitle.trim()) return

    const { error } = await supabase
      .from('lists')
      .update({ title: renameListTitle.trim() })
      .eq('id', listToRename.id)

    if (error) {
      setCustomAlert({ title: "Rename Failed", message: error.message, type: "error" })
    } else {
      setListToRename(null)
      const { data: updatedLists } = await supabase.from('lists').select('*').order('created_at', { ascending: true })
      setLists(updatedLists || [])
      setCustomAlert({ title: "Success", message: "Workspace renamed successfully.", type: "success" })
    }
  }

  const confirmDeleteList = (list) => {
    setListToDelete(list)
  }

  const executeDeleteList = async () => {
    if (!listToDelete) return
    const { error } = await supabase.from('lists').delete().eq('id', listToDelete.id)
    if (!error) {
      setListToDelete(null)
      const { data: updatedLists } = await supabase.from('lists').select('*').order('created_at', { ascending: true })
      setLists(updatedLists || [])
      if (updatedLists && updatedLists.length > 0) {
        setActiveListId(updatedLists[0].id)
      } else {
        setActiveListId(null)
        setTasks([])
      }
    } else {
      setCustomAlert({ title: "Deletion Failed", message: error.message, type: "error" })
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    setMemberFeedback({ type: '', message: '' })

    if (!collaboratorUserId.trim()) return

    const { error } = await supabase
      .from('list_members')
      .insert([{
        list_id: activeListId,
        user_id: collaboratorUserId.trim()
      }])

    if (error) {
      setMemberFeedback({ type: 'error', message: error.message })
    } else {
      setMemberFeedback({ type: 'success', message: 'Collaborator added successfully!' })
      setCollaboratorUserId('')
    }
  }

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
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
    if (!error) {
      const { data } = await supabase.from('tasks').select('*').eq('list_id', activeListId).order('created_at', { ascending: false })
      setTasks(data || [])
    }
  }

  const confirmDeleteTask = (task) => {
    setTaskToDelete(task)
  }

  const executeDeleteTask = async () => {
    if (!taskToDelete) return
    const { error } = await supabase.from('tasks').delete().eq('id', taskToDelete.id)
    if (!error) {
      setTaskToDelete(null)
      const { data } = await supabase.from('tasks').select('*').eq('list_id', activeListId).order('created_at', { ascending: false })
      setTasks(data || [])
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsPasswordRecovery(false)
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

  const renderCustomAlert = () => {
    if (!customAlert) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all duration-300">
        <div className="w-full max-w-sm bg-white border border-slate-100 p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl mx-auto mb-5 shadow-sm ${
            customAlert.type === 'error' ? 'bg-red-50 text-red-500' :
            customAlert.type === 'success' ? 'bg-emerald-50 text-emerald-500' :
            'bg-amber-50 text-amber-500'
          }`}>
            {customAlert.type === 'error' ? '✖' : customAlert.type === 'success' ? '✓' : '⚠'}
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 text-center mb-2 tracking-tight">{customAlert.title}</h3>
          <p className="text-slate-500 text-sm text-center mb-8 leading-relaxed">
            {customAlert.message}
          </p>
          <button
            onClick={() => setCustomAlert(null)}
            className="w-full font-bold py-3.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 transition-all active:scale-[0.98]"
          >
            Acknowledge
          </button>
        </div>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
          <p className="text-slate-500 font-semibold tracking-wide animate-pulse">Loading Workspace...</p>
        </div>
      </div>
    )
  }

  if (isPasswordRecovery) {
    return (
      <>
        {renderCustomAlert()}
        <UpdatePassword 
          onUpdateSuccess={() => {
            setCustomAlert({
              title: "Password Updated",
              message: "Your password was updated successfully! Please sign in with your new password.",
              type: "success"
            })
            supabase.auth.signOut()
            setIsPasswordRecovery(false)
            setAuthView('login')
          }} 
        />
      </>
    )
  }

  if (!user) {
    return (
      <>
        {renderCustomAlert()}
        {authView === 'register' && <Register onRegisterSuccess={(newUser) => { setUser(newUser); setCurrentView('profile'); }} switchToLogin={() => setAuthView('login')} />}
        {authView === 'forgot' && <ForgotPassword switchToLogin={() => setAuthView('login')} />}
        {authView === 'login' && <Login 
          onLoginSuccess={(loggedInUser) => { setUser(loggedInUser); setCurrentView('profile'); }} 
          switchToRegister={() => setAuthView('register')} 
          switchToForgot={() => setAuthView('forgot')}
        />}
      </>
    )
  }

  const activeList = lists.find(l => l.id === activeListId)

  return (
    <div className="min-h-screen font-sans relative overflow-x-hidden pb-20 selection:bg-blue-100 selection:text-blue-900 text-slate-900 bg-slate-100 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:24px_24px]">
      {renderCustomAlert()}

      {/* Floating Modern Navbar */}
      <div className="pt-6 px-4 md:px-8 max-w-7xl mx-auto sticky top-0 z-30">
        <nav className="w-full bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl px-6 py-4 flex flex-col md:flex-row justify-between items-center shadow-sm gap-4 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white shadow-lg shadow-blue-600/20">
              📝
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 leading-tight">
                ISKedyuler
              </span>
              <div className="flex items-center gap-2 mt-0.5 group cursor-pointer" onClick={handleCopyId}>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID:</span>
                <code className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 group-hover:border-blue-300 transition-colors">
                  {user.id.substring(0, 8)}...
                </code>
                <span className={`text-[10px] font-extrabold transition-all ${copied ? 'text-emerald-500' : 'text-blue-600 opacity-0 group-hover:opacity-100'}`}>
                  {copied ? '✓ COPIED' : 'COPY'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-2">
            <button 
              onClick={() => setCurrentView('profile')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${currentView === 'profile' ? 'bg-slate-100 text-slate-900' : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              Profile
            </button>
            <button 
              onClick={() => setCurrentView('tasks')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${currentView === 'tasks' ? 'bg-slate-100 text-slate-900' : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              Workspace
            </button>
            <button 
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              Schedule
            </button>
            <div className="w-px h-5 bg-slate-200 mx-2"></div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              Log Out
            </button>
          </div>
        </nav>
      </div>

      {/* Modern Schedule Widget */}
      <div className={`fixed top-4 bottom-4 right-4 w-96 bg-white/90 backdrop-blur-3xl border border-slate-200 shadow-2xl rounded-3xl z-40 transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col overflow-y-auto ${isCalendarOpen ? 'translate-x-0' : 'translate-x-[120%]'}`}>
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-5 p-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Schedule</h2>
            <p className="text-slate-500 text-xs mt-1 font-medium">Timeline Overview</p>
          </div>
          <button 
            onClick={() => setIsCalendarOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 hover:text-slate-800 transition-all flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="px-6 pb-6 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button 
              onClick={prevMonth}
              className="px-3 py-1.5 text-slate-600 font-bold rounded-xl text-xs hover:bg-white hover:shadow-sm transition-all"
            >
              ← Prev
            </button>
            <span className="text-sm font-extrabold text-slate-800">
              {monthNames[month]} {year}
            </span>
            <button 
              onClick={nextMonth}
              className="px-3 py-1.5 text-slate-600 font-bold rounded-xl text-xs hover:bg-white hover:shadow-sm transition-all"
            >
              Next →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-3">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5 flex-1">
            {Array.from({ length: firstDayIndex }).map((_, index) => (
              <div key={`empty-${index}`} className="h-20 bg-slate-50/50 rounded-xl border border-dashed border-slate-200"></div>
            ))}

            {Array.from({ length: totalDays }).map((_, index) => {
              const dayNumber = index + 1
              const formattedMonth = String(month + 1).padStart(2, '0')
              const formattedDay = String(dayNumber).padStart(2, '0')
              const dateString = `${year}-${formattedMonth}-${formattedDay}`

              const dayTasks = tasks.filter(task => task.due_date && task.due_date.startsWith(dateString))
              const isToday = new Date().toISOString().split('T')[0] === dateString

              return (
                <div 
                  key={dayNumber} 
                  className={`h-20 rounded-xl p-1.5 flex flex-col overflow-y-auto transition-all bg-white border ${
                    isToday ? 'border-blue-300 ring-2 ring-blue-100 bg-blue-50/30 shadow-sm' : 'border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <span className={`text-[10px] font-extrabold mb-1 ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>{dayNumber}</span>
                  <div className="space-y-1">
                    {dayTasks.map(task => (
                      <div 
                        key={task.id}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate border ${
                          task.is_done ? 'bg-slate-50 text-slate-400 line-through border-transparent' :
                          task.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                          task.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-blue-50 text-blue-600 border-blue-100'
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
      </div>

      {/* Reusable Clean Modal Template */}
      {showNewListModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div className="w-full max-w-md bg-white border border-slate-100 p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-extrabold text-slate-900 mb-6 tracking-tight">New Space</h3>
            <form onSubmit={handleCreateList} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Space Title</label>
                <input 
                  type="text"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                  placeholder="e.g., Marketing Campaign"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <input 
                  type="checkbox"
                  id="collabCheck"
                  checked={isCollaborative}
                  onChange={(e) => setIsCollaborative(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="collabCheck" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                  Shared Space
                  <span className="block text-xs font-medium text-slate-500 mt-0.5">Enable multi-user collaboration.</span>
                </label>
              </div>
              <div className="flex gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setShowNewListModal(false)}
                  className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-3.5 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {listToRename && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-100 p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-extrabold text-slate-900 mb-6 tracking-tight">Rename Space</h3>
            <form onSubmit={executeRenameList} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">New Title</label>
                <input 
                  type="text"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                  value={renameListTitle}
                  onChange={(e) => setRenameListTitle(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setListToRename(null)}
                  className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-3.5 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-100 p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Invite Team</h3>
              <button onClick={() => setShowMemberModal(false)} className="text-slate-400 hover:text-slate-800 font-bold transition-colors">✕</button>
            </div>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Add users to <span className="font-bold text-slate-800">{activeList?.title}</span> via UUID.
            </p>
            {memberFeedback.message && (
              <div className={`mb-5 p-3.5 rounded-xl text-sm font-bold border flex items-center gap-2 ${
                memberFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {memberFeedback.type === 'success' ? '✓' : '⚠'} {memberFeedback.message}
              </div>
            )}
            <form onSubmit={handleAddMember} className="space-y-5">
              <div>
                <input 
                  type="text"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-mono"
                  placeholder="Paste UUID here..."
                  value={collaboratorUserId}
                  onChange={(e) => setCollaboratorUserId(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 shadow-md hover:shadow-lg transition-all"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {listToDelete && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-slate-100 p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-extrabold text-slate-900 text-center mb-2 tracking-tight">Delete Space</h3>
            <p className="text-slate-500 text-sm text-center mb-8 leading-relaxed">
              Permanently delete <span className="text-slate-800 font-bold">"{listToDelete.title}"</span> and all its tasks?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setListToDelete(null)}
                className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={executeDeleteList}
                className="flex-1 bg-red-500 text-white font-bold py-3.5 rounded-xl hover:bg-red-600 shadow-md hover:shadow-lg hover:shadow-red-500/20 transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {taskToDelete && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-slate-100 p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-extrabold text-slate-900 text-center mb-2 tracking-tight">Delete Task</h3>
            <p className="text-slate-500 text-sm text-center mb-8 leading-relaxed">
              Remove <span className="text-slate-800 font-bold">"{taskToDelete.title}"</span>?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setTaskToDelete(null)}
                className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={executeDeleteTask}
                className="flex-1 bg-red-500 text-white font-bold py-3.5 rounded-xl hover:bg-red-600 shadow-md hover:shadow-lg hover:shadow-red-500/20 transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {currentView === 'profile' ? (
        <div className="pt-12">
          <ProfileView 
            user={user} 
            onUserUpdated={(updatedUser) => setUser(updatedUser)} 
            goToTasks={() => setCurrentView('tasks')} 
          />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto pt-10 px-4 md:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
          
          {/* Left Sidebar for Spaces */}
          <div className="w-full flex flex-col gap-4 sticky top-32">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Your Spaces</span>
              <button
                onClick={() => setShowNewListModal(true)}
                className="w-8 h-8 rounded-full bg-white text-blue-600 border border-slate-200 flex items-center justify-center font-bold hover:bg-blue-50 hover:border-blue-200 transition-colors shadow-sm"
                title="New Space"
              >
                +
              </button>
            </div>
            
            <div className="flex flex-col gap-1.5">
              {lists.map(list => (
                <button
                  key={list.id}
                  onClick={() => setActiveListId(list.id)}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-3 ${
                    activeListId === list.id 
                      ? 'bg-white shadow-md shadow-slate-200/50 text-blue-600 border border-slate-200' 
                      : 'text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent hover:shadow-sm'
                  }`}
                >
                  <span className="text-lg">{list.is_collaborative ? '👥' : '📁'}</span> 
                  <span className="truncate">{list.title}</span>
                </button>
              ))}
              {lists.length === 0 && (
                <div className="px-4 py-6 border-2 border-dashed border-slate-300 rounded-2xl text-center">
                  <p className="text-xs font-bold text-slate-400">No spaces yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Main Workspace */}
          <div className="w-full flex flex-col gap-6">
            
            {/* Context Header */}
            {activeList && (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      activeList.is_collaborative ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {activeList.is_collaborative ? 'Shared' : 'Personal'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      activeList.owner_id === user.id ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {activeList.owner_id === user.id ? 'Owner' : 'Member'}
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    {activeList.title}
                  </h1>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  {activeList.owner_id === user.id && (
                    <button onClick={() => openRenameModal(activeList)} className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-200" title="Rename Space">✏️</button>
                  )}
                  {activeList.is_collaborative && activeList.owner_id === user.id && (
                    <button onClick={() => setShowMemberModal(true)} className="px-4 py-2.5 bg-slate-50 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-2 border border-slate-200">
                      Invite Team
                    </button>
                  )}
                  {activeList.owner_id === user.id && (
                    <button onClick={() => confirmDeleteList(activeList)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors border border-slate-200" title="Delete Space">🗑️</button>
                  )}
                </div>
              </div>
            )}
            
            {/* Inline Task Input Engine */}
            {activeList && (
              <form 
                onSubmit={handleSubmit} 
                className={`p-2 pl-6 rounded-2xl transition-all duration-300 ease-in-out flex flex-col md:flex-row items-center gap-4 ${
                  editingId 
                    ? 'bg-white ring-2 ring-blue-500 shadow-xl scale-[1.02] border-none' 
                    : 'bg-white border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-slate-200 focus-within:shadow-md'
                }`}
              >
                <input 
                  type="text" 
                  required
                  className="w-full flex-1 bg-transparent text-slate-900 py-4 text-base focus:outline-none placeholder-slate-400 font-bold" 
                  placeholder={editingId ? "Update task..." : "Type a new task..."}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
                
                <div className="w-full md:w-auto flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 pr-2">
                  <input 
                    type="date" 
                    className="bg-slate-50 border border-slate-200 text-slate-600 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                  <select 
                    className="bg-slate-50 border border-slate-200 text-slate-600 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Med</option>
                    <option value="High">High</option>
                  </select>
                  <select 
                    className="bg-slate-50 border border-slate-200 text-slate-600 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  >
                    <option value="School">School</option>
                    <option value="Personal">Personal</option>
                    <option value="Others">Others</option>
                  </select>
                  
                  {editingId ? (
                    <div className="flex items-center gap-1">
                      <button type="submit" className="bg-blue-600 text-white p-2.5 rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors shadow-sm">Save</button>
                      <button type="button" onClick={cancelEdit} className="bg-slate-100 text-slate-600 p-2.5 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors border border-slate-200">✕</button>
                    </div>
                  ) : (
                    <button type="submit" className="bg-slate-900 text-white p-2.5 rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-md active:scale-95 whitespace-nowrap">
                      Add
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Task List Feed */}
            {activeList && (
              <div className={`transition-all duration-500 ${editingId ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 px-2">
                  <div className="flex space-x-2">
                    <select 
                      value={filterTag} 
                      onChange={(e) => setFilterTag(e.target.value)}
                      className="text-xs bg-transparent border-none focus:ring-0 font-bold text-slate-500 cursor-pointer hover:text-slate-900 transition-colors"
                    >
                      <option value="All">Filter: All</option>
                      <option value="School">School</option>
                      <option value="Personal">Personal</option>
                      <option value="Others">Others</option>
                    </select>
                    <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                      className="text-xs bg-transparent border-none focus:ring-0 font-bold text-slate-500 cursor-pointer hover:text-slate-900 transition-colors"
                    >
                      <option value="created_at">Sort: Newest</option>
                      <option value="priority">Sort: Priority</option>
                      <option value="due_date">Sort: Due Date</option>
                    </select>
                  </div>
                </div>
                
                {displayedTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-transparent">
                    <div className="w-16 h-16 bg-white shadow-sm border border-slate-200 rounded-2xl flex items-center justify-center text-2xl mb-4">🍃</div>
                    <p className="text-slate-900 font-extrabold text-lg tracking-tight">Nothing here yet</p>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Use the input above to create a task.</p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {displayedTasks.map((task) => (
                      <li 
                        key={task.id} 
                        className={`group p-4 pl-5 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 transition-all duration-200 ease-out border hover:shadow-md ${
                          task.is_done 
                            ? 'border-transparent bg-slate-50 opacity-60' 
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        
                        <div className="flex items-center gap-4 flex-1">
                          <button 
                            onClick={() => toggleDone(task.id, task.is_done)}
                            className={`w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                              task.is_done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-emerald-400'
                            }`}
                          >
                            <span className="text-[10px] font-black">✓</span>
                          </button>
                          
                          <div className={`flex flex-col ${task.is_done ? 'line-through text-slate-400' : ''}`}>
                            <h3 className={`font-extrabold text-base tracking-tight mb-1 ${task.is_done ? 'text-slate-500' : 'text-slate-900'}`}>
                              {task.title}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {task.due_date && (
                                <span className="text-slate-500 font-bold text-[10px] flex items-center gap-1 uppercase tracking-wider">
                                  📅 {task.due_date.split('T')[0]}
                                </span>
                              )}
                              {task.priority && (
                                <span className={`font-bold text-[10px] uppercase tracking-wider flex items-center ${
                                  task.priority === 'High' ? 'text-red-500' : 
                                  task.priority === 'Medium' ? 'text-amber-500' : 
                                  'text-blue-500'
                                }`}>
                                  • {task.priority}
                                </span>
                              )}
                              {task.tag && (
                                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                                  #{task.tag}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity pl-10 md:pl-0">
                          <button 
                            onClick={() => startEdit(task)}
                            disabled={task.is_done}
                            className={`p-2 rounded-lg font-bold text-xs transition-colors ${task.is_done ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-800'}`}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => confirmDeleteTask(task)}
                            className="p-2 rounded-lg font-bold text-xs text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            🗑
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}