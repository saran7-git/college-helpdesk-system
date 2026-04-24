import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listAllTickets } from '../../services/api'
import TicketTable from '../../components/TicketTable'

export default function AdminTickets() {
  const [tickets, setTickets] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()

  const status = searchParams.get('status') || ''
  const query = searchParams.get('q') || ''

  const load = async (filterStatus) => {
    const { data } = await listAllTickets(filterStatus || undefined)
    setTickets(data)
  }

  useEffect(() => {
    load(status)
  }, [status])

  const filteredTickets = useMemo(() => {
    if (!query) return tickets
    const lower = query.toLowerCase()
    return tickets.filter((t) => {
      const studentName = t.studentId?.name || ''
      return (
        t.subject.toLowerCase().includes(lower) ||
        t.category.toLowerCase().includes(lower) ||
        studentName.toLowerCase().includes(lower)
      )
    })
  }, [tickets, query])

  const onStatusChange = (nextStatus) => {
    const next = new URLSearchParams(searchParams)
    if (nextStatus) next.set('status', nextStatus)
    else next.delete('status')
    setSearchParams(next)
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <h1>Ticket Management</h1>
        <p>Manage and track all student complaints.</p>
      </section>

      <section className="surface-card" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600 }}>All Tickets</div>
          <select className="select" style={{ width: 220 }} value={status} onChange={(e) => onStatusChange(e.target.value)}>
            <option value="">All Status</option>
            <option>Pending</option>
            <option>Assigned</option>
            <option>In Progress</option>
            <option>Resolved</option>
            <option>Rejected</option>
          </select>
        </div>
      </section>

      <section className="surface-card">
        <TicketTable tickets={filteredTickets} />
      </section>
    </div>
  )
}
