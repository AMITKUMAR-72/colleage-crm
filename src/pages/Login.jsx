import { useState } from 'react'
import { User, Lock, Crown, Headphones, BarChart3, Users, Building2, Sparkles } from 'lucide-react'

const roles = [
  { 
    id: 'admin', 
    name: 'Admin', 
    icon: Crown,
    description: 'Full system access',
    subtitle: 'Manage everything',
    className: 'role-admin'
  },
  { 
    id: 'counselor', 
    name: 'Counselor', 
    icon: Headphones,
    description: 'Lead management',
    subtitle: 'Connect & convert',
    className: 'role-counselor'
  },
  { 
    id: 'manager', 
    name: 'Manager', 
    icon: BarChart3,
    description: 'Reports & analytics',
    subtitle: 'Track performance',
    className: 'role-manager'
  },
  { 
    id: 'affiliate', 
    name: 'Affiliate', 
    icon: Users,
    description: 'Partner portal',
    subtitle: 'Earn commissions',
    className: 'role-affiliate'
  },
]

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username || !password || !selectedRole) {
      setError('Please fill all fields and select a role')
      return
    }

    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    onLogin({
      username,
      role: selectedRole,
      name: username.charAt(0).toUpperCase() + username.slice(1),
    })
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 premium-bg relative">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px] float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px] float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="glass-card p-10 w-full max-w-lg relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 mb-5 shadow-2xl shadow-purple-500/30 relative">
            <Building2 className="w-10 h-10 text-white" />
            <Sparkles className="w-5 h-5 text-yellow-300 absolute -top-1 -right-1" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Raffles University
          </h1>
          <p className="text-slate-400">CRM & ERP Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 block">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="input-field pl-12"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input-field pl-12"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-slate-300 block">Select Your Role</label>
            <div className="grid grid-cols-2 gap-4">
              {roles.map((role) => {
                const IconComponent = role.icon
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`role-card ${role.className} ${selectedRole === role.id ? 'selected' : ''} text-left`}
                  >
                    <div className="role-icon">
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-bold text-white text-lg mb-1">{role.name}</h3>
                    <p className="text-sm text-slate-300 mb-0.5">{role.description}</p>
                    <p className="text-xs text-slate-500">{role.subtitle}</p>
                    
                    {/* Selection Indicator */}
                    {selectedRole === role.id && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-white"></div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-sm text-slate-500">
            © 2024 Raffles University. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
