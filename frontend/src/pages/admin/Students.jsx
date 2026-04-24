import React, { useEffect, useState } from 'react'
import { listStudents, updateStudentStatus } from '../../services/api'

export default function Students() {
  const [students, setStudents] = useState([])
  const [q, setQ] = useState('')
  const [department, setDepartment] = useState('')
  const [year, setYear] = useState('')
  const [status, setStatus] = useState('')

  const load = async () => {
    const { data } = await listStudents({ q, department, year, status })
    setStudents(data)
  }

  useEffect(() => {
    load()
  }, [q, department, year, status])

  const toggle = async (id, current) => {
    const next = current === 'active' ? 'blocked' : 'active'
    await updateStudentStatus(id, next)
    await load()
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <h1>Students</h1>
        <p>Search, filter, and manage student access across departments.</p>
      </section>
      <section className="surface-card">
      <div className="surface-title">Student Directory</div>
      <div className="grid students-filter-grid">
        <input className="input" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <input className="input" placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
        <select className="select" value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">Year</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </select>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>
      <div style={{ marginTop: 12 }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Department</th>
                <th>Year</th>
                <th className="ta-center">Total Complaints</th>
                <th className="ta-center">Status</th>
                <th className="ta-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="hover">
                  <td>{s.id}</td>
                  <td>{s.department}</td>
                  <td className="ta-center">{s.year}</td>
                  <td className="ta-center">{s.totalComplaints}</td>
                  <td className="ta-center">
                    <span className="status" style={{ color: s.status === 'active' ? 'var(--success)' : 'var(--danger)', borderColor: s.status === 'active' ? 'var(--success)' : 'var(--danger)' }}>
                      {s.status}
                    </span>
                  </td>
                  <td className="ta-center">
                    <button className="btn secondary" onClick={() => toggle(s.id, s.status)}>{s.status === 'active' ? 'Block' : 'Activate'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </section>
    </div>
  )
}
