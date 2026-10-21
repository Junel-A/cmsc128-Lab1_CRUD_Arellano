import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ForgotPassword({ switchToLogin }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })

    if (error) {
      setMessage({ text: error.message, type: 'error' })
    } else {
      setMessage({ text: 'Check your email for the password reset link!', type: 'success' })
      setEmail('')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] selection:bg-blue-100 selection:text-blue-900 font-sans">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-slate-200 p-8 sm:p-10 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl mx-auto mb-6 shadow-inner border border-amber-200">
          🔑
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 text-center tracking-tight mb-2">Reset Password</h2>
        <p className="text-slate-500 text-center text-sm font-medium mb-8">Enter your registered email to receive recovery instructions</p>
        
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-bold border flex items-center gap-2 ${
            message.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            {message.type === 'error' ? '✖' : '✓'} {message.text}
          </div>
        )}
        
        <form onSubmit={handleReset} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Email Address</label>
            <input 
              type="email" 
              required
              placeholder="name@example.com"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all shadow-sm font-medium placeholder-slate-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg hover:shadow-slate-900/20 disabled:opacity-50 transition-all hover:-translate-y-0.5 active:scale-95 mt-4"
          >
            {loading ? 'Sending Instructions...' : 'Send Reset Instructions'}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <button onClick={switchToLogin} className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
            ← Back to Sign In
          </button>
        </div>
      </div>
    </div>
  )
}