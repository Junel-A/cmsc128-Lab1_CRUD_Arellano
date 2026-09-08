import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  // STATE VARIABLES
  const [tasks, setTasks] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    due_date: '',
    priority: 'Low',
    tag: ''
  })
  
  // State to track which task is currently edited
  // If null, add new task. If it has an ID, edit.
  const [editingId, setEditingId] = useState(null)


  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) console.error("Error fetching tasks:", error)
    else setTasks(data)
  }
// READ
  useEffect(() => {
    const loadTasks = async () => {
      await fetchTasks()
    }
    loadTasks()
  }, [])

  // CREATE & UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault() 
    
    if (editingId) {
      // Update existing task logic
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
        // Reset form and exit edit mode
        setEditingId(null)
        setFormData({ title: '', due_date: '', priority: 'Low', tag: '' })
        fetchTasks()
      }
    } else {
      // Original Add Task logic
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

  // Function to load task data into form when "Edit" is clicked
  const startEdit = (task) => {
    setEditingId(task.id)
    setFormData({
      title: task.title,
      // split the date string to remove the messy time code for the input box
      due_date: task.due_date ? task.due_date.split('T')[0] : '', 
      priority: task.priority || 'Low',
      tag: task.tag || ''
    })
    // Scroll to top so the user sees the form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Function to cancel out of edit mode
  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ title: '', due_date: '', priority: 'Low', tag: '' })
  }

  // TOGGLE DONE
  const toggleDone = async (id, currentStatus) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_done: !currentStatus })
      .eq('id', id)

    if (error) console.error("Error updating task:", error)
    else fetchTasks()
  }

  // DELETE
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

  // USER INTERFACE
  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans text-gray-800">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">My Task Manager</h1>

        {/*ADD/EDIT FORM --- */}
        <form onSubmit={handleSubmit} className="mb-8 space-y-4 bg-gray-50 p-4 rounded border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-700 border-b pb-2">
            {editingId ? '✏️ Edit Task' : '✨ Add New Task'}
          </h2>
          
          <div>
            <label className="block text-sm font-bold mb-1">Task Title *</label>
            <input 
              type="text" 
              required
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">Due Date</label>
              <input 
                type="date" 
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-1">Priority</label>
              <select 
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">Tag</label>
              <input 
                type="text" 
                placeholder="e.g. School, Work"
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
              />
            </div>
          </div>

          {/* Dynamic Buttons depending on mode */}
          <div className="flex space-x-2 pt-2">
            <button 
              type="submit" 
              className={`flex-1 text-white font-bold py-2 rounded transition ${editingId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {editingId ? 'Update Task' : 'Add Task'}
            </button>
            
            {editingId && (
              <button 
                type="button" 
                onClick={cancelEdit}
                className="flex-1 bg-gray-300 text-gray-800 font-bold py-2 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* TASK LIST */}
        <div>
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Current Tasks</h2>
          
          {tasks.length === 0 ? (
            <p className="text-gray-500 italic text-center py-4">No tasks yet. Add one above!</p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li 
                  key={task.id} 
                  className={`p-4 border rounded flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition shadow-sm ${task.is_done ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
                >
                  
                  {/* Task Details */}
                  <div className={`flex-1 ${task.is_done ? 'line-through text-gray-500' : ''}`}>
                    <h3 className="font-bold text-lg">{task.title}</h3>
                    <div className="text-sm space-x-3 mt-1 flex flex-wrap gap-y-1">
                      {/* Cleaned up the date display */}
                      {task.due_date && <span>📅 {task.due_date.split('T')[0]}</span>}
                      {task.priority && <span className="px-2 py-0.5 bg-gray-100 rounded border text-xs">{task.priority} Priority</span>}
                      {task.tag && <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">#{task.tag}</span>}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => toggleDone(task.id, task.is_done)}
                      className={`px-3 py-1.5 rounded font-bold text-sm transition ${task.is_done ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                      {task.is_done ? 'Undo' : 'Done'}
                    </button>
                    
                    {/*Edit Button (Disabled if task is done) */}
                    <button 
                      onClick={() => startEdit(task)}
                      disabled={task.is_done}
                      className={`px-3 py-1.5 rounded font-bold text-sm transition ${task.is_done ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                    >
                      Edit
                    </button>

                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="px-3 py-1.5 rounded font-bold text-sm bg-red-100 text-red-700 hover:bg-red-200 transition"
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