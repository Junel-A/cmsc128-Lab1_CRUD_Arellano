import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function UpdatePassword({ onUpdateSuccess }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
    } else {
      if (onUpdateSuccess) onUpdateSuccess()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] selection:bg-blue-100 selection:text-blue-900 font-sans">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-slate-200 p-8 sm:p-10 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mx-auto mb-6 shadow-inner border border-emerald-200">
          🔒
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 text-center tracking-tight mb-2">Secure Account</h2>
        <p className="text-slate-500 text-center text-sm font-medium mb-8">Enter your new secure password below.</p>
        
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold flex items-center gap-2">
            ✖ {error}
          </div>
        )}
        
        <form onSubmit={handleUpdate} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">New Password</label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-sm font-medium placeholder-slate-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 transition-all hover:-translate-y-0.5 active:scale-95 mt-4"
          >
            {loading ? 'Updating Password...' : 'Save New Password'}
          </button>
        </form>
      </div>
    </div>
  )
}