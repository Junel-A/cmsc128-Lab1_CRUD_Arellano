import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ProfileView({ user, onUserUpdated, goToTasks }) {
  // Store the display name input value
  const [displayName, setDisplayName] = useState(user.user_metadata?.display_name || '')
  // Store the email input value
  const [email, setEmail] = useState(user.email || '')
  // Store the new password input value
  const [password, setPassword] = useState('')
  // Track loading state during update requests
  const [loading, setLoading] = useState(false)
  // Store feedback messages for success or failure
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  // Handle updating user profile details via Supabase Auth
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setFeedback({ type: '', message: '' })

    // Build update payload for Supabase auth API
    const updates = {}
    if (email !== user.email) updates.email = email
    if (password.trim() !== '') updates.password = password
    updates.data = { display_name: displayName }

    const { data, error } = await supabase.auth.updateUser(updates)

    if (error) {
      setFeedback({ type: 'error', message: error.message })
      setLoading(false)
    } else {
      setFeedback({ 
        type: 'success', 
        message: email !== user.email 
          ? 'Profile updated! Please check your new email inbox to confirm the change.' 
          : 'Profile settings successfully updated and saved!' 
      })
      setLoading(false)
      setPassword('')
      if (data.user) {
        onUserUpdated(data.user)
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto pt-12 px-4 relative z-10">
      
      {/* Welcome Banner */}
      <div className="w-full bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-700/50 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-up-green/10 blur-[60px] pointer-events-none"></div>
        <h1 className="text-3xl font-black text-white mb-2">
          Hello, <span className="text-up-green">{user.user_metadata?.display_name || user.email}</span>! 👋
        </h1>
        <p className="text-slate-400 text-sm">
          Welcome to your secure workspace. Manage your credentials or jump straight to your tasks below.
        </p>

        <div className="mt-6 flex items-center gap-4">
          <button 
            onClick={goToTasks}
            className="px-6 py-3 bg-gradient-to-r from-up-maroon to-red-950 text-white font-black rounded-xl text-sm shadow-lg hover:shadow-red-900/20 transition-all duration-300 hover:-translate-y-0.5"
          >
            Go to Tasks →
          </button>
        </div>
      </div>

      {/* Account Settings / Profile Edit Box */}
      <div className="w-full bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-700/50">
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-white">⚙️ Account Settings</h2>
            <p className="text-slate-400 text-xs mt-0.5">Update your username, email, and password</p>
          </div>
        </div>

        {feedback.message && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-semibold border ${
            feedback.type === 'success' 
              ? 'bg-emerald-950/50 border-emerald-900/50 text-emerald-400' 
              : 'bg-red-950/50 border-red-900/50 text-red-400'
          }`}>
            {feedback.type === 'success' ? '✓ ' : '⚠ '} {feedback.message}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-1.5 text-slate-400">Display Name</label>
            <input 
              type="text" 
              className="w-full border border-slate-700 bg-slate-950/50 text-slate-100 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-up-green focus:bg-slate-900 transition-all shadow-inner text-sm"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your Name"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 text-slate-400">Email Address (Unique Validation)</label>
            <input 
              type="email" 
              required
              className="w-full border border-slate-700 bg-slate-950/50 text-slate-100 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-up-green focus:bg-slate-900 transition-all shadow-inner text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 text-slate-400">New Password (Optional)</label>
            <input 
              type="password" 
              className="w-full border border-slate-700 bg-slate-950/50 text-slate-100 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-up-green focus:bg-slate-900 transition-all shadow-inner text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
            />
          </div>

          <div className="pt-3">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-up-green to-emerald-800 text-white font-black py-3.5 rounded-xl text-sm shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

    </div>
  )
}