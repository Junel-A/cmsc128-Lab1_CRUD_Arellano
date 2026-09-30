import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Register({ onRegisterSuccess, switchToLogin }) {
  // Track what the user types into the display name field
  const [displayName, setDisplayName] = useState('')
  // Track what the user types into the email field
  const [email, setEmail] = useState('')
  // Track what the user types into the password field
  const [password, setPassword] = useState('')
  // Keep track of whether the application is currently waiting on the server response
  const [loading, setLoading] = useState(false)
  // Store any error message to display if registration fails
  const [errorMessage, setErrorMessage] = useState('')

  // Send the new account credentials to Supabase for creation
  const handleRegister = async (e) => {
    // Prevent the browser from refreshing the page automatically on submit
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    // Ask Supabase to sign up a new user with email, password, and custom metadata for the display name
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    })

    // If Supabase rejects the registration attempt, grab the error text and stop loading
    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
    } else {
      setLoading(false)
      onRegisterSuccess(data.user)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background glowing effects to maintain the dark mode aesthetic */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[500px] h-[500px] rounded-full bg-up-maroon/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[500px] h-[500px] rounded-full bg-up-green/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-700/50 relative z-10">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-up-green to-emerald-800 flex items-center justify-center font-black text-white text-xl mx-auto shadow-lg mb-3">
            +
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1">Set up your credentials to get started</p>
        </div>

        {/* Conditionally display the error box if registration fails */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-900/50 rounded-xl text-red-400 text-sm font-semibold">
            ⚠ {errorMessage}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-1.5 text-slate-400">Display Name</label>
            <input 
              type="text" 
              required
              className="w-full border border-slate-700 bg-slate-950/50 text-slate-100 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-up-green focus:bg-slate-900 transition-all shadow-inner placeholder-slate-600"
              placeholder="Junel Arellano"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 text-slate-400">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full border border-slate-700 bg-slate-950/50 text-slate-100 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-up-green focus:bg-slate-900 transition-all shadow-inner placeholder-slate-600"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 text-slate-400">Password</label>
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
            {/* Change button text dynamically depending on whether the server request is pending */}
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-slate-400">Already have an account? </span>
          <button 
            onClick={switchToLogin} 
            className="text-up-green font-bold hover:underline ml-1"
          >
            Sign in
          </button>
        </div>

      </div>
    </div>
  )
}