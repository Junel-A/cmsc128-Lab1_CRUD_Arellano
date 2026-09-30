import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ForgotPassword({ switchToLogin }) {
  // Track what the user types into the recovery email input box
  const [email, setEmail] = useState('')
  // Keep track of whether the server is currently processing the recovery request
  const [loading, setLoading] = useState(false)
  // Store any error message if the recovery request fails
  const [errorMessage, setErrorMessage] = useState('')
  // Store a success message to let the user know the recovery link was dispatched
  const [successMessage, setSuccessMessage] = useState('')

  // Send a password reset request to Supabase for the specified email address
  const handlePasswordReset = async (e) => {
    // Stop the page from refreshing automatically on form submission
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    // Request Supabase to send a password recovery email to the user
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })

    // If the server rejects the request, store the error text
    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
    } else {
      // If successful, display a clear confirmation message to the user
      setLoading(false)
      setSuccessMessage('Password recovery instructions have been sent to the email address.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background glowing effects to keep the consistent dark mode style */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[500px] h-[500px] rounded-full bg-up-maroon/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[500px] h-[500px] rounded-full bg-up-green/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-700/50 relative z-10">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-700 flex items-center justify-center font-black text-white text-xl mx-auto shadow-lg mb-3">
            🔑
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Reset Password</h1>
          <p className="text-slate-400 text-sm mt-1">Enter registered email to receive recovery instructions</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-900/50 rounded-xl text-red-400 text-sm font-semibold">
            ⚠ {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-950/50 border border-emerald-900/50 rounded-xl text-emerald-400 text-sm font-semibold">
            ✓ {successMessage}
          </div>
        )}

        <form onSubmit={handlePasswordReset} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-1.5 text-slate-400">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full border border-slate-700 bg-slate-950/50 text-slate-100 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-slate-900 transition-all shadow-inner placeholder-slate-600"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-600 to-yellow-700 text-white font-black py-3.5 rounded-xl shadow-lg hover:shadow-yellow-600/20 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
          >
            {loading ? 'Sending Recovery Link...' : 'Send Reset Instructions'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <button 
            onClick={switchToLogin} 
            className="text-slate-400 hover:text-white font-bold transition-colors"
          >
            ← Back to Sign In
          </button>
        </div>

      </div>
    </div>
  )
}