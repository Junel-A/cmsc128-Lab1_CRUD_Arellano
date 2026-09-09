import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [tasks, setTasks] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    due_date: '',
    priority: 'Low',
    tag: ''
  })
  const [editingId, setEditingId] = useState(null)

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) console.error("Error fetching tasks:", error)
    else setTasks(data)
  }

  useEffect(() => {
    const loadTasks = async () => {
      await fetchTasks()
    }
    loadTasks()
  }, [])

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

      if (error) {
        console.error("Error updating task:", error)
      } else {
        setEditingId(null)
        setFormData({ title: '', due_date: '', priority: 'Low', tag: '' })
        fetchTasks()
      }
    } else {
      const { error } = await supabase
        .from('tasks')
        .insert([formData])

      if (error) {
        console.error("Error adding task:", error)
      } else {
        setFormData({ title: '', due_date: '', priority: 'Low', tag: '' })
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
      tag: task.tag || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ title: '', due_date: '', priority: 'Low', tag: '' })
  }

  const toggleDone = async (id, currentStatus) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_done: !currentStatus })
      .eq('id', id)

    if (error) console.error("Error updating task:", error)
    else fetchTasks()
  }

  const deleteTask = async (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) console.error("Error deleting task:", error)
      else fetchTasks()
    }
  }

  return (
    <div className="min-h-screen bg-stone-100 p-8 font-sans text-stone-800">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-lg border-t-8 border-up-maroon">
        
        <h1 className="text-4xl font-extrabold mb-6 text-center text-up-maroon tracking-tight">My Task Manager</h1>

        {/* --- ADD/EDIT FORM --- */}
        <form onSubmit={handleSubmit} className="mb-8 space-y-4 bg-stone-50 p-5 rounded-lg border border-stone-200 transition-all duration-300 hover:shadow-md">
          <h2 className="text-lg font-bold text-stone-700 border-b-2 border-stone-200 pb-2 flex items-center gap-2">
            {editingId ? '✏️ Edit Task' : '✨ Add New Task'}
          </h2>
          
          <div>
            <label className="block text-sm font-bold mb-1 text-stone-600">Task Title *</label>
            <input 
              type="text" 
              required
              className="w-full border border-stone-300 p-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-up-maroon focus:border-transparent transition-all" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1 text-stone-600">Due Date</label>
              <input 
                type="date" 
                className="w-full border border-stone-300 p-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-up-maroon focus:border-transparent transition-all"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-1 text-stone-600">Priority</label>
              <select 
                className="w-full border border-stone-300 p-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-up-maroon focus:border-transparent transition-all"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 text-stone-600">Tag</label>
              <input 
                type="text" 
                placeholder="e.g. CMSC128, Org"
                className="w-full border border-stone-300 p-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-up-maroon focus:border-transparent transition-all"
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button 
              type="submit" 
              className={`flex-1 text-white font-bold py-2.5 rounded-md shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${editingId ? 'bg-up-green hover:bg-up-green-dark' : 'bg-up-maroon hover:bg-up-maroon-dark'}`}
            >
              {editingId ? 'Update Task' : 'Add Task'}
            </button>
            
            {editingId && (
              <button 
                type="button" 
                onClick={cancelEdit}
                className="flex-1 bg-stone-200 text-stone-700 font-bold py-2.5 rounded-md hover:bg-stone-300 transition-all duration-300"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* --- TASK LIST --- */}
        <div>
          <h2 className="text-xl font-bold mb-4 border-b-2 border-stone-200 pb-2 text-stone-700">Current Tasks</h2>
          
          {tasks.length === 0 ? (
            <p className="text-stone-500 italic text-center py-8 bg-stone-50 rounded-lg border border-dashed border-stone-300">No tasks yet. Add one above!</p>
          ) : (
            <ul className="space-y-4">
              {tasks.map((task) => (
                <li 
                  key={task.id} 
                  className={`p-4 border rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg ${task.is_done ? 'bg-stone-50 border-stone-200 opacity-75' : 'bg-white border-stone-200 border-l-4 border-l-up-maroon'}`}
                >
                  
                  <div className={`flex-1 ${task.is_done ? 'line-through text-stone-400' : ''}`}>
                    <h3 className="font-bold text-lg text-stone-800">{task.title}</h3>
                    <div className="text-sm space-x-3 mt-1.5 flex flex-wrap gap-y-2">
                      {task.due_date && <span className="flex items-center gap-1 text-stone-600">📅 {task.due_date.split('T')[0]}</span>}
                      {task.priority && <span className="px-2.5 py-0.5 bg-stone-100 rounded-full border border-stone-200 text-xs font-semibold text-stone-600">{task.priority} Priority</span>}
                      {task.tag && <span className="text-up-green bg-green-50 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-green-100">#{task.tag}</span>}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button 
                      onClick={() => toggleDone(task.id, task.is_done)}
                      className={`px-4 py-1.5 rounded-md font-bold text-sm transition-all duration-200 shadow-sm hover:-translate-y-0.5 ${task.is_done ? 'bg-stone-200 text-stone-700 hover:bg-stone-300' : 'bg-up-green text-white hover:bg-up-green-dark'}`}
                    >
                      {task.is_done ? 'Undo' : 'Done'}
                    </button>
                    
                    <button 
                      onClick={() => startEdit(task)}
                      disabled={task.is_done}
                      className={`px-4 py-1.5 rounded-md font-bold text-sm transition-all duration-200 shadow-sm ${task.is_done ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'bg-stone-800 text-white hover:bg-black hover:-translate-y-0.5'}`}
                    >
                      Edit
                    </button>

                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="px-4 py-1.5 rounded-md font-bold text-sm bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-200 shadow-sm hover:-translate-y-0.5"
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