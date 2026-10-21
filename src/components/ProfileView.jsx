import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ProfileView({ user, onUserUpdated, goToTasks }) {
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '')
  const [email, setEmail] = useState(user?.email || '')
  
  // Security fields for password updates
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })

    const updates = {}
    if (displayName !== user?.user_metadata?.display_name) {
      updates.data = { display_name: displayName }
    }
    if (email !== user?.email) {
      updates.email = email
    }

    // Advanced Password Validation & Verification
    if (newPassword || oldPassword || confirmPassword) {
      if (!oldPassword) {
        setMessage({ text: 'Please enter your current password to authorize a new one.', type: 'error' })
        setLoading(false)
        return
      }
      if (newPassword !== confirmPassword) {
        setMessage({ text: 'Your new passwords do not match.', type: 'error' })
        setLoading(false)
        return
      }
      if (newPassword.length < 6) {
        setMessage({ text: 'New password must be at least 6 characters long.', type: 'error' })
        setLoading(false)
        return
      }

      // Verify old password against Supabase auth securely
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword
      })

      if (signInError) {
        setMessage({ text: 'Incorrect current password. Access denied.', type: 'error' })
        setLoading(false)
        return
      }

      updates.password = newPassword
    }

    if (Object.keys(updates).length === 0) {
      setMessage({ text: 'No changes made.', type: 'info' })
      setLoading(false)
      return
    }

    // Execute the updates
    const { data, error } = await supabase.auth.updateUser(updates)

    if (error) {
      setMessage({ text: error.message, type: 'error' })
    } else {
      setMessage({ text: 'Profile updated successfully!', type: 'success' })
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      if (onUserUpdated && data?.user) {
        onUserUpdated(data.user)
      }
    }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-10">
      
      {/* Sleek Gradient Welcome Banner */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-black opacity-10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight flex items-center gap-3">
              Hello, <span className="text-blue-100">{user?.user_metadata?.display_name || 'User'}</span> 👋
            </h2>
            <p className="text-blue-100/80 text-sm max-w-md leading-relaxed font-medium">
              Welcome to your secure workspace. Manage your credentials here or jump straight into your tasks.
            </p>
          </div>
          <button 
            onClick={goToTasks}
            className="whitespace-nowrap px-6 py-3.5 bg-white text-blue-700 font-extrabold rounded-xl hover:bg-slate-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
          >
            Go to Tasks →
          </button>
        </div>
      </div>

      {/* Modern Profile Settings Card */}
      <div className="bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 relative z-10">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl">⚙️</div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account Settings</h3>
            <p className="text-slate-500 text-sm mt-0.5 font-medium">Update your username, email, and password</p>
          </div>
        </div>

        {message.text && (
          <div className={`mb-8 p-4 rounded-xl text-sm font-bold border flex items-center gap-2 ${
            message.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 
            message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 
            'bg-blue-50 border-blue-200 text-blue-600'
          }`}>
            {message.type === 'error' ? '✖' : message.type === 'success' ? '✓' : 'ℹ'} {message.text}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Display Name</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm font-medium"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Email Address (Unique Validation)</label>
            <input 
              type="email" 
              required
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Secure Password Update Section */}
          <div className="pt-6 mt-6 border-t border-slate-100 space-y-5">
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Change Password</h4>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Current Password</label>
              <input 
                type="password" 
                placeholder="Required to change your password"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm font-medium placeholder-slate-400"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">New Password</label>
                <input 
                  type="password" 
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm font-medium placeholder-slate-400"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Confirm New Password</label>
                <input 
                  type="password" 
                  placeholder="Retype new password"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm font-medium placeholder-slate-400"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:scale-95"
            >
              {loading ? 'Authenticating & Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}