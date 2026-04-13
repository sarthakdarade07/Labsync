import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { NOTIFICATIONS } from '../data/placeholders';
import { Landmark, Monitor, Users, BarChart, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function Dashboard() {
  const [labs, setLabs] = useState([]);
  const [batches, setBatches] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // Fetch live lab data on load
    api.get('/labs').then(response => { if (response.data?.success) setLabs(response.data.data); });
    api.get('/batches').then(response => { if (response.data?.success) setBatches(response.data.data); });
    api.get('/schedules').then(response => { if (response.data?.success) setSessions(response.data.data); });
  }, []);

  const totalPCs = labs.reduce((a, l) => a + (l.totalComputers || 0), 0);
  const functionalPCs = labs.reduce((a, l) => a + (l.workingComputers || 0), 0);
  const utilization = totalPCs > 0 ? Math.round((functionalPCs / totalPCs) * 100) : 0;

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={styles.page} className="animate-in">
      <div style={styles.header}>
        <div>
          <div className="section-title">Overview</div>
          <h1 className="page-title">Dashboard</h1>
        </div>
        <div style={{ color: 'var(--text3)', fontSize: 13, fontFamily: 'var(--mono)', textAlign: 'right' }}>
          {today}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Labs', value: labs.length, color: 'var(--accent)', icon: <Landmark size={20} /> },
          { label: 'Functional PCs', value: `${functionalPCs}/${totalPCs}`, color: 'var(--success)', icon: <Monitor size={20} /> },
          { label: 'Active Batches', value: batches.length, color: 'var(--accent3)', icon: <Users size={20} /> },
          { label: 'Utilization', value: `${utilization}%`, color: utilization < 85 ? 'var(--warning)' : 'var(--success)', icon: <BarChart size={20} /> },
        ].map(s => (
          <div key={s.label} className="card animate-in" style={{ borderLeft: `3px solid ${s.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div className="section-title" style={{ margin: 0 }}>{s.label}</div>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
            </div>
            <div className="stat-number" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Lab Status */}
        <div className="card">
          <div className="section-title">Live Lab Status</div>
          {labs.length === 0 && <div style={{ color: 'var(--text3)' }}>Loading labs data from server...</div>}
          {labs.map(lab => {
            const name = lab.labName || lab.name || `Lab ${lab.id}`;
            const total = lab.totalComputers || 0;
            const func = lab.workingComputers || 0;
            const pct = total > 0 ? Math.round((func / total) * 100) : 0;
            const col = pct === 100 ? 'var(--success)' : pct >= 80 ? 'var(--accent)' : 'var(--warning)';

            return (
              <div key={lab.id} style={styles.labRow}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{lab.location || 'Unknown Location'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: col, fontFamily: 'var(--mono)', fontWeight: 700 }}>{func}/{total}</div>
                  <div style={styles.bar}>
                    <div style={{ ...styles.barFill, width: `${pct}%`, background: col }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="section-title">Notifications</div>
          {NOTIFICATIONS.map(n => (
            <div key={n.id} style={styles.notif}>
              <span style={{ display: 'flex', alignItems: 'center' }}>{n.type === 'warning' ? <AlertTriangle size={18} color="var(--warning)" /> : n.type === 'success' ? <CheckCircle size={18} color="var(--success)" /> : <Info size={18} color="var(--info)" />}</span>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, fontFamily: 'var(--mono)' }}>{n.time}</div>
              </div>
            </div>
          ))}
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
                  <span className={`badge badge-success`}>
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
  page: { padding: '32px', maxWidth: 1200 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 },
  labRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' },
  bar: { width: 100, height: 4, background: 'var(--border)', borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2, transition: 'width 0.5s ease' },
  notif: { display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid var(--border)' },
};
