import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Register({ onRegisterSuccess, switchToLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } }
    })

    if (error) {
      setError(error.message)
    } else {
      if (onRegisterSuccess && data?.user) {
        onRegisterSuccess(data.user)
      } else {
        setError("Registration successful, but user data is missing. Please try logging in.")
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] selection:bg-blue-100 selection:text-blue-900 font-sans">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-slate-200 p-8 sm:p-10 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-black text-white text-2xl mx-auto mb-6 shadow-lg shadow-indigo-500/20">
          +
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 text-center tracking-tight mb-2">Create Account</h2>
        <p className="text-slate-500 text-center text-sm font-medium mb-8">Set up your credentials to get started</p>
        
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold flex items-center gap-2">
            ✖ {error}
          </div>
        )}
        
        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Display Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Jane Doe"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm font-medium placeholder-slate-400"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Email Address</label>
            <input 
              type="email" 
              required
              placeholder="name@example.com"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm font-medium placeholder-slate-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Password</label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm font-medium placeholder-slate-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 transition-all hover:-translate-y-0.5 active:scale-95 mt-4"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm font-medium text-slate-500">
          Already have an account?{' '}
          <button onClick={switchToLogin} className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
            Sign In
          </button>
        </p>
      </div>
    </div>
  )
}