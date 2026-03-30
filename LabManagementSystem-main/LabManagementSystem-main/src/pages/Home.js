import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Monitor, Cpu, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Home() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await api.get('/schedules/public');
        if (res.data?.success) {
          setSchedules(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load public schedules", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, []);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Group by day Name -> Lab -> array of sessions
  const grouped = {};
  daysOfWeek.forEach(d => { grouped[d] = {}; });
  
  schedules.forEach(s => {
      const day = s.dayName;
      const lab = s.labName;
      if (!grouped[day]) grouped[day] = {};
      if (!grouped[day][lab]) grouped[day][lab] = [];
      grouped[day][lab].push(s);
  });

  return (
    <div style={styles.container} className="animate-in">
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.icon}></div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, color: 'var(--text)' }}>LabSync</h1>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Public Schedule Portal</div>
          </div>
        </div>
        {user ? (
          <Link to="/dashboard" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', height: 40, padding: '0 24px', fontWeight: 600, gap: 8 }}>
            Dashboard <ChevronRight size={18} />
          </Link>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', height: 40, padding: '0 24px', fontWeight: 600, gap: 8 }}>
            Admin / Staff Login <ChevronRight size={18} />
          </Link>
        )}
      </header>

      <main style={styles.main}>
        {/* Modern Hero Section */}
        <div style={styles.hero}>
          <div style={styles.heroContent}>
            <div style={styles.badge}>Welcome to LabSync</div>
            <h2 style={styles.heroTitle}>Discover and Plan Your<br/>Lab Sessions Efficiently.</h2>
            <p style={styles.heroSubtitle}>Explore the weekly lab timetable, track ongoing sessions, and access upcoming availability across different labs.</p>
          </div>
          <div style={styles.statsContainer}>
            <div style={styles.statBox}>
              <div style={styles.statIcon}><Calendar size={28} color="var(--accent)" /></div>
              <div><div style={styles.statValue}>{schedules.length}</div><div style={styles.statLabel}>Weekly Sessions</div></div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statIcon}><Cpu size={28} color="var(--success)" /></div>
              <div><div style={styles.statValue}>100%</div><div style={styles.statLabel}>System Uptime</div></div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 40, borderBottom: '2px solid var(--border)', paddingBottom: 16 }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text)' }}>Weekly Lab Timetable</h3>
          <p style={{ color: 'var(--text2)', fontSize: 15 }}>Browse the scheduled sessions grouped by day and laboratory.</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', animation: 'pulse 1.5s infinite' }}><Calendar size={40} opacity={0.5} /></div>
            <div style={{ marginTop: 16, fontSize: 16, fontWeight: 500 }}>Loading schedule metadata...</div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', opacity: 0.5, marginBottom: 16 }}><Monitor size={40} /></div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>No sessions scheduled yet.</div>
            <p style={{ marginTop: 8 }}>Check back later or contact your administrator.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {daysOfWeek.map(day => {
              const labs = Object.keys(grouped[day] || {});
              if (labs.length === 0) return null;
              
              return (
                <div key={day} className="card" style={{ borderTop: '4px solid var(--accent)' }}>
                  <h3 style={{ margin: '0 0 24px', fontSize: 22, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ padding: '6px 12px', background: 'var(--accent)', color: '#fff', borderRadius: 8, fontSize: 14 }}>{day}</span>
                    <span>Schedule</span>
                  </h3>
                  <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                    {labs.map(lab => {
                      const sessions = grouped[day][lab].sort((a,b) => (a.startTime || '').localeCompare(b.startTime || ''));
                      
                      return (
                        <div key={lab} style={{ background: 'var(--bg)', borderRadius: 16, padding: 20, border: '1px solid var(--border)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ background: 'rgba(195,18,18,0.1)', color: 'var(--accent)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Monitor size={18} />
                            </span>
                            {lab}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {sessions.map(s => (
                              <div key={s.scheduleId} style={{ background: 'var(--bg2)', padding: 14, borderRadius: 10, borderLeft: '4px solid var(--accent)', transition: 'transform 0.2s ease', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
                                <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: 15 }}>{s.subjectCode} <span style={{ color: 'var(--text3)', fontWeight: 400 }}>•</span> {s.batchName}</div>
                                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {s.staffName}
                                </div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', padding: '6px 10px', borderRadius: 6 }}>
                                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>◷ {s.startTime?.substring(0,5)} - {s.endTime?.substring(0,5)}</span>
                                  {s.slotLabel && <span style={{ color: 'var(--text3)', background: 'var(--border)', padding: '2px 6px', borderRadius: 4 }}>{s.slotLabel}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: 'var(--bg)' },
  header: { background: 'var(--bg2)', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 },
  logo: { display: 'flex', alignItems: 'center', gap: 12 },
  icon: { width: 36, height: 36, background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)', borderRadius: 10, boxShadow: '0 4px 10px rgba(195,18,18,0.3)' },
  main: { padding: '40px 20px', maxWidth: 1200, margin: '0 auto' },
  hero: { display: 'flex', flexDirection: 'column', gap: 32, padding: '40px', background: 'linear-gradient(145deg, var(--card) 0%, var(--bg) 100%)', borderRadius: 24, border: '1px solid var(--border)', marginBottom: 40, boxShadow: 'var(--shadow)', position: 'relative', overflow: 'hidden' },
  heroContent: { maxWidth: 600, zIndex: 1 },
  badge: { display: 'inline-flex', padding: '6px 14px', borderRadius: 20, background: 'rgba(195,18,18,0.1)', color: 'var(--accent)', fontSize: 13, fontWeight: 700, marginBottom: 16, letterSpacing: 0.5, border: '1px solid rgba(195,18,18,0.2)' },
  heroTitle: { fontSize: 44, fontWeight: 800, color: 'var(--text)', lineHeight: 1.1, marginBottom: 16, letterSpacing: -1 },
  heroSubtitle: { fontSize: 18, color: 'var(--text2)', lineHeight: 1.5 },
  statsContainer: { display: 'flex', gap: 20, zIndex: 1, flexWrap: 'wrap' },
  statBox: { background: 'var(--bg2)', border: '1px solid var(--border)', padding: '16px 24px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16, minWidth: 200, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  statIcon: { fontSize: 24, background: 'var(--bg)', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  statValue: { fontSize: 24, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--mono)', lineHeight: 1 },
  statLabel: { fontSize: 13, color: 'var(--text3)', marginTop: 4, fontWeight: 500 }
};
