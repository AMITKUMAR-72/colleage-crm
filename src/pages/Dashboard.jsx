import { useState, useEffect } from 'react'
import { createWebSocketClient } from '../services/websocketService'
import {
  BarChart3, Users, TrendingUp, AlertCircle, CheckCircle,
  Send, Database, Activity, LogOut, Settings, Bell, User,
  Phone, Mail, MapPin, GraduationCap, Globe, Calendar,
  DollarSign, Target, Award, ShieldCheck, Clock, XCircle
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts'


function Dashboard({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState('lead-form')
  const [leadForm, setLeadForm] = useState({
    name: '',
    phone: '',
    program: '',
    source: '',
    gmail: '',
    city: ''
  })
  const [leadSubmitted, setLeadSubmitted] = useState(false)
  const [submittedLead, setSubmittedLead] = useState(null)
  const [apiStatus, setApiStatus] = useState({
    connected: false,
    lastSync: new Date().toLocaleTimeString(),
    totalSynced: 1247,
    pendingSync: 3
  })

  useEffect(() => {
    const client = createWebSocketClient((update) => {
      console.log('[DashboardWS] Update received:', update)
      setApiStatus(prev => ({
        ...prev,
        lastSync: new Date().toLocaleTimeString(),
        totalSynced: prev.totalSynced + 1
      }))
    })

    client.onConnect = () => {
      setApiStatus(prev => ({ ...prev, connected: true }))
    }

    client.onDisconnect = () => {
      setApiStatus(prev => ({ ...prev, connected: false }))
    }

    client.activate()

    return () => {
      client.deactivate()
    }
  }, [])

  const handleLeadSubmit = (e) => {
    e.preventDefault()
    if (!leadForm.name || !leadForm.phone || !leadForm.program || !leadForm.source) {
      alert('Please fill all required fields')
      return
    }

    const newLead = {
      ...leadForm,
      id: 'LD-' + Date.now(),
      createdAt: new Date().toLocaleString(),
      status: 'New'
    }

    setSubmittedLead(newLead)
    setLeadSubmitted(true)

    // Reset form
    setLeadForm({
      name: '',
      phone: '',
      program: '',
      source: '',
      gmail: '',
      city: ''
    })

    // Auto-update API sync status
    setApiStatus(prev => ({
      ...prev,
      totalSynced: prev.totalSynced + 1,
      lastSync: new Date().toLocaleTimeString()
    }))
  }

  const sections = [
    { id: 'dashboard', name: 'Live Dashboard', icon: BarChart3 },
    { id: 'lead-form', name: 'Lead Form', icon: Send },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-72 glass-card m-4 rounded-2xl p-6 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg">Raffles</h1>
            <p className="text-xs text-slate-400">University CRM</p>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeSection === section.id
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
            >
              <section.icon className="w-5 h-5" />
              <span className="font-medium">{section.name}</span>
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/20 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        {/* Header */}
        <div className="glass-card rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {sections.find(s => s.id === activeSection)?.name}
            </h2>
            <p className="text-slate-400 text-sm">Welcome back, {user?.name}!</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full">
              <div className={`w-2 h-2 rounded-full ${apiStatus.connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-xs text-slate-400">{apiStatus.connected ? 'Live' : 'Offline'}</span>
            </div>
            <button className="relative p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors">
              <Bell className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Section Content */}
        {activeSection === 'lead-form' && (
          <LeadFormSection
            leadForm={leadForm}
            setLeadForm={setLeadForm}
            onSubmit={handleLeadSubmit}
            leadSubmitted={leadSubmitted}
            submittedLead={submittedLead}
            onClearSubmission={() => setLeadSubmitted(false)}
          />
        )}

        {activeSection === 'dashboard' && (
          <DashboardSection />
        )}
      </main>
    </div>
  )
}

// Dashboard Section with Refactored Graphs
function DashboardSection() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const { DashboardService } = await import('../services/dashboardService');
      const data = await DashboardService.getAdminStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const client = createWebSocketClient((update) => {
      console.log('[DashboardWS] Received update, refreshing stats...');
      fetchStats();
    });

    client.activate();
    return () => client.deactivate();
  }, []);

  if (loading || !stats) {
    return <div className="text-white p-8 animate-pulse">Initializing real-time analytics...</div>;
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#06B6D4'];

  return (
    <div className="space-y-6 pb-10">
      {/* 5th Section: Global Summary (Total Leads or Total Applicant) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Leads</p>
              <h3 className="text-4xl font-black text-white">{stats.totalLeads.toLocaleString()}</h3>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center">
              <Award className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Applicants</p>
              <h3 className="text-4xl font-black text-white">{stats.totalApplicants.toLocaleString()}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1st Section: Lead Cycle (Lead vs Applicant ratio) */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Lead Conversion Cycle
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.leadCycle}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                <Area type="monotone" dataKey="applicants" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorApps)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2nd Section: Campaign Source Lead Count (Pillar graph) */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            Top Campaign Sources
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.campaignStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#1e293b'}}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                />
                <Legend />
                <Bar dataKey="leads" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="applicants" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3rd Section: City Wise (Circle graph) */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-400" />
            Geographic Distribution
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.cityStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="count"
                  nameKey="city"
                >
                  {stats.cityStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                />
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4th Section: Daily Leads Volume & Daily Conversion */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Daily Performance Trend
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="conversions" stroke="#ec4899" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
