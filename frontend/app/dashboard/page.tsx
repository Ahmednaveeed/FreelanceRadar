'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Project = {
  id: string
  user_id: string
  title: string
  description: string | null
  tech_stack: string | null
  created_at: string
}

const RadarLogo = () => (
  <div style={{ position: 'relative', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="radar-ring" style={{ position: 'absolute', width: 12, height: 12, borderRadius: '50%', border: '1.5px solid rgba(16,185,129,0.7)' }} />
    <div className="radar-ring-2" style={{ position: 'absolute', width: 12, height: 12, borderRadius: '50%', border: '1.5px solid rgba(16,185,129,0.5)' }} />
    <div className="radar-ring-3" style={{ position: 'absolute', width: 12, height: 12, borderRadius: '50%', border: '1.5px solid rgba(16,185,129,0.3)' }} />
    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', position: 'relative', zIndex: 10 }} />
  </div>
)

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 14,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', outline: 'none', fontFamily: 'var(--font-inter)', transition: 'border 0.2s ease'
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: 6, letterSpacing: 0.5
}

const sectionStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 20, padding: 28, marginBottom: 20
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [runsUsed, setRunsUsed] = useState(0)
  const [runsLimit, setRunsLimit] = useState(3)
  const [jobHistory, setJobHistory] = useState<any[]>([])
  const [drawerTab, setDrawerTab] = useState<'history' | 'feedback'>('history')
  const [projects, setProjects] = useState<Project[]>([])
  const [projectLoading, setProjectLoading] = useState(false)
  const [projectError, setProjectError] = useState('')
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    techStack: ''
  })

  const [form, setForm] = useState({
    name: '', niche: '', experience_level: 'mid',
    preferred_rate_min: '', preferred_rate_max: '',
    preferred_job_type: 'both', preferred_job_size: 'medium',
    availability: '', skills: '', keywords_include: '', keywords_exclude: '',
    writing_samples: '', notification_email: ''
  })

  const loadProjects = async (userId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select('id, user_id, title, description, tech_stack, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setProjects(data as Project[])
    }
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setUser(user)

      const { data: profile, error: profileError } = await supabase
        .from('profiles').select('*').eq('user_id', user.id).single()

      console.log('[Profile fetch] user.id:', user.id)
      console.log('[Profile fetch] data:', profile)
      console.log('[Profile fetch] error:', profileError)

      await loadProjects(user.id)

      if (profile) {
        setRunsUsed(profile.runs_used ?? 0)
        setRunsLimit(profile.runs_limit ?? 3)
        setForm({
          name: profile.name || user.user_metadata?.full_name || '',
          niche: profile.niche || '',
          experience_level: profile.experience_level || 'mid',
          preferred_rate_min: profile.preferred_rate_min !== null && profile.preferred_rate_min !== undefined ? String(profile.preferred_rate_min) : '',
          preferred_rate_max: profile.preferred_rate_max !== null && profile.preferred_rate_max !== undefined ? String(profile.preferred_rate_max) : '',
          preferred_job_type: profile.preferred_job_type || 'both',
          preferred_job_size: profile.preferred_job_size || 'medium',
          availability: profile.availability || '',
          skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills || ''),
          keywords_include: Array.isArray(profile.keywords_include) ? profile.keywords_include.join(', ') : (profile.keywords_include || ''),
          keywords_exclude: Array.isArray(profile.keywords_exclude) ? profile.keywords_exclude.join(', ') : (profile.keywords_exclude || ''),
          writing_samples: profile.writing_samples || '',
          notification_email: profile.notification_email || user.email || ''
        })
      } else {
        setForm((prev) => ({
          ...prev,
          name: user.user_metadata?.full_name || '',
          notification_email: user.email || ''
        }))
      }
    }
    getUser()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    const skillsArr = form.skills.split(',').map(s => s.trim()).filter(Boolean)
    const includeArr = form.keywords_include.split(',').map(s => s.trim()).filter(Boolean)
    const excludeArr = form.keywords_exclude.split(',').map(s => s.trim()).filter(Boolean)

    // Step 1: Upsert into custom users table first (profiles.user_id FK → users.id)
    const { error: userUpsertError } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      name: form.name || user.user_metadata?.full_name || user.email,
    }, { onConflict: 'id' })

    if (userUpsertError) {
      console.error('[Save] users upsert error:', userUpsertError)
      setSaving(false)
      setSaveError(userUpsertError.message)
      setTimeout(() => setSaveError(''), 8000)
      return
    }

    // Step 2: Build full profile payload (all columns that exist in profiles table)
    const profilePayload = {
      user_id: user.id,
      name: form.name,
      email: user.email,
      niche: form.niche,
      experience_level: form.experience_level,
      preferred_rate_min: form.preferred_rate_min ? Number(form.preferred_rate_min) : null,
      preferred_rate_max: form.preferred_rate_max ? Number(form.preferred_rate_max) : null,
      preferred_job_type: form.preferred_job_type,
      preferred_job_size: form.preferred_job_size,
      availability: form.availability,
      skills: skillsArr,
      keywords_include: includeArr,
      keywords_exclude: excludeArr,
      writing_samples: form.writing_samples,
      notification_email: form.notification_email,
      updated_at: new Date().toISOString()
    }

    // Check if a profile row already exists for this user
    const { data: existingProfile } = await supabase
      .from('profiles').select('id').eq('user_id', user.id).single()

    let profileError = null
    if (existingProfile) {
      // Update existing profile row
      const { error } = await supabase.from('profiles')
        .update(profilePayload)
        .eq('id', existingProfile.id)
      profileError = error
    } else {
      // Insert new profile — profiles.id has no default, set it to user.id
      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        ...profilePayload,
        runs_used: 0,
        runs_limit: 3,
        is_active: true
      })
      profileError = error
    }

    console.log('[Save] profile payload:', profilePayload)
    console.log('[Save] existing profile:', existingProfile)
    console.log('[Save] profile error:', profileError)

    setSaving(false)
    if (profileError) {
      setSaveError(profileError.message)
      setTimeout(() => setSaveError(''), 8000)
    } else {
      setSaved(true)
      setSaveError('')
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleAddProject = async () => {
    if (!user) return

    if (projects.length >= 3) {
      setProjectError('You can only add up to 3 projects.')
      return
    }

    const title = projectForm.title.trim()
    if (!title) {
      setProjectError('Project title is required.')
      return
    }

    setProjectLoading(true)
    setProjectError('')

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title,
        description: projectForm.description.trim() || null,
        tech_stack: projectForm.techStack.trim() || null
      })
      .select('id, user_id, title, description, tech_stack, created_at')
      .single()

    if (error) {
      setProjectError(error.message)
      setProjectLoading(false)
      return
    }

    if (data) {
      setProjects((prev) => [data as Project, ...prev])
      setProjectForm({ title: '', description: '', techStack: '' })
    }

    setProjectLoading(false)
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!user) return

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id)

    if (error) {
      setProjectError(error.message)
      return
    }

    setProjects((prev) => prev.filter((project) => project.id !== projectId))
  }

  const selectStyle = (val: string): React.CSSProperties => ({
    ...inputStyle,
    backgroundColor: 'rgba(30,30,30,0.9)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#ffffff',
    appearance: 'none' as any,
    cursor: 'pointer'
  })

  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh' }}>

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <RadarLogo />
          <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 18 }}>
            Freelance<span className="gradient-text">Radar</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>{user?.email}</div>
          <button onClick={() => setDrawerOpen(true)}
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '8px 14px', color: '#fff', cursor: 'pointer', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-inter)'
            }}>
            <span>☰</span> Menu
          </button>
        </div>
      </nav>

      {/* RUNS USAGE BANNER */}
      <div style={{ maxWidth: 720, margin: '80px auto 0', padding: '0 24px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '16px 24px',
          marginBottom: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>🔍 Free AI Scan Runs</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: runsUsed < runsLimit ? '#10b981' : '#f87171' }}>
              {runsUsed} of {runsLimit} used
            </span>
          </div>
          {/* Segmented progress bar */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {Array.from({ length: runsLimit }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 8, borderRadius: 4,
                background: i < runsUsed ? '#10b981' : 'rgba(255,255,255,0.1)',
                transition: 'background 0.3s ease'
              }} />
            ))}
          </div>
          <p style={{ fontSize: 13, color: runsUsed < runsLimit ? '#666' : '#f87171', margin: 0 }}>
            {runsUsed < runsLimit
              ? 'Each run scans Upwork every 30 mins and sends matching jobs to your email.'
              : "You've used all your free runs. Join the waitlist for unlimited access."
            }
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 24px 60px' }}>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
              Your Profile
            </h1>
            <p style={{ color: '#6b7280', fontSize: 14 }}>
              Fill in your details — our AI uses this to find and score jobs for you.
            </p>
          </div>

          {/* SECTION 1 — BASIC INFO */}
          <div style={sectionStyle}>
            <h3 style={{ fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 700, marginBottom: 20, color: '#10b981' }}>
              👤 Basic Info
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>FULL NAME</label>
                <input style={inputStyle} placeholder="John Doe" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(16,185,129,0.5)'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
              <div>
                <label style={labelStyle}>YOUR NICHE / TITLE</label>
                <input style={inputStyle} placeholder="Full Stack Web Developer" value={form.niche}
                  onChange={e => setForm({ ...form, niche: e.target.value })}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(16,185,129,0.5)'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
              <div>
                <label style={labelStyle}>NOTIFICATION EMAIL</label>
                <input style={inputStyle} type="email" placeholder="your@email.com" value={form.notification_email}
                  onChange={e => setForm({ ...form, notification_email: e.target.value })}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(16,185,129,0.5)'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
            </div>
          </div>

          {/* SECTION 2 — SKILLS */}
          <div style={sectionStyle}>
            <h3 style={{ fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 700, marginBottom: 20, color: '#10b981' }}>
              🛠 Skills & Expertise
            </h3>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>SKILLS (comma separated)</label>
              <input style={inputStyle} placeholder="React, Node.js, TypeScript, MongoDB" value={form.skills}
                onChange={e => setForm({ ...form, skills: e.target.value })}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(16,185,129,0.5)'}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>EXPERIENCE LEVEL</label>
                <select style={selectStyle(form.experience_level)} value={form.experience_level}
                  onChange={e => setForm({ ...form, experience_level: e.target.value })}>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>AVAILABILITY</label>
                <select style={selectStyle(form.availability)} value={form.availability}
                  onChange={e => setForm({ ...form, availability: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="full-time">Full Time (40hrs/wk)</option>
                  <option value="part-time">Part Time (20hrs/wk)</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3 — RATES */}
          <div style={sectionStyle}>
            <h3 style={{ fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 700, marginBottom: 20, color: '#10b981' }}>
              💰 Rate & Job Preferences
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>MIN HOURLY RATE ($)</label>
                <input style={inputStyle} type="number" placeholder="20" value={form.preferred_rate_min}
                  onChange={e => setForm({ ...form, preferred_rate_min: e.target.value })}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(16,185,129,0.5)'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
              <div>
                <label style={labelStyle}>MAX HOURLY RATE ($)</label>
                <input style={inputStyle} type="number" placeholder="50" value={form.preferred_rate_max}
                  onChange={e => setForm({ ...form, preferred_rate_max: e.target.value })}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(16,185,129,0.5)'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>JOB TYPE</label>
                <select style={selectStyle(form.preferred_job_type)} value={form.preferred_job_type}
                  onChange={e => setForm({ ...form, preferred_job_type: e.target.value })}>
                  <option value="both">Both</option>
                  <option value="hourly">Hourly Only</option>
                  <option value="fixed">Fixed Price Only</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>JOB SIZE</label>
                <select style={selectStyle(form.preferred_job_size)} value={form.preferred_job_size}
                  onChange={e => setForm({ ...form, preferred_job_size: e.target.value })}>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="any">Any Size</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 4 — KEYWORDS */}
          <div style={sectionStyle}>
            <h3 style={{ fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 700, marginBottom: 20, color: '#10b981' }}>
              🔍 Job Filters
            </h3>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>KEYWORDS TO INCLUDE (comma separated)</label>
              <input style={inputStyle} placeholder="React, API, dashboard" value={form.keywords_include}
                onChange={e => setForm({ ...form, keywords_include: e.target.value })}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(16,185,129,0.5)'}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
            <div>
              <label style={labelStyle}>KEYWORDS TO EXCLUDE (comma separated)</label>
              <input style={inputStyle} placeholder="WordPress, Shopify" value={form.keywords_exclude}
                onChange={e => setForm({ ...form, keywords_exclude: e.target.value })}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(16,185,129,0.5)'}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
          </div>

          {/* SECTION 5 — WRITING SAMPLE */}
          <div style={sectionStyle}>
            <h3 style={{ fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#10b981' }}>
              ✍️ Writing Sample
            </h3>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
              Paste a sample proposal or intro. AI uses this to match your writing style.
            </p>
            <textarea style={{ ...inputStyle, minHeight: 120, resize: 'vertical' as any }}
              placeholder="I noticed you need a React developer with experience in..."
              value={form.writing_samples}
              onChange={e => setForm({ ...form, writing_samples: e.target.value })}
              onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(16,185,129,0.5)'}
              onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255,255,255,0.1)'} />
          </div>

          {/* SECTION 6 — PROJECTS */}
          <div style={sectionStyle}>
            <h3 style={{ fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#10b981' }}>
              📁 Portfolio / Projects
            </h3>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
              Add up to 3 projects to improve matching quality.
            </p>

            <div style={{ display: 'grid', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>PROJECT TITLE</label>
                <input
                  style={inputStyle}
                  placeholder="SaaS Analytics Dashboard"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm((prev) => ({ ...prev, title: e.target.value }))}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(16,185,129,0.5)'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              <div>
                <label style={labelStyle}>DESCRIPTION (OPTIONAL)</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 86, resize: 'vertical' as any }}
                  placeholder="Built a multi-tenant dashboard with charts, auth, and role-based permissions."
                  value={projectForm.description}
                  onChange={(e) => setProjectForm((prev) => ({ ...prev, description: e.target.value }))}
                  onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(16,185,129,0.5)'}
                  onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              <div>
                <label style={labelStyle}>TECH STACK (COMMA SEPARATED)</label>
                <input
                  style={inputStyle}
                  placeholder="React, TypeScript, Supabase"
                  value={projectForm.techStack}
                  onChange={(e) => setProjectForm((prev) => ({ ...prev, techStack: e.target.value }))}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(16,185,129,0.5)'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddProject}
              disabled={projectLoading || projects.length >= 3}
              style={{
                background: 'rgba(16,185,129,0.14)',
                border: '1px solid rgba(16,185,129,0.35)',
                borderRadius: 10,
                color: '#10b981',
                fontFamily: 'var(--font-inter)',
                fontSize: 13,
                fontWeight: 700,
                padding: '10px 14px',
                cursor: projectLoading || projects.length >= 3 ? 'not-allowed' : 'pointer',
                opacity: projectLoading || projects.length >= 3 ? 0.65 : 1,
                marginBottom: 16
              }}
            >
              {projectLoading ? 'Adding...' : '+ Add Project'}
            </button>

            {projectError && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 13,
                color: '#f87171',
                marginBottom: 14
              }}>
                {projectError}
              </div>
            )}

            <div style={{ display: 'grid', gap: 10 }}>
              {projects.map((project) => (
                <div key={project.id} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: 14
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{project.title}</div>
                      {project.description && (
                        <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.55, marginBottom: 8 }}>
                          {project.description}
                        </p>
                      )}
                      {project.tech_stack && (
                        <p style={{ fontSize: 12, color: '#6b7280' }}>
                          Tech: {project.tech_stack}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label="Delete project"
                      onClick={() => handleDeleteProject(project.id)}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 8,
                        color: '#f87171',
                        width: 28,
                        height: 28,
                        cursor: 'pointer',
                        fontSize: 15,
                        lineHeight: 1
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              {projects.length === 0 && (
                <p style={{ color: '#6b7280', fontSize: 13 }}>No projects added yet.</p>
              )}
            </div>
          </div>

          {/* SAVE BUTTON */}
          <button onClick={handleSave} disabled={saving} className="btn-primary"
            style={{
              width: '100%', padding: '14px 0', borderRadius: 12, fontSize: 16,
              fontWeight: 700, color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1, fontFamily: 'var(--font-inter)'
            }}>
            {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Profile →'}
          </button>

          {saveError && (
            <div style={{
              marginTop: 12, padding: '12px 16px', borderRadius: 10,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', fontSize: 13
            }}>
              ⚠️ Save failed: {saveError}
            </div>
          )}

        </motion.div>
      </div>

      {/* SIDE DRAWER */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, backdropFilter: 'blur(4px)' }} />

            {/* Drawer */}
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, width: 340, zIndex: 101,
                background: '#0f0f0f', borderLeft: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', flexDirection: 'column'
              }}>

              {/* Drawer Header */}
              <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 16 }}>Menu</span>
                <button onClick={() => setDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 20 }}>✕</button>
              </div>

              {/* Drawer Tabs */}
              <div style={{ padding: '16px 24px', flex: 1, overflowY: 'auto' }}>

                {/* Tab Buttons */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  {[['history', '📋 Job History'], ['feedback', '💬 Feedback']].map(([key, label]) => (
                    <button key={key} onClick={() => setDrawerTab(key as any)}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: 'none', cursor: 'pointer', fontFamily: 'var(--font-inter)',
                        background: drawerTab === key ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                        color: drawerTab === key ? '#10b981' : '#6b7280',
                        borderBottom: drawerTab === key ? '2px solid #10b981' : '2px solid transparent'
                      }}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Job History Tab */}
                {drawerTab === 'history' && (
                  <div>
                    {jobHistory.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                        <p style={{ color: '#4b5563', fontSize: 13 }}>No job matches yet.</p>
                        <p style={{ color: '#374151', fontSize: 12, marginTop: 4 }}>Save your profile to start receiving matches.</p>
                      </div>
                    ) : (
                      jobHistory.map((job, i) => (
                        <div key={i} style={{
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                          borderRadius: 12, padding: 16, marginBottom: 12
                        }}>
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{job.title}</div>
                          <div style={{ fontSize: 12, color: '#10b981' }}>⭐ {job.score}% match</div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Feedback Tab */}
                {drawerTab === 'feedback' && (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: 32, marginBottom: 16 }}>💬</div>
                    <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                      Have a suggestion or found a bug? We'd love to hear from you.
                    </p>
                    <a
                      href="https://mail.google.com/mail/?view=cm&to=ahmedbinnaveed123%40gmail.com&su=Feedback+for+FreelanceRadar"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block', padding: '12px 24px', borderRadius: 10,
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none'
                      }}>
                      Send Feedback →
                    </a>
                  </div>
                )}
              </div>

              {/* Logout */}
              <div style={{ padding: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={handleLogout}
                  style={{
                    width: '100%', padding: '12px 0', borderRadius: 10, fontSize: 14, fontWeight: 600,
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                    color: '#f87171', cursor: 'pointer', fontFamily: 'var(--font-inter)'
                  }}>
                  🚪 Logout
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </main>
  )
}