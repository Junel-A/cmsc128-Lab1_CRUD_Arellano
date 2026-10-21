import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login({ onLoginSuccess, switchToRegister, switchToForgot }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      if (onLoginSuccess && data?.user) {
        onLoginSuccess(data.user)
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] selection:bg-blue-100 selection:text-blue-900 font-sans">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-slate-200 p-8 sm:p-10 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-white text-2xl mx-auto mb-6 shadow-lg shadow-blue-600/20">
          📝
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 text-center tracking-tight mb-2">Welcome Back</h2>
        <p className="text-slate-500 text-center text-sm font-medium mb-8">Sign in to access your secure workspace</p>
        
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold flex items-center gap-2">
            ✖ {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Email Address</label>
            <input 
              type="email" 
              required
              placeholder="name@example.com"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm font-medium placeholder-slate-400"
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
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm font-medium placeholder-slate-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex justify-end mt-2">
              <button 
                type="button" 
                onClick={switchToForgot}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 transition-all hover:-translate-y-0.5 active:scale-95 mt-4"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm font-medium text-slate-500">
          Don't have an account yet?{' '}
          <button onClick={switchToRegister} className="font-bold text-blue-600 hover:text-blue-800 transition-colors">
            Create account
          </button>
        </p>
      </div>
    </div>
  )
}