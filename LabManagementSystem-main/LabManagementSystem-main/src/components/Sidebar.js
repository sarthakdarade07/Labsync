import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Monitor, Users, Calendar, CalendarDays, AlertTriangle, Settings, Hexagon, ChevronLeft, ChevronRight, Power } from 'lucide-react';

const NAV = [
  { to: '/dashboard',   icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/labs',        icon: <Monitor size={18} />, label: 'Labs & PCs' },
  { to: '/batches',     icon: <Users size={18} />, label: 'Batches' },
  { to: '/schedule',    icon: <Calendar size={18} />, label: 'Schedule' },
  { to: '/timetable',   icon: <CalendarDays size={18} />, label: 'Timetable' },
  { to: '/clashes',     icon: <AlertTriangle size={18} />, label: 'Clash Detection' },
];
const ADMIN_NAV = [
  { to: '/admin',      icon: <Settings size={18} />, label: 'Admin Panel' },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const w = collapsed ? 64 : 220;

  return (
    <aside style={{ ...styles.aside, width: w, minWidth: w }}>
      <div style={styles.top}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '0 14px' : '0 20px', overflow: 'hidden' }}>
          <span style={{ color: 'var(--accent)', flexShrink: 0, display: 'flex' }}><Hexagon size={24} /></span>
          {!collapsed && <span style={styles.brand}>LabSync</span>}
        </div>
        <button onClick={() => setCollapsed(c => !c)} style={styles.collapseBtn} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}
        </button>
      </div>

      <nav style={styles.nav}>
        <p style={{ ...styles.navSection, opacity: collapsed ? 0 : 1 }}>Navigation</p>
        {NAV.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.activeLink : {}) })}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
        {isAdmin && (
          <>
            <p style={{ ...styles.navSection, marginTop: 16, opacity: collapsed ? 0 : 1 }}>Admin</p>
            {ADMIN_NAV.map(({ to, icon, label }) => (
              <NavLink key={to} to={to} style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.activeLink : {}) })}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div style={styles.bottom}>
        {!collapsed && (
          <div style={styles.userInfo}>
            <div style={styles.avatar}>{user?.name?.[0] ?? 'U'}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', fontFamily: 'var(--mono)', letterSpacing: 0.5 }}>{user?.role}</div>
            </div>
          </div>
        )}
        <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
          <span style={{ display: 'flex', alignItems: 'center' }}><Power size={16}/></span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

const styles = {
  aside: { background: 'var(--card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, transition: 'width 0.25s ease', overflow: 'hidden', flexShrink: 0 },
  top: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', borderBottom: '1px solid var(--border)', minHeight: 64 },
  brand: { fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: 'var(--accent)', letterSpacing: 1, whiteSpace: 'nowrap' },
  collapseBtn: { background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 6, width: 24, height: 24, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0 },
  nav: { flex: 1, padding: '16px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 },
  navSection: { fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text3)', padding: '4px 10px', marginBottom: 4, transition: 'opacity 0.2s' },
  link: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, fontSize: 14, color: 'var(--text2)', transition: 'all 0.15s', whiteSpace: 'nowrap', overflow: 'hidden' },
  activeLink: { background: 'rgba(59,130,246,0.12)', color: 'var(--accent)', fontWeight: 600 },
  bottom: { padding: '12px 10px', borderTop: '1px solid var(--border)' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', marginBottom: 8 },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text3)', fontSize: 13, transition: 'all 0.15s' },
};
