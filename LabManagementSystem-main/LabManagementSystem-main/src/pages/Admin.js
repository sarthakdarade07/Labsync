import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { SUBJECTS } from '../data/placeholders';
import api from '../api/axios';
import { Plus, X } from 'lucide-react';

export default function Admin() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/dashboard" />;

  const [tab, setTab] = useState('faculty');

  return (
    <div style={styles.page} className="animate-in">
      <div style={styles.header}>
        <div>
          <div className="section-title">Administration</div>
          <h1 className="page-title">Admin Control Panel</h1>
        </div>
        <span className="badge badge-info">Admin Only</span>
      </div>

      <div style={styles.tabs}>
        {['faculty', 'subjects', 'batches', 'settings', 'users'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...styles.tab, ...(tab === t ? styles.activeTab : {}) }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'faculty' && <FacultyTab />}
      {tab === 'subjects' && <SubjectsTab />}
      {tab === 'batches' && <BatchesTab />}
      {tab === 'settings' && <SettingsTab />}
      {tab === 'users' && <UsersTab />}
    </div>
  );
}

function FacultyTab() {
  const [faculty, setFaculty] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [newFaculty, setNewFaculty] = useState({ fullName: '', employeeId: '', designation: '', email: '', department: '' });

  const fetchFaculty = () => {
    api.get('/staff').then(res => { if (res.data?.success) setFaculty(res.data.data); });
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const submitNewFaculty = async () => {
    if (!newFaculty.fullName || !newFaculty.employeeId) return alert("Full Name and Employee ID are required.");
    try {
      const res = await api.post('/staff', newFaculty);
      if (res.data?.success) {
        setShowAddModal(false);
        setNewFaculty({ fullName: '', employeeId: '', designation: '', email: '', department: '' });
        fetchFaculty();
      } else {
        alert(res.data?.message || 'Error creating faculty');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to create faculty');
    }
  };

  const submitEditFaculty = async () => {
    if (!editingFaculty.fullName || !editingFaculty.employeeId) return alert("Full Name and Employee ID are required.");
    try {
      const res = await api.put(`/staff/${editingFaculty.id}`, editingFaculty);
      if (res.data?.success || res.status === 200) {
        setEditingFaculty(null);
        fetchFaculty();
      } else {
        alert(res.data?.message || 'Error updating faculty');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update faculty');
    }
  };

  return (
    <div className="card animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="section-title" style={{ margin: 0 }}>Faculty Members</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(pre => !pre)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {showAddModal ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Faculty</>}
        </button>
      </div>

      {showAddModal && (
        <div className="card animate-in" style={{ borderLeft: '3px solid var(--success)', marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="section-title" style={{ margin: 0 }}>Add New Faculty</div>
            <div className="grid-2">
              <input placeholder="Full Name (e.g. Prof. A. Sharma)" value={newFaculty.fullName} onChange={e => setNewFaculty(p => ({ ...p, fullName: e.target.value }))} />
              <input placeholder="Employee ID" value={newFaculty.employeeId} onChange={e => setNewFaculty(p => ({ ...p, employeeId: e.target.value }))} />
            </div>
            <div className="grid-2" style={{ gap: 8 }}>
              <input placeholder="Designation (e.g. Assistant Professor)" value={newFaculty.designation} onChange={e => setNewFaculty(p => ({ ...p, designation: e.target.value }))} />
              <input placeholder="Email" value={newFaculty.email} onChange={e => setNewFaculty(p => ({ ...p, email: e.target.value }))} />
            </div>
            <input placeholder="Department" value={newFaculty.department} onChange={e => setNewFaculty(p => ({ ...p, department: e.target.value }))} />
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary btn-sm" onClick={submitNewFaculty}>Create Faculty</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {editingFaculty && (
        <div className="card animate-in" style={{ borderLeft: '3px solid var(--warning)', marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="section-title" style={{ margin: 0 }}>Edit Faculty</div>
            <div className="grid-2">
              <input placeholder="Full Name (e.g. Prof. A. Sharma)" value={editingFaculty.fullName || ''} onChange={e => setEditingFaculty(p => ({ ...p, fullName: e.target.value }))} />
              <input placeholder="Employee ID" value={editingFaculty.employeeId || ''} onChange={e => setEditingFaculty(p => ({ ...p, employeeId: e.target.value }))} />
            </div>
            <div className="grid-2" style={{ gap: 8 }}>
              <input placeholder="Designation (e.g. Assistant Professor)" value={editingFaculty.designation || ''} onChange={e => setEditingFaculty(p => ({ ...p, designation: e.target.value }))} />
              <input placeholder="Email" value={editingFaculty.email || ''} onChange={e => setEditingFaculty(p => ({ ...p, email: e.target.value }))} />
            </div>
            <input placeholder="Department" value={editingFaculty.department || ''} onChange={e => setEditingFaculty(p => ({ ...p, department: e.target.value }))} />
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary btn-sm" onClick={submitEditFaculty}>Save Changes</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingFaculty(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <table>
        <thead><tr><th>ID</th><th>Name</th><th>Designation</th><th>Email</th><th></th></tr></thead>
        <tbody>
          {faculty.map((f, i) => (
            <tr key={f.id || i}>
              <td style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>{f.employeeId || f.id}</td>
              <td style={{ color: 'var(--text)', fontWeight: 600 }}>{f.fullName}</td>
              <td>{f.designation}</td>
              <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{f.email}</td>
              <td><button className="btn btn-secondary btn-sm" onClick={() => setEditingFaculty(f)}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubjectsTab() {
  const [subjects, setSubjects] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [newSubject, setNewSubject] = useState({ name: '', subjectCode: '', description: '', hoursPerWeek: 2 });

  const fetchSubjects = () => {
    api.get('/subjects').then(res => { if (res.data?.success) setSubjects(res.data.data); });
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const submitNewSubject = async () => {
    if (!newSubject.name || !newSubject.subjectCode) return alert("Name and Code are required.");
    try {
      const res = await api.post('/subjects', newSubject);
      if (res.data?.success) {
        setShowAddModal(false);
        setNewSubject({ name: '', subjectCode: '', description: '', hoursPerWeek: 2 });
        fetchSubjects();
      } else alert(res.data?.message || 'Error creating subject');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create subject');
    }
  };

  const submitEditSubject = async () => {
    if (!editingSubject.name || !editingSubject.subjectCode) return alert("Name and Code are required.");
    try {
      const res = await api.put(`/subjects/${editingSubject.id}`, editingSubject);
      if (res.data?.success || res.status === 200) {
        setEditingSubject(null);
        fetchSubjects();
      } else alert(res.data?.message || 'Error updating subject');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update subject');
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="section-title" style={{ margin: 0 }}>Subjects / Courses</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(pre => !pre)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {showAddModal ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Subject</>}
        </button>
      </div>

      {showAddModal && (
        <div className="card animate-in" style={{ borderLeft: '3px solid var(--success)', marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="section-title" style={{ margin: 0 }}>Add New Subject</div>
            <div className="grid-2">
              <input placeholder="Subject Name (e.g. Database Lab)" value={newSubject.name} onChange={e => setNewSubject(p => ({ ...p, name: e.target.value }))} />
              <input placeholder="Subject Code (e.g. CSB301)" value={newSubject.subjectCode} onChange={e => setNewSubject(p => ({ ...p, subjectCode: e.target.value }))} />
            </div>
            <div className="grid-2">
              <input placeholder="Description" value={newSubject.description} onChange={e => setNewSubject(p => ({ ...p, description: e.target.value }))} />
              <input type="number" placeholder="Hours Per Week (Credits)" value={newSubject.hoursPerWeek} onChange={e => setNewSubject(p => ({ ...p, hoursPerWeek: parseInt(e.target.value) || 2 }))} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary btn-sm" onClick={submitNewSubject}>Create Subject</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {editingSubject && (
        <div className="card animate-in" style={{ borderLeft: '3px solid var(--warning)', marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="section-title" style={{ margin: 0 }}>Edit Subject</div>
            <div className="grid-2">
              <input placeholder="Subject Name (e.g. Database Lab)" value={editingSubject.name || ''} onChange={e => setEditingSubject(p => ({ ...p, name: e.target.value }))} />
              <input placeholder="Subject Code (e.g. CSB301)" value={editingSubject.subjectCode || ''} onChange={e => setEditingSubject(p => ({ ...p, subjectCode: e.target.value }))} />
            </div>
            <div className="grid-2">
              <input placeholder="Description" value={editingSubject.description || ''} onChange={e => setEditingSubject(p => ({ ...p, description: e.target.value }))} />
              <input type="number" placeholder="Hours Per Week (Credits)" value={editingSubject.hoursPerWeek || ''} onChange={e => setEditingSubject(p => ({ ...p, hoursPerWeek: parseInt(e.target.value) || 2 }))} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary btn-sm" onClick={submitEditSubject}>Save Changes</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingSubject(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <table>
        <thead><tr><th>Code</th><th>Name</th><th>Credits (Hrs/Wk)</th><th></th></tr></thead>
        <tbody>
          {subjects.map((s, i) => (
            <tr key={s.id || i}>
              <td style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>{s.subjectCode}</td>
              <td style={{ color: 'var(--text)', fontWeight: 600 }}>{s.name}</td>
              <td style={{ fontFamily: 'var(--mono)' }}>{s.hoursPerWeek}</td>
              <td><button className="btn btn-secondary btn-sm" onClick={() => setEditingSubject(s)}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettingsTab() {
  const [days, setDays] = useState([]);
  const [settings, setSettings] = useState({
    institutionName: 'MIT-WPU',
    department: 'Computer Engineering & Technology',
    academicYear: '2024–25',
    backendApiUrl: 'http://localhost:8080/api'
  });

  useEffect(() => {
    api.get('/days').then(res => { if (res.data?.success) setDays(res.data.data); });
    api.get('/settings').then(res => {
      if (res.data?.success && Object.keys(res.data.data).length > 0) {
        setSettings(pre => ({ ...pre, ...res.data.data }));
      }
    });
  }, []);

  const updateDay = async (d) => {
    try {
      const payload = {
        ...d,
        startTime: d.startTime && d.startTime.length === 5 ? d.startTime + ':00' : d.startTime,
        endTime: d.endTime && d.endTime.length === 5 ? d.endTime + ':00' : d.endTime
      };
      await api.put(`/days/${d.id}`, payload);
      alert(`${d.dayName} updated successfully!`);
    } catch (err) { alert("Failed to update day."); }
  };

  const saveAllDays = async () => {
    try {
      const payload = days.map(d => ({
        ...d,
        startTime: d.startTime && d.startTime.length === 5 ? d.startTime + ':00' : d.startTime,
        endTime: d.endTime && d.endTime.length === 5 ? d.endTime + ':00' : d.endTime
      }));
      const res = await api.put('/days/bulk', payload);
      if (res.data?.success) alert("All working hours updated successfully!");
    } catch (err) { alert("Failed to save working hours."); }
  };

  const saveSettings = async () => {
    try {
      const res = await api.post('/settings', { settings });
      if (res.data?.success) {
        alert("Settings saved successfully!");
      }
    } catch (err) {
      alert("Failed to save settings.");
    }
  };

  return (
    <div className="card">
      <div className="section-title">System Settings</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 500 }}>
        {[
          { key: 'institutionName', label: 'Institution Name' },
          { key: 'department', label: 'Department' },
          { key: 'academicYear', label: 'Academic Year' },
          { key: 'backendApiUrl', label: 'Backend API URL' },
        ].map(f => (
          <div key={f.key}>
            <label style={styles.label}>{f.label}</label>
            <input
              value={settings[f.key]}
              onChange={e => setSettings(p => ({ ...p, [f.key]: e.target.value }))}
            />
          </div>
        ))}
        <div>
          <button className="btn btn-primary" onClick={saveSettings}>Save Settings</button>
        </div>

        <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <div className="section-title">Working Hours Configuration</div>
          <table style={{ width: '100%', maxWidth: 700 }}>
            <thead><tr><th>Day</th><th>Active</th><th>Start Time</th><th>End Time</th><th>Actions</th></tr></thead>
            <tbody>
              {days.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.dayName}</td>
                  <td>
                    <input type="checkbox" checked={d.active} onChange={e => {
                      const newDays = [...days];
                      newDays.find(x => x.id === d.id).active = e.target.checked;
                      setDays(newDays);
                    }} />
                  </td>
                  <td>
                    <input type="time" value={d.startTime || ''} onChange={e => {
                      const newDays = [...days];
                      newDays.find(x => x.id === d.id).startTime = e.target.value || null;
                      setDays(newDays);
                    }} style={{ width: 130 }} />
                  </td>
                  <td>
                    <input type="time" value={d.endTime || ''} onChange={e => {
                      const newDays = [...days];
                      newDays.find(x => x.id === d.id).endTime = e.target.value || null;
                      setDays(newDays);
                    }} style={{ width: 130 }} />
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => updateDay(d)}>Save</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={saveAllDays}>Save All Days</button>
          </div>
        </div>


      </div>
    </div>
  );
}

function BatchesTab() {
  const [batches, setBatches] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [newBatch, setNewBatch] = useState({ batchName: '', division: '', studentCount: 30, semester: '', programId: 1, academicYearId: 1, osRequirement: 'Any', labsPerWeek: 1, totalHours: '', startTime: '', endTime: '' });

  const fetchBatches = () => {
    api.get('/batches').then(res => { if (res.data?.success) setBatches(res.data.data); });
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const submitNewBatch = async () => {
    if (!newBatch.batchName || !newBatch.division) return alert("Name and Division are required.");
    try {
      const payload = { ...newBatch };
      if (!payload.startTime) payload.startTime = null;
      if (!payload.endTime) payload.endTime = null;
      const res = await api.post('/batches', payload);
      if (res.data?.success) {
        setShowAddModal(false);
        setNewBatch({ batchName: '', division: '', studentCount: 30, semester: '', programId: 1, academicYearId: 1, osRequirement: 'Any', labsPerWeek: 1, totalHours: '', startTime: '', endTime: '' });
        fetchBatches();
      } else alert(res.data?.message || 'Error creating batch');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create batch');
    }
  };

  const submitEditBatch = async () => {
    if (!editingBatch.batchName || !editingBatch.division) return alert("Name and Division are required.");
    try {
      const payload = {
        ...editingBatch,
        programId: editingBatch.program?.id || 1,
        academicYearId: editingBatch.academicYear?.id || 1
      };
      if (!payload.startTime) payload.startTime = null;
      if (!payload.endTime) payload.endTime = null;
      const res = await api.put(`/batches/${editingBatch.id}`, payload);
      if (res.data?.success || res.status === 200) {
        setEditingBatch(null);
        fetchBatches();
      } else alert(res.data?.message || 'Error updating batch');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update batch');
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="section-title" style={{ margin: 0 }}>Student Batches</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(pre => !pre)}>
          {showAddModal ? "✕ Cancel" : "＋ Add Batch"}
        </button>
      </div>

      {showAddModal && (
        <div className="card animate-in" style={{ borderLeft: '3px solid var(--success)', marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="section-title" style={{ margin: 0 }}>Add New Batch</div>
            <div className="grid-2">
              <input placeholder="Batch Name (e.g. Batch A3)" value={newBatch.batchName} onChange={e => setNewBatch(p => ({ ...p, batchName: e.target.value }))} />
              <input placeholder="Division (e.g. CSE-A)" value={newBatch.division} onChange={e => setNewBatch(p => ({ ...p, division: e.target.value }))} />
            </div>
            <div className="grid-2">
              <input placeholder="Semester (e.g. SEM-5)" value={newBatch.semester} onChange={e => setNewBatch(p => ({ ...p, semester: e.target.value }))} />
              <input type="number" placeholder="Student Strength" value={newBatch.studentCount} onChange={e => setNewBatch(p => ({ ...p, studentCount: parseInt(e.target.value) || 30 }))} />
            </div>
            <div className="grid-2">
              <input placeholder="OS Requirement (e.g. Linux, Windows, Any)" value={newBatch.osRequirement} onChange={e => setNewBatch(p => ({ ...p, osRequirement: e.target.value }))} />
              <input type="number" placeholder="Labs Per Week" value={newBatch.labsPerWeek} onChange={e => setNewBatch(p => ({ ...p, labsPerWeek: parseInt(e.target.value) || 1 }))} />
            </div>
            <div className="grid-3" style={{ gap: 12 }}>
              <input type="number" placeholder="Total Hrs" value={newBatch.totalHours} onChange={e => setNewBatch(p => ({ ...p, totalHours: parseInt(e.target.value) || '' }))} />
              <input type="time" title="Start Time" value={newBatch.startTime} onChange={e => setNewBatch(p => ({ ...p, startTime: e.target.value }))} />
              <input type="time" title="End Time" value={newBatch.endTime} onChange={e => setNewBatch(p => ({ ...p, endTime: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary btn-sm" onClick={submitNewBatch}>Create Batch</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {editingBatch && (
        <div className="card animate-in" style={{ borderLeft: '3px solid var(--warning)', marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="section-title" style={{ margin: 0 }}>Edit Batch</div>
            <div className="grid-2">
              <input placeholder="Batch Name (e.g. Batch A3)" value={editingBatch.batchName || ''} onChange={e => setEditingBatch(p => ({ ...p, batchName: e.target.value }))} />
              <input placeholder="Division (e.g. CSE-A)" value={editingBatch.division || ''} onChange={e => setEditingBatch(p => ({ ...p, division: e.target.value }))} />
            </div>
            <div className="grid-2">
              <input placeholder="Semester (e.g. SEM-5)" value={editingBatch.semester || ''} onChange={e => setEditingBatch(p => ({ ...p, semester: e.target.value }))} />
              <input type="number" placeholder="Student Strength" value={editingBatch.studentCount || ''} onChange={e => setEditingBatch(p => ({ ...p, studentCount: parseInt(e.target.value) || 30 }))} />
            </div>
            <div className="grid-2">
              <input placeholder="OS Requirement (e.g. Linux, Windows, Any)" value={editingBatch.osRequirement || ''} onChange={e => setEditingBatch(p => ({ ...p, osRequirement: e.target.value }))} />
              <input type="number" placeholder="Labs Per Week" value={editingBatch.labsPerWeek || ''} onChange={e => setEditingBatch(p => ({ ...p, labsPerWeek: parseInt(e.target.value) || 1 }))} />
            </div>
            <div className="grid-3" style={{ gap: 12 }}>
              <input type="number" placeholder="Total Hrs" value={editingBatch.totalHours || ''} onChange={e => setEditingBatch(p => ({ ...p, totalHours: parseInt(e.target.value) || '' }))} />
              <input type="time" title="Start Time" value={editingBatch.startTime || ''} onChange={e => setEditingBatch(p => ({ ...p, startTime: e.target.value }))} />
              <input type="time" title="End Time" value={editingBatch.endTime || ''} onChange={e => setEditingBatch(p => ({ ...p, endTime: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary btn-sm" onClick={submitEditBatch}>Save Changes</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingBatch(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <table>
        <thead><tr><th>Batch Name</th><th>Division</th><th>Semester</th><th>Strength</th><th>OS / Labs Per Week</th><th>Time (Start-End) / Hrs</th><th></th></tr></thead>
        <tbody>
          {batches.map((b, i) => (
            <tr key={b.id || i}>
              <td style={{ color: 'var(--text)', fontWeight: 600 }}>{b.batchName}</td>
              <td style={{ fontFamily: 'var(--mono)' }}>{b.division}</td>
              <td><span className="badge badge-info">{b.semester}</span></td>
              <td style={{ fontFamily: 'var(--mono)' }}>{b.studentCount} Students</td>
              <td style={{ fontSize: 13, color: 'var(--text2)' }}>{b.osRequirement || 'Any'} · {b.labsPerWeek || 1}/wk</td>
              <td style={{ fontSize: 13 }}>
                {(!b.startTime || b.startTime === '00:00:00' || b.startTime === '00:00') ? 'Any' : b.startTime.substring(0, 5)} -
                {(!b.endTime || b.endTime === '00:00:00' || b.endTime === '00:00') ? 'Any' : b.endTime.substring(0, 5)}
                {(!editingBatch && b.totalHours) ? b.totalHours + 'h' : 'N/A'}
              </td>

              <td><button className="btn btn-secondary btn-sm" onClick={() => setEditingBatch(b)}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordChangeData, setPasswordChangeData] = useState({ id: null, password: '' });
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', fullName: '', role: ['staff'] });

  const fetchUsers = () => {
    api.get('/users').then(res => { if (res.data?.success) setUsers(res.data.data); });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const submitNewUser = async () => {
    if (!newUser.username || !newUser.password) return alert("Username and Password are required.");
    try {
      const payload = { ...newUser };
      const res = await api.post('/auth/register', payload);
      if (res.data?.success || res.status === 201) {
        setShowAddModal(false);
        setNewUser({ username: '', email: '', password: '', fullName: '', role: ['staff'] });
        fetchUsers();
      } else alert(res.data?.message || 'Error creating user');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user');
    }
  };

  const submitPasswordChange = async () => {
    if (!passwordChangeData.password) return alert("Password cannot be empty.");
    try {
      const res = await api.put(`/users/${passwordChangeData.id}/password`, { password: passwordChangeData.password });
      if (res.data?.success || res.status === 200) {
        setShowPasswordModal(false);
        setPasswordChangeData({ id: null, password: '' });
        alert("Password changed successfully.");
      } else alert(res.data?.message || 'Error changing password');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change password');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="section-title" style={{ margin: 0 }}>System Users</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(pre => !pre)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {showAddModal ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add User</>}
        </button>
      </div>

      {showAddModal && (
        <div className="card animate-in" style={{ borderLeft: '3px solid var(--success)', marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="section-title" style={{ margin: 0 }}>Create System User</div>
            <div className="grid-2">
              <input placeholder="Username" value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} />
              <input placeholder="Email" type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="grid-2">
              <input placeholder="Full Name" value={newUser.fullName} onChange={e => setNewUser(p => ({ ...p, fullName: e.target.value }))} />
              <input placeholder="Password" type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={styles.label}>Role:</span>
              <select style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)' }} value={newUser.role[0]} onChange={(e) => setNewUser(p => ({ ...p, role: [e.target.value] }))}>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary btn-sm" onClick={submitNewUser}>Create User</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="card animate-in" style={{ borderLeft: '3px solid var(--accent)', marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="section-title" style={{ margin: 0 }}>Change Password</div>
            <input placeholder="New Password" type="password" value={passwordChangeData.password} onChange={e => setPasswordChangeData(p => ({ ...p, password: e.target.value }))} style={{ maxWidth: 300, padding: 8, borderRadius: 6, border: '1px solid var(--border)' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary btn-sm" onClick={submitPasswordChange}>Save Password</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowPasswordModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <table>
        <thead><tr><th>Username</th><th>Name</th><th>Email</th><th>Roles</th><th>Actions</th></tr></thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={u.id || i}>
              <td style={{ color: 'var(--text)', fontWeight: 600 }}>{u.username}</td>
              <td>{u.fullName}</td>
              <td style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{u.email}</td>
              <td>
                {u.roles?.map(r => (
                  <span key={r} className={`badge ${r === 'ROLE_ADMIN' ? 'badge-info' : 'badge-warning'}`} style={{ marginRight: 4 }}>
                    {r.replace('ROLE_', '')}
                  </span>
                ))}
              </td>
              <td>
                <button className="btn btn-secondary btn-sm" onClick={() => { setPasswordChangeData({ id: u.id, password: '' }); setShowPasswordModal(true); }} style={{ marginRight: 8 }}>Change Password</button>
                <button className="btn btn-secondary btn-sm" onClick={() => deleteUser(u.id)} style={{ color: 'var(--danger)' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  page: { padding: 32, maxWidth: 1200 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 },
  tabs: { display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 },
  tab: { background: 'none', border: 'none', color: 'var(--text3)', fontSize: 14, padding: '10px 18px', borderBottom: '2px solid transparent', transition: 'all 0.15s', cursor: 'pointer' },
  activeTab: { color: 'var(--accent)', borderBottomColor: 'var(--accent)', fontWeight: 600 },
  label: { display: 'block', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text3)', marginBottom: 6 },
};
