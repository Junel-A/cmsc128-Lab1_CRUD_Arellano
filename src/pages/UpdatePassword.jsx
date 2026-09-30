import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function UpdatePassword({ onUpdateSuccess }) {
  // Store the new password entered by the user
  const [password, setPassword] = useState('')
  // Track loading status during the password update request
  const [loading, setLoading] = useState(false)
  // Store any error messages returned by Supabase
  const [errorMessage, setErrorMessage] = useState('')

  // Submit the new password to Supabase
  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    // Update the user's password using the active recovery session token
    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
    } else {
      setLoading(false)
      onUpdateSuccess()
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex items-center justify-center p-4 relative overflow-hidden">
      
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[500px] h-[500px] rounded-full bg-up-maroon/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[500px] h-[500px] rounded-full bg-up-green/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-700/50 relative z-10">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-up-green to-emerald-800 flex items-center justify-center font-black text-white text-xl mx-auto shadow-lg mb-3">
            🔒
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Set New Password</h1>
          <p className="text-slate-400 text-sm mt-1">Please enter your secure new password below</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-900/50 rounded-xl text-red-400 text-sm font-semibold">
            ⚠ {errorMessage}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-1.5 text-slate-400">New Password</label>
            <input 
              type="password" 
              required
              className="w-full border border-slate-700 bg-slate-950/50 text-slate-100 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-up-green focus:bg-slate-900 transition-all shadow-inner placeholder-slate-600"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-up-green to-emerald-800 text-white font-black py-3.5 rounded-xl shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
          >
            {loading ? 'Updating Password...' : 'Save New Password'}
          </button>
        </form>

      </div>
    </div>
  )
}