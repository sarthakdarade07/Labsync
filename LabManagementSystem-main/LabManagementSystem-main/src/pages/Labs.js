import React, { useState, useEffect } from 'react';
import { Plus, Monitor } from 'lucide-react';
import api from '../api/axios';

export default function Labs() {
  const [labs, setLabs] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLab, setNewLab] = useState({ labName: '', location: '', capacity: '', totalComputers: '', workingComputers: '', osType: '' });

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const response = await api.get('/labs');
      if (response.data && response.data.success) {
        setLabs(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching labs:", error);
    }
  };

  const startEdit = lab => { setEditing(lab.id); setForm({ ...lab }); };
  const cancelEdit = () => { setEditing(null); setForm({}); };
  const saveEdit = async () => {
    try {
      // Assuming a PUT /labs/{id} or PATCH endpoint exists
      await api.patch(`/labs/${editing}/computers`, {
        workingComputers: +form.functionalPCs || +form.workingComputers,
        faultyComputers: (+form.totalPCs - (+form.functionalPCs || +form.workingComputers)) || 0
      });
      fetchLabs();
      setEditing(null);
    } catch (error) {
      console.error("Error saving edit", error);
      alert('Failed to update lab status');
    }
  };

  const submitNewLab = async () => {
    if (!newLab.labName || !newLab.capacity || !newLab.totalComputers) {
      alert("Please fill Lab Name, Capacity, and Total PCs.");
      return;
    }
    try {
      const working = newLab.workingComputers ? +newLab.workingComputers : +newLab.totalComputers;
      const faulty = +newLab.totalComputers - working;
      
      const payload = {
        labName: newLab.labName,
        capacity: +newLab.capacity,
        totalComputers: +newLab.totalComputers,
        osType: newLab.osType,
        location: newLab.location,
        workingComputers: working,
        faultyComputers: Math.max(0, faulty)
      };
      const res = await api.post('/labs', payload);
      if (res.data?.success) {
        setShowAddModal(false);
        setNewLab({ labName: '', location: '', capacity: '', totalComputers: '', workingComputers: '', osType: '' });
        fetchLabs();
      } else {
        alert(res.data?.message || 'Error creating lab');
      }
    } catch (err) {
      console.error("Error adding lab:", err);
      alert(err.response?.data?.message || 'Failed to create lab');
    }
  };

  return (
    <div style={styles.page} className="animate-in">
      <div style={styles.header}>
        <div>
          <div className="section-title">Infrastructure</div>
          <h1 className="page-title">Labs &amp; PCs</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={16} /> Add Lab</button>
      </div>

      <div className="grid-3" style={{ marginBottom: 28 }}>
        {showAddModal && (
          <div className="card animate-in" style={{ borderLeft: '3px solid var(--success)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="section-title">Add New Lab</div>
              <input placeholder="Lab Name (e.g. Lab-101)" value={newLab.labName} onChange={e => setNewLab(p => ({ ...p, labName: e.target.value }))} />
              <input placeholder="Location" value={newLab.location} onChange={e => setNewLab(p => ({ ...p, location: e.target.value }))} />
              <input placeholder="OS Type (e.g. Windows 11)" value={newLab.osType} onChange={e => setNewLab(p => ({ ...p, osType: e.target.value }))} />
              <div className="grid-2" style={{ gap: 8 }}>
                <input type="number" placeholder="Capacity (Students)" value={newLab.capacity} onChange={e => setNewLab(p => ({ ...p, capacity: e.target.value }))} />
                <input type="number" placeholder="Total PCs" value={newLab.totalComputers} onChange={e => setNewLab(p => ({ ...p, totalComputers: e.target.value }))} />
              </div>
              <input type="number" placeholder="Working PCs (Optional)" value={newLab.workingComputers} onChange={e => setNewLab(p => ({ ...p, workingComputers: e.target.value }))} />
              
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="btn btn-primary btn-sm" onClick={submitNewLab}>Create Lab</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        {labs.map(lab => {
          // Normalize API fields to existing frontend logic
          const id = lab.id;
          const name = lab.labName || lab.name;
          const location = lab.location || 'Unknown';
          const totalPCs = lab.totalComputers || lab.totalPCs || 0;
          const functionalPCs = lab.workingComputers || lab.functionalPCs || 0;

          const pct = Math.round((functionalPCs / (totalPCs || 1)) * 100);
          const faulty = Math.max(0, totalPCs - functionalPCs);
          const col = pct === 100 ? 'var(--success)' : pct >= 80 ? 'var(--accent)' : 'var(--warning)';
          const isEditing = editing === lab.id;

          return (
            <div key={id} className="card">
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="section-title">Editing #{id}</div>
                  <input placeholder="Lab Name" disabled value={name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                  <input placeholder="Location" disabled value={location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                  <div className="grid-2">
                    <input type="number" disabled placeholder="Total PCs" value={form.totalPCs || form.totalComputers} onChange={e => setForm(p => ({ ...p, totalPCs: e.target.value }))} />
                    <input type="number" placeholder="Functional PCs" value={form.functionalPCs || form.workingComputers} onChange={e => setForm(p => ({ ...p, functionalPCs: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button className="btn btn-primary btn-sm" onClick={saveEdit}>Save</button>
                    <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 3 }}>{name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>ID: {id} · {location}</div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => startEdit(lab)}>Edit</button>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>PC Availability</span>
                      <span style={{ fontSize: 13, fontFamily: 'var(--mono)', color: col, fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <div style={styles.bar}><div style={{ ...styles.fill, width: `${pct}%`, background: col }} /></div>
                  </div>

                  <div className="grid-3" style={{ gap: 8 }}>
                    {[
                      { label: 'Total', value: totalPCs, c: 'var(--text2)' },
                      { label: 'Functional', value: functionalPCs, c: 'var(--success)' },
                      { label: 'Faulty', value: faulty, c: faulty > 0 ? 'var(--warning)' : 'var(--text3)' },
                    ].map(s => (
                      <div key={s.label} style={styles.miniStat}>
                        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--mono)', color: s.c }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <span className={`badge ${pct === 100 ? 'badge-success' : pct >= 80 ? 'badge-info' : 'badge-warning'}`}>
                      {pct === 100 ? 'Fully Operational' : pct >= 80 ? 'Mostly Available' : 'Reduced Capacity'}
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* PC Summary Table */}
      <div className="card">
        <div className="section-title">Summary Table</div>
        <table>
          <thead><tr><th>Lab ID</th><th>Name</th><th>Location</th><th>Total PCs</th><th>Functional</th><th>Faulty</th><th>Status</th></tr></thead>
          <tbody>
            {labs.map(lab => {
              const id = lab.id;
              const name = lab.labName || lab.name;
              const location = lab.location || 'Unknown';
              const totalPCs = lab.totalComputers || lab.totalPCs || 0;
              const functionalPCs = lab.workingComputers || lab.functionalPCs || 0;
              const faulty = Math.max(0, totalPCs - functionalPCs);
              const pct = Math.round((functionalPCs / (totalPCs || 1)) * 100);
              return (
                <tr key={id}>
                  <td style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>{id}</td>
                  <td style={{ color: 'var(--text)' }}>{name}</td>
                  <td>{location}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{totalPCs}</td>
                  <td style={{ color: 'var(--success)', fontFamily: 'var(--mono)' }}>{functionalPCs}</td>
                  <td style={{ color: faulty > 0 ? 'var(--warning)' : 'var(--text3)', fontFamily: 'var(--mono)' }}>{faulty}</td>
                  <td><span className={`badge ${pct===100?'badge-success':pct>=80?'badge-info':'badge-warning'}`}>{pct}%</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 32, maxWidth: 1200 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 },
  bar: { height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, transition: 'width 0.5s' },
  miniStat: { textAlign: 'center', padding: '8px 4px', background: 'var(--bg2)', borderRadius: 8 },
};
