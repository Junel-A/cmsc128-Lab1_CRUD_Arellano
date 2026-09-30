import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login({ onLoginSuccess, switchToRegister, switchToForgot }) {
  // Keep track of whatever text string the user enters into the email input box
  const [email, setEmail] = useState('')
  // Keep track of the password characters typed by the user
  const [password, setPassword] = useState('')
  // Determine if the application is currently waiting on a network response from Supabase
  const [loading, setLoading] = useState(false)
  // Store any error feedback text returned by the server if authentication fails
  const [errorMessage, setErrorMessage] = useState('')

  // Send the user credentials to Supabase to verify the login attempt
  const handleLogin = async (e) => {
    // Stop the web browser from performing a full page reload on form submission
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    // Authenticate using Supabase built in password method
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    // If Supabase rejects the login credentials, capture the error message and unlock the form
    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
    } else {
      // If successful, stop loading and pass the authenticated user data upward
      setLoading(false)
      onLoginSuccess(data.user)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background glowing effects to make the dark mode interface look less plain */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[500px] h-[500px] rounded-full bg-up-maroon/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[500px] h-[500px] rounded-full bg-up-green/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-700/50 relative z-10">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-up-maroon to-red-900 flex items-center justify-center font-black text-white text-xl mx-auto shadow-lg mb-3">
            ✓
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Welcome Back</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to access your secure task workspace</p>
        </div>

        {/* Conditionally display the error box if authentication fails */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-900/50 rounded-xl text-red-400 text-sm font-semibold">
            ⚠ {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-1.5 text-slate-400">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full border border-slate-700 bg-slate-950/50 text-slate-100 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-up-maroon focus:bg-slate-900 transition-all shadow-inner placeholder-slate-600"
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
              className="w-full border border-slate-700 bg-slate-950/50 text-slate-100 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-up-maroon focus:bg-slate-900 transition-all shadow-inner placeholder-slate-600"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {/* Moved cleanly below the password input box */}
            <div className="flex justify-end mt-1.5">
              <button 
                type="button" 
                onClick={switchToForgot}
                className="text-xs font-bold text-up-green hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-up-maroon to-red-950 text-white font-black py-3.5 rounded-xl shadow-lg hover:shadow-red-900/20 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
          >
            {/* Change button text dynamically depending on whether the server request is pending */}
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-slate-400">Don't have an account yet? </span>
          <button 
            onClick={switchToRegister} 
            className="text-up-green font-bold hover:underline ml-1"
          >
            Create account
          </button>
        </div>

      </div>
    </div>
  )
}