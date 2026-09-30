import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  // Set up our main storage for the tasks we pull from the database
  const [tasks, setTasks] = useState([])
  
  // Keep track of whatever the user is typing into the form
  // We set the default category to School so it never accidentally sends a blank tag
  const [formData, setFormData] = useState({
    title: '',
    due_date: '',
    priority: 'Low',
    tag: 'School' 
  })

  // Remember which specific task the user clicked to edit, if any
  const [editingId, setEditingId] = useState(null)
  
  // Remember what the user chooses in the dropdown menus so we know how to organize the list
  const [sortBy, setSortBy] = useState('created_at')
  const [filterTag, setFilterTag] = useState('All')

  // We need to turn the text priorities into actual values so the computer knows High is greater than Low
  const getPriorityValue = (p) => (p === 'High' ? 3 : p === 'Medium' ? 2 : 1)

  // Talk to the database and grab everything, bringing the newest stuff to the top first
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

  // Automatically go fetch the tasks the exact moment the app opens up
  useEffect(() => {
    const loadTasks = async () => {
      await fetchTasks()
    }
    loadTasks()
  }, [])

  // Figure out what to do when the user clicks the submit button on the form
  const handleSubmit = async (e) => {
    // Stop the page from doing that annoying full refresh
    e.preventDefault() 
    
    // If we currently have an editing ID stored, it means we are updating an old task
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
      // If there is no editing ID, this is a completely brand new task that needs to be added
      const { error } = await supabase
        .from('tasks')
        .insert([{
          title: formData.title,
          due_date: formData.due_date || null,
          priority: formData.priority,
          tag: formData.tag
        }])

      if (!error) {
        setFormData({ title: '', due_date: '', priority: 'Low', tag: 'School' })
        fetchTasks() 
      }
    }
  }

  // Grab the details of the task the user clicked and dump them into the form so they can change things
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

  // The user changed their mind, so wipe the form clean and forget we were editing anything
  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ title: '', due_date: '', priority: 'Low', tag: 'School' })
  }

  // Just flip the current status of the task to whatever the opposite is in the database
  const toggleDone = async (id, currentStatus) => {
    const { error } = await supabase.from('tasks').update({ is_done: !currentStatus }).eq('id', id)
    if (!error) fetchTasks()
  }

  // Throw a quick warning box before we actually permanently delete their data
  const deleteTask = async (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (!error) fetchTasks()
    }
  }

  // Before we draw the list on the screen, throw away any tasks that do not match the category the user picked
  let displayedTasks = tasks.filter(task => filterTag === 'All' || task.tag === filterTag)

  // Now take whatever tasks survived the filter and sort them based on the sorting dropdown
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

  // Put all the visual stuff together and draw the actual website
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-stone-200 to-stone-300 p-4 sm:p-8 font-sans text-stone-800 relative overflow-hidden flex justify-center">
      
      {/* Toss in some blurred background circles just to make the design feel a bit more premium */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-up-maroon/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-72 h-72 rounded-full bg-up-green/5 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-10 rounded-3xl shadow-2xl border border-white/60 relative z-10">
        
        <h1 className="text-4xl md:text-5xl font-black mb-8 text-center tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-up-maroon to-red-900 drop-shadow-sm">
          My Task Manager
        </h1>

        {/* If we are editing, make this form scale up and glow so the user knows exactly where to look */}
        <form 
          onSubmit={handleSubmit} 
          className={`mb-10 space-y-5 p-6 rounded-2xl border transition-all duration-500 ease-out ${
            editingId 
              ? 'bg-white ring-4 ring-up-green/50 shadow-[0_20px_50px_rgba(0,0,0,0.15)] scale-[1.02] relative z-20' 
              : 'bg-white/50 border-white/80 shadow-lg hover:shadow-xl hover:bg-white/70'
          }`}
        >
          <h2 className="text-xl font-extrabold text-stone-700 border-b-2 border-stone-200/60 pb-3 flex items-center gap-2">
            {editingId ? 'Editing Task' : 'Add a New Task'}
          </h2>
          
          <div>
            <label className="block text-sm font-bold mb-1.5 text-stone-600">Task Title *</label>
            <input 
              type="text" 
              required
              className="w-full border-0 bg-stone-100/80 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-up-maroon focus:bg-white transition-all shadow-inner" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-bold mb-1.5 text-stone-600">Due Date</label>
              <input 
                type="date" 
                className="w-full border-0 bg-stone-100/80 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-up-maroon focus:bg-white transition-all shadow-inner text-stone-700"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-1.5 text-stone-600">Priority</label>
              <select 
                className="w-full border-0 bg-stone-100/80 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-up-maroon focus:bg-white transition-all shadow-inner text-stone-700 font-semibold"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="Low">🟢 Low</option>
                <option value="Medium">🟡 Medium</option>
                <option value="High">🔴 High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-stone-600">Category Tag</label>
              <select 
                className="w-full border-0 bg-stone-100/80 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-up-maroon focus:bg-white transition-all shadow-inner text-stone-700 font-semibold"
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
              className={`flex-1 text-white font-black py-3 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${editingId ? 'bg-gradient-to-r from-up-green to-emerald-700' : 'bg-gradient-to-r from-up-maroon to-red-900'}`}
            >
              {editingId ? 'Save Changes' : 'Create Task'}
            </button>
            
            {editingId && (
              <button 
                type="button" 
                onClick={cancelEdit}
                className="flex-1 bg-stone-200 text-stone-700 font-black py-3 rounded-xl hover:bg-stone-300 transition-all duration-300 shadow-md hover:-translate-y-1"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Dim the entire list of tasks down below if the user is editing so they stop clicking around and focus on the form */}
        <div className={`transition-all duration-500 ${editingId ? 'opacity-40 pointer-events-none grayscale blur-[1px]' : 'opacity-100'}`}>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b-2 border-stone-200/60 pb-4 gap-4">
            <h2 className="text-2xl font-black text-stone-800">Current Tasks</h2>
            
            <div className="flex space-x-3 w-full sm:w-auto">
              <select 
                value={filterTag} 
                onChange={(e) => setFilterTag(e.target.value)}
                className="flex-1 sm:flex-none text-sm bg-white border-2 border-stone-200 rounded-lg p-2 focus:ring-2 focus:ring-up-maroon font-bold text-stone-700 shadow-sm"
              >
                <option value="All">Filter: All</option>
                <option value="School">School</option>
                <option value="Personal">Personal</option>
                <option value="Others">Others</option>
              </select>

              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 sm:flex-none text-sm bg-white border-2 border-stone-200 rounded-lg p-2 focus:ring-2 focus:ring-up-maroon font-bold text-stone-700 shadow-sm"
              >
                <option value="created_at">Sort: Newest</option>
                <option value="priority">Sort: Priority</option>
                <option value="due_date">Sort: Due Date</option>
                <option value="tag">Sort: Category</option>
              </select>
            </div>
          </div>
          
          {/* Show a friendly empty state if the filter caught nothing or the database is truly empty */}
          {displayedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-white/40 rounded-2xl border-2 border-dashed border-stone-300">
              <span className="text-4xl mb-3">🍃</span>
              <p className="text-stone-500 font-bold text-lg">All caught up!</p>
              <p className="text-stone-400 text-sm">Add a new task above to get started.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {/* Loop through our perfectly filtered and sorted array to draw each task card */}
              {displayedTasks.map((task) => (
                <li 
                  key={task.id} 
                  className={`p-5 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl border ${
                    task.is_done 
                      ? 'bg-stone-50/50 border-stone-200 opacity-70' 
                      : 'bg-white border-white shadow-md border-l-8 border-l-up-maroon'
                  }`}
                >
                  
                  {/* Visually strike out the text if the task is done so it looks completed */}
                  <div className={`flex-1 ${task.is_done ? 'line-through text-stone-400' : ''}`}>
                    <h3 className="font-extrabold text-xl text-stone-800 mb-2">{task.title}</h3>
                    <div className="text-sm flex flex-wrap gap-2">
                      {task.due_date && (
                        <span className="px-3 py-1 bg-stone-100 rounded-lg text-stone-600 font-bold flex items-center gap-1.5">
                          📅 {task.due_date.split('T')[0]}
                        </span>
                      )}
                      {task.priority && (
                        <span className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center shadow-sm ${
                          task.priority === 'High' ? 'bg-red-100 text-red-700' : 
                          task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-stone-100 text-stone-700'
                        }`}>
                          {task.priority} Priority
                        </span>
                      )}
                      {task.tag && (
                        <span className="px-3 py-1 bg-up-green/10 text-up-green rounded-lg text-xs font-black shadow-sm uppercase tracking-wider">
                          #{task.tag}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 w-full md:w-auto">
                    <button 
                      onClick={() => toggleDone(task.id, task.is_done)}
                      className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-black text-sm transition-all duration-200 shadow-sm hover:-translate-y-1 ${task.is_done ? 'bg-stone-200 text-stone-700 hover:bg-stone-300' : 'bg-up-green text-white hover:bg-emerald-600 shadow-emerald-500/30 hover:shadow-lg'}`}
                    >
                      {task.is_done ? 'Undo' : 'Done'}
                    </button>
                    
                    <button 
                      onClick={() => startEdit(task)}
                      disabled={task.is_done}
                      className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-black text-sm transition-all duration-200 shadow-sm ${task.is_done ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'bg-stone-800 text-white hover:bg-black hover:-translate-y-1 hover:shadow-lg'}`}
                    >
                      Edit
                    </button>

                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="flex-1 md:flex-none px-5 py-2.5 rounded-xl font-black text-sm bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-200 shadow-sm hover:-translate-y-1 hover:shadow-lg"
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
  )
}