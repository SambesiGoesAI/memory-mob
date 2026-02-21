import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import ReminderCard from './components/ReminderCard'
import ArchiveCard from './components/ArchiveCard'
import ReminderForm from './components/ReminderForm'
import { v4 as uuidv4 } from 'uuid'
import './App.css'

const FILTERS = [
  { key: 'all', label: 'Kaikki' },
  { key: 'pending', label: 'Odottaa' },
  { key: 'sent', label: 'Lähetetty' },
]

export default function App() {
  const [view, setView] = useState('list') // 'list' | 'archive'
  const [reminders, setReminders] = useState([])
  const [archived, setArchived] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [archivedToast, setArchivedToast] = useState(false)

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

  const fetchArchived = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (error) {
      setError('Arkiston lataus epäonnistui: ' + error.message)
    } else {
      setArchived(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (view === 'list') fetchReminders()
    else fetchArchived()
  }, [view, fetchReminders, fetchArchived])

  const closeForm = () => {
    // Blur the focused input first — iOS Safari won't start resetting zoom
    // until the element that triggered it loses focus.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    setShowForm(false)
    setEditTarget(null)
    // After blur, force viewport back to 1:1 scale then lift the restriction.
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1')
      setTimeout(() => {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1')
      }, 500)
    }
  }

  const handleCreate = async ({ message, reminder_time }) => {
    const now = new Date().toISOString()
    const { error } = await supabase.from('reminders').insert({
      id: uuidv4(),
      message,
      reminder_time,
      chat_id: uuidv4(),
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
      .update({ message, reminder_time, status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', editTarget.id)
    if (error) throw new Error(error.message)
    closeForm()
    await fetchReminders()
  }

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('reminders')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      setError('Arkistointi epäonnistui: ' + error.message)
      return
    }
    setReminders((prev) => prev.filter((r) => r.id !== id))
    setArchivedToast(true)
    setTimeout(() => setArchivedToast(false), 2500)
  }

  const handleRestore = async (id) => {
    const { error } = await supabase
      .from('reminders')
      .update({ deleted_at: null })
      .eq('id', id)
    if (error) {
      setError('Palautus epäonnistui: ' + error.message)
      return
    }
    setArchived((prev) => prev.filter((r) => r.id !== id))
  }

  const filtered = reminders.filter((r) => filter === 'all' || r.status === filter)

  const counts = {
    all: reminders.length,
    pending: reminders.filter((r) => r.status === 'pending').length,
    sent: reminders.filter((r) => r.status === 'sent').length,
  }

  const currentFilter = FILTERS.find((f) => f.key === filter)
  const isFormOpen = showForm || editTarget !== null

  return (
    <div className="app">
      <header className="app-header">
        <h1>{view === 'archive' ? 'Arkisto' : 'Muistutukset'}</h1>
        <div className="header-actions">
          {view === 'list' ? (
            <>
              <button
                className="btn btn-ghost"
                onClick={() => setView('archive')}
              >
                Arkisto
              </button>
              <button
                className="btn btn-primary"
                onClick={() => { setEditTarget(null); setShowForm(true) }}
              >
                + Uusi
              </button>
            </>
          ) : (
            <button
              className="btn btn-ghost"
              onClick={() => setView('list')}
            >
              ← Takaisin
            </button>
          )}
        </div>
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

      {view === 'list' && (
        <div className="filter-bar">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              className={`filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label} <span className="filter-count">{counts[key]}</span>
            </button>
          ))}
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      {archivedToast && (
        <div className="toast-overlay" onClick={() => setArchivedToast(false)}>
          <div className="toast">Muistutus arkistoitu</div>
        </div>
      )}

      {loading ? (
        <div className="empty-state">Ladataan…</div>
      ) : view === 'archive' ? (
        archived.length === 0 ? (
          <div className="empty-state">
            <p>Arkisto on tyhjä.</p>
          </div>
        ) : (
          <ul className="reminder-list">
            {archived.map((r) => (
              <li key={r.id}>
                <ArchiveCard reminder={r} onRestore={handleRestore} />
              </li>
            ))}
          </ul>
        )
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>
            {filter === 'pending'
              ? 'Ei odottavia muistutuksia.'
              : `Ei ${currentFilter.label.toLowerCase()}-muistutuksia.`}
          </p>
          {filter === 'pending' && (
            <button
              className="btn btn-ghost"
              onClick={() => { setEditTarget(null); setShowForm(true) }}
            >
              Lisää muistutus
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
