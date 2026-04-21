'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { BarChart2, FileText, Inbox, Search, Shield, Target } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 1) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' as const }
  })
}

const features = [
  { icon: Target, title: 'AI Job Matching', desc: 'Our AI reads every job post and scores it against your exact skills, rate, and preferences.' },
  { icon: FileText, title: 'Ready-Made Proposals', desc: 'Get a fully written, personalized proposal delivered with every match. Just copy and send.' },
  { icon: Inbox, title: 'Inbox Delivery', desc: 'No dashboard to check. Matches land directly in your email the moment they are posted.' },
  { icon: BarChart2, title: 'Client Intelligence', desc: 'See client spend, hire rate, and ratings before you even open the job.' },
  { icon: Search, title: 'Real-Time Scanning', desc: 'Jobs are scanned every 30 minutes so you are always first to apply.' },
  { icon: Shield, title: 'Privacy First', desc: 'We never store your Upwork credentials. Only your skills and preferences.' },
]

const steps = [
  { step: '01', title: 'Create Your Profile', desc: 'Tell us your skills, hourly rate, and job preferences. Takes 2 minutes.' },
  { step: '02', title: 'AI Learns Your Style', desc: 'Our AI maps your profile against thousands of active Upwork jobs.' },
  { step: '03', title: 'Receive Matches', desc: 'Get scored job matches + ready-to-send proposals straight to your inbox.' },
]

const RadarLogo = () => (
  <div style={{ position: 'relative', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="radar-ring" style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', border: '1.5px solid rgba(16,185,129,0.7)' }} />
    <div className="radar-ring-2" style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', border: '1.5px solid rgba(16,185,129,0.5)' }} />
    <div className="radar-ring-3" style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', border: '1.5px solid rgba(16,185,129,0.3)' }} />
    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', position: 'relative', zIndex: 10 }} />
  </div>
)

export default function LandingPage() {
  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <RadarLogo />
          <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px' }}>
            Freelance<span className="gradient-text">Radar</span>
          </span>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Link href="/auth">
            <button className="btn-primary" style={{
              padding: '10px 22px', borderRadius: 10, fontSize: 14,
              fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer'
            }}>
              Get Started Free
            </button>
          </Link>
        </motion.div>
      </nav>

      {/* HERO */}
      <section style={{
        maxWidth: 900, margin: '0 auto', padding: '160px 24px 100px',
        textAlign: 'center',
        background: 'radial-gradient(ellipse at top, rgba(16,185,129,0.12) 0%, transparent 60%)'
      }}>
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
          <span style={{
            display: 'inline-block', padding: '6px 16px', borderRadius: 999,
            fontSize: 12, fontWeight: 600, background: 'rgba(16,185,129,0.1)',
            color: '#34d399', border: '1px solid rgba(16,185,129,0.2)', marginBottom: 28
          }}>
            ⚡ AI-Powered Job Matching for Upwork Freelancers
          </span>
        </motion.div>

        <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={2}
          style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(42px, 8vw, 80px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 24 }}>
          Stop Hunting.<br />
          <span className="gradient-text glow-green-text">Start Landing.</span>
        </motion.h1>

        <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={3}
          style={{ fontSize: 18, color: '#9ca3af', maxWidth: 580, margin: '0 auto 40px', lineHeight: 1.7 }}>
          FreelanceRadar scans Upwork every 30 minutes, scores jobs against your profile,
          and delivers perfect matches with ready-to-send proposals — straight to your inbox.
        </motion.p>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}
          style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth">
            <button className="btn-primary glow-green" style={{
              padding: '14px 32px', borderRadius: 12, fontSize: 16,
              fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer'
            }}>
              Start Getting Jobs →
            </button>
          </Link>
          <button
            onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              padding: '14px 32px', borderRadius: 12, fontSize: 16, fontWeight: 600,
              color: '#9ca3af', background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={e => {
              (e.target as HTMLButtonElement).style.borderColor = 'rgba(16,185,129,0.4)'
              ;(e.target as HTMLButtonElement).style.color = '#fff'
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'
              ;(e.target as HTMLButtonElement).style.color = '#9ca3af'
            }}
          >
            See How It Works
          </button>
        </motion.div>

        {/* STATS */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}
          style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 60, flexWrap: 'wrap' }}>
          {[['30 min', 'Scan interval'], ['95%', 'Match accuracy'], ['2 min', 'Setup time']].map(([val, label]) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '16px 28px', textAlign: 'center', backdropFilter: 'blur(10px)'
            }}>
              <div className="gradient-text" style={{ fontFamily: 'var(--font-syne)', fontSize: 26, fontWeight: 800 }}>{val}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, marginBottom: 12 }}>
            How It <span className="gradient-text">Works</span>
          </h2>
          <p style={{ color: '#6b7280', fontSize: 16 }}>Three steps to never miss a perfect job again.</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {steps.map((s, i) => (
            <motion.div key={s.step}
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.2, duration: 0.6 }}
              style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20, padding: 32, position: 'relative', overflow: 'hidden'
              }}>
              <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 64, fontWeight: 900, color: 'rgba(255,255,255,0.03)' }}>{s.step}</div>
              <div style={{ color: '#10b981', fontSize: 12, fontWeight: 700, marginBottom: 12, letterSpacing: 1 }}>STEP {s.step}</div>
              <h3 style={{ fontFamily: 'var(--font-syne)', fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
              <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, marginBottom: 12 }}>
            Everything You <span className="gradient-text">Need</span>
          </h2>
          <p style={{ color: '#6b7280', fontSize: 16 }}>Built for serious freelancers who value their time.</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20, padding: 28, cursor: 'default'
              }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                color: '#34d399',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.16), rgba(16,185,129,0.06))',
                border: '1px solid rgba(16,185,129,0.35)'
              }}>
                <f.icon size={20} strokeWidth={2} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-syne)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px 100px' }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{
            border: '1px solid rgba(16,185,129,0.15)',
            borderRadius: 28, padding: '80px 40px', textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(10,10,10,0) 60%)'
          }}>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, marginBottom: 16 }}>
            Ready to Land More <span className="gradient-text">Clients?</span>
          </h2>
          <p style={{ color: '#6b7280', marginBottom: 36, fontSize: 16, maxWidth: 480, margin: '0 auto 36px' }}>
            Join freelancers who never miss a perfect job. Free to start, no credit card required.
          </p>
          <Link href="/auth">
            <button className="btn-primary glow-green" style={{
              padding: '16px 40px', borderRadius: 12, fontSize: 17,
              fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer'
            }}>
              Get Started Free →
            </button>
          </Link>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '28px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RadarLogo />
            <span style={{ fontSize: 13, color: '#4b5563' }}>FreelanceRadar © 2026</span>
          </div>
          <p style={{ fontSize: 12, color: '#374151' }}>Built for Upwork freelancers who work smart.</p>
        </div>
      </footer>

    </main>
  )
}