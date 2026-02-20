import { useState, useEffect, useCallback } from 'react'
import { supabase, CHAT_ID } from './lib/supabase'
import ReminderCard from './components/ReminderCard'
import ReminderForm from './components/ReminderForm'
import { v4 as uuidv4 } from 'uuid'
import './App.css'

const FILTERS = ['all', 'pending', 'sent']

export default function App() {
  const [reminders, setReminders] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const fetchReminders = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .is('deleted_at', null)
      .order('reminder_time', { ascending: true })

    if (error) {
      setError('Failed to load reminders: ' + error.message)
    } else {
      setReminders(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchReminders()
  }, [fetchReminders])

  const closeForm = () => {
    setShowForm(false)
    setEditTarget(null)
  }

  const handleCreate = async ({ message, reminder_time }) => {
    const now = new Date().toISOString()
    const { error } = await supabase.from('reminders').insert({
      id: uuidv4(),
      message,
      reminder_time,
      chat_id: CHAT_ID,
      status: 'pending',
      created_at: now,
      updated_at: now,
    })
    if (error) throw new Error(error.message)
    closeForm()
    await fetchReminders()
  }

  const handleEdit = async ({ message, reminder_time }) => {
    const { error } = await supabase
      .from('reminders')
      .update({ message, reminder_time, updated_at: new Date().toISOString() })
      .eq('id', editTarget.id)
    if (error) throw new Error(error.message)
    closeForm()
    await fetchReminders()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reminder?')) return
    const { error } = await supabase
      .from('reminders')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      setError('Delete failed: ' + error.message)
      return
    }
    setReminders((prev) => prev.filter((r) => r.id !== id))
  }

  const filtered = reminders.filter((r) => filter === 'all' || r.status === filter)

  const counts = {
    all: reminders.length,
    pending: reminders.filter((r) => r.status === 'pending').length,
    sent: reminders.filter((r) => r.status === 'sent').length,
  }

  const isFormOpen = showForm || editTarget !== null

  return (
    <div className="app">
      <header className="app-header">
        <h1>Reminders</h1>
        <button
          className="btn btn-primary"
          onClick={() => { setEditTarget(null); setShowForm(true) }}
        >
          + New
        </button>
      </header>

      {isFormOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) closeForm() }}
        >
          <div className="modal">
            <ReminderForm
              initial={editTarget}
              onSubmit={editTarget ? handleEdit : handleCreate}
              onCancel={closeForm}
            />
          </div>
        </div>
      )}

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f} <span className="filter-count">{counts[f]}</span>
          </button>
        ))}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>{filter === 'pending' ? 'No pending reminders.' : `No ${filter} reminders.`}</p>
          {filter === 'pending' && (
            <button
              className="btn btn-ghost"
              onClick={() => { setEditTarget(null); setShowForm(true) }}
            >
              Add one
            </button>
          )}
        </div>
      ) : (
        <ul className="reminder-list">
          {filtered.map((r) => (
            <li key={r.id}>
              <ReminderCard
                reminder={r}
                onEdit={(reminder) => { setEditTarget(reminder); setShowForm(false) }}
                onDelete={handleDelete}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
