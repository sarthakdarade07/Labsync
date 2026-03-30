import React, { useState, useEffect } from 'react';
import { Building2, Monitor, Users, BarChart3, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import api from '../api/axios';
import { NOTIFICATIONS } from '../data/placeholders';

export default function Dashboard() {
  const [labs, setLabs] = useState([]);
  const [batches, setBatches] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // Fetch live lab data on load
    api.get('/labs').then(response => { if(response.data?.success) setLabs(response.data.data); });
    api.get('/batches').then(response => { if(response.data?.success) setBatches(response.data.data); });
    api.get('/schedules').then(response => { if(response.data?.success) setSessions(response.data.data); });
  }, []);

  const totalPCs = labs.reduce((a, l) => a + (l.totalComputers || 0), 0);
  const functionalPCs = labs.reduce((a, l) => a + (l.workingComputers || 0), 0);
  const utilization = totalPCs > 0 ? Math.round((functionalPCs / totalPCs) * 100) : 0;

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={styles.page} className="animate-in">
      <div style={styles.header}>
        <div>
          <div className="section-title" style={{ color: 'var(--accent)' }}>Overview</div>
          <h1 className="page-title">Dashboard</h1>
        </div>
        <div style={{ color: 'var(--text3)', fontSize: 13, fontFamily: 'var(--mono)', textAlign: 'right', background: 'var(--card)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
          {today}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Labs', value: labs.length, color: 'var(--accent)', icon: <Building2 size={24} /> },
          { label: 'Functional PCs', value: `${functionalPCs}/${totalPCs}`, color: 'var(--success)', icon: <Monitor size={24} /> },
          { label: 'Active Batches', value: batches.length, color: 'var(--accent3)', icon: <Users size={24} /> },
          { label: 'Utilization', value: `${utilization}%`, color: utilization < 85 ? 'var(--warning)' : 'var(--success)', icon: <BarChart3 size={24} /> },
        ].map(s => (
          <div key={s.label} className="card animate-in" style={{ borderLeft: `4px solid ${s.color}`, padding: '24px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div className="section-title" style={{ margin: 0, fontSize: 13 }}>{s.label}</div>
              <div style={{ display: 'flex', background: `${s.color}20`, padding: 8, borderRadius: 10, color: s.color }}>{s.icon}</div>
            </div>
            <div className="stat-number" style={{ color: 'var(--text)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Lab Status */}
        <div className="card">
          <div className="section-title">Live Lab Status</div>
          {labs.length === 0 && <div style={{color: 'var(--text3)'}}>Loading labs data from server...</div>}
          {labs.map(lab => {
            const name = lab.labName || lab.name || `Lab ${lab.id}`;
            const total = lab.totalComputers || 0;
            const func = lab.workingComputers || 0;
            const pct = total > 0 ? Math.round((func / total) * 100) : 0;
            const col = pct === 100 ? 'var(--success)' : pct >= 80 ? 'var(--accent)' : 'var(--warning)';

            return (
              <div key={lab.id} style={styles.labRow}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Monitor size={18} color="var(--text2)" /></div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{lab.location || 'Unknown Location'}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, color: 'var(--text)', fontFamily: 'var(--mono)', fontWeight: 700 }}>{func} <span style={{ color: 'var(--text3)', fontWeight: 400 }}>/ {total}</span></div>
                  <div style={styles.bar}>
                    <div style={{ ...styles.barFill, width: `${pct}%`, background: col, boxShadow: `0 0 8px ${col}40` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="section-title">Notifications</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {NOTIFICATIONS.map(n => (
              <div key={n.id} style={styles.notif}>
                <div style={{ background: 'var(--bg)', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {n.type === 'warning' ? <AlertTriangle size={18} color="var(--warning)" /> : n.type === 'success' ? <CheckCircle2 size={18} color="var(--success)" /> : <Info size={18} color="var(--accent)" />}
                </div>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5, fontWeight: 500 }}>{n.message}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4, fontFamily: 'var(--mono)' }}>{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="card">
        <div className="section-title">Upcoming Sessions</div>
        <table>
          <thead>
            <tr>
              <th>Batch</th><th>Subject</th><th>Lab</th><th>Day</th><th>Time</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.slice(0, 5).map(s => (
              <tr key={s.scheduleId}>
                <td style={{ color: 'var(--text)' }}>{s.batchName}</td>
                <td>{s.subjectCode}</td>
                <td>{s.labName?.split(' —')[0]}</td>
                <td>{s.dayName}</td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{s.slotLabel}</td>
                <td>
                  <span className={`badge badge-info`}>
                    Confirmed
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '40px', maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  labRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px dashed var(--border)' },
  bar: { width: 120, height: 6, background: 'var(--border)', borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' },
  notif: { display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px', background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', transition: 'transform 0.2s', cursor: 'default' },
};
