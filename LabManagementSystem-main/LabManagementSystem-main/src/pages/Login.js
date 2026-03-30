import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Hexagon } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 500));
    const res = await login(form.username, form.password);
    setLoading(false);
    if (res.success) navigate('/dashboard');
    else setError(res.error);
  };

  return (
    <div style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.card} className="animate-in">
        <div style={styles.logo}>
          <div style={styles.logoIcon}><Hexagon size={36} fill="var(--accent)" color="white" /></div>
          <div>
            <div style={styles.logoTitle}>LabSync</div>
            <div style={styles.logoSub}>MIT-WPU · Dept. of CSE & Technology</div>
          </div>
        </div>

        <h1 style={styles.heading}>Sign in to continue</h1>
        <p style={styles.sub}>Laboratory Management System</p>

        <form onSubmit={handle} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              placeholder="e.g. admin"
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
            />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div style={styles.hint}>
          <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 8, fontFamily: 'var(--mono)', letterSpacing: 1 }}>DEMO CREDENTIALS</p>
          {[['admin','admin123','Admin'],['faculty','faculty123','Faculty'],['staff','staff123','Staff']].map(([u,p,r]) => (
            <div key={u} style={styles.cred} onClick={() => setForm({ username: u, password: p })}>
              <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: 12 }}>{u}</span>
              <span style={{ color: 'var(--text3)', fontSize: 11 }}>{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' },
  bg: { position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(195,18,18,0.12) 0%, transparent 70%)', pointerEvents: 'none' },
  card: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 420, position: 'relative', zIndex: 1, boxShadow: 'var(--shadow)' },
  logo: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 },
  logoIcon: { fontSize: 32, color: 'var(--accent)', lineHeight: 1 },
  logoTitle: { fontSize: 20, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text)' },
  logoSub: { fontSize: 11, color: 'var(--text3)', marginTop: 2 },
  heading: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
  sub: { color: 'var(--text3)', fontSize: 14, marginBottom: 28 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text2)', fontFamily: 'var(--mono)', letterSpacing: 0.5, textTransform: 'uppercase' },
  error: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', borderRadius: 8, padding: '8px 12px', fontSize: 13 },
  hint: { marginTop: 28, borderTop: '1px solid var(--border)', paddingTop: 20 },
  cred: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', marginBottom: 4, border: '1px solid transparent', transition: 'all 0.15s' },
};
