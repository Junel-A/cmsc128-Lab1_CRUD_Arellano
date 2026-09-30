import { useState } from 'react'

export default function CalendarView({ tasks, onClose }) {
  // Track the currently viewed month and year in the calendar
  const [currentDate, setCurrentDate] = useState(new Date())

  // Extract the current year and month numbers
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get the name of the current month for display
  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ]

  // Calculate the first day of the month and total days in the month
  const firstDayIndex = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()

  // Move the calendar view to the previous month
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  // Move the calendar view to the next month
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 p-6 sm:p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Calendar Header with Navigation Controls */}
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-black text-white">Task Deadline Calendar</h2>
            <p className="text-slate-400 text-sm mt-0.5">Visualize your schedule across the month</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 font-bold hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Month Switching Controls */}
        <div className="flex justify-between items-center mb-6 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
          <button 
            onClick={prevMonth}
            className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-700 transition-all"
          >
            ← Prev
          </button>
          <span className="text-lg font-extrabold text-white">
            {monthNames[month]} {year}
          </span>
          <button 
            onClick={nextMonth}
            className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-700 transition-all"
          >
            Next →
          </button>
        </div>

        {/* Days of the Week Header Grid */}
        <div className="grid grid-cols-7 gap-2 text-center mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-xs font-black text-slate-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Render blank slots for days preceding the first day of the month */}
          {Array.from({ length: firstDayIndex }).map((_, index) => (
            <div key={`empty-${index}`} className="h-24 bg-slate-950/20 rounded-2xl border border-transparent opacity-30"></div>
          ))}

          {/* Render each valid day of the current month */}
          {Array.from({ length: totalDays }).map((_, index) => {
            const dayNumber = index + 1
            
            // Format the current date string into YYYY-MM-DD to match database due dates
            const formattedMonth = String(month + 1).padStart(2, '0')
            const formattedDay = String(dayNumber).padStart(2, '0')
            const dateString = `${year}-${formattedMonth}-${formattedDay}`

            // Find all tasks assigned to this specific calendar day
            const dayTasks = tasks.filter(task => task.due_date && task.due_date.startsWith(dateString))

            return (
              <div 
                key={dayNumber} 
                className="h-24 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-2 flex flex-col overflow-y-auto hover:border-slate-700 transition-all"
              >
                <span className="text-xs font-bold text-slate-400 mb-1">{dayNumber}</span>
                <div className="space-y-1">
                  {dayTasks.map(task => (
                    <div 
                      key={task.id}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate shadow-sm border ${
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
    </div>
  )
}