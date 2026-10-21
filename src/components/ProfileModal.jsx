import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ProfileModal({ user, onClose, onUserUpdated }) {
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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 p-6 sm:p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200">
        
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-white">⚙️ Account Settings</h2>
            <p className="text-slate-400 text-xs mt-0.5">Update your profile credentials</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 font-bold hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Conditionally display success or error feedback */}
        {feedback.message && (
          <div className={`mb-5 p-3.5 rounded-xl text-xs font-semibold border ${
            feedback.type === 'success' 
              ? 'bg-emerald-950/50 border-emerald-900/50 text-emerald-400' 
              : 'bg-red-950/50 border-red-900/50 text-red-400'
          }`}>
            {feedback.type === 'success' ? '✓ ' : '⚠ '} {feedback.message}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-400">Display Name</label>
            <input 
              type="text" 
              className="w-full border border-slate-700 bg-slate-950/50 text-slate-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-up-green focus:bg-slate-900 text-sm shadow-inner"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your Name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 text-slate-400">Email Address (Unique Validation)</label>
            <input 
              type="email" 
              required
              className="w-full border border-slate-700 bg-slate-950/50 text-slate-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-up-green focus:bg-slate-900 text-sm shadow-inner"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 text-slate-400">New Password (Optional)</label>
            <input 
              type="password" 
              className="w-full border border-slate-700 bg-slate-950/50 text-slate-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-up-green focus:bg-slate-900 text-sm shadow-inner"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 font-black py-3 rounded-xl text-sm hover:bg-slate-700 transition-all shadow-sm"
            >
              Close
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-up-green to-emerald-800 text-white font-black py-3 rounded-xl text-sm shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}