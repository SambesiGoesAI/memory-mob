import { useState, useEffect } from 'react'

const toLocalDatetimeValue = (isoString) => {
  if (!isoString) return ''
  const d = new Date(isoString)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function ReminderForm({ onSubmit, onCancel, initial }) {
  const [message, setMessage] = useState(initial?.message || '')
  const [reminderTime, setReminderTime] = useState(
    initial ? toLocalDatetimeValue(initial.reminder_time) : ''
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initial) {
      setMessage(initial.message)
      setReminderTime(toLocalDatetimeValue(initial.reminder_time))
    }
  }, [initial])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!message.trim()) return setError('Message is required.')
    if (!reminderTime) return setError('Reminder time is required.')

    const dt = new Date(reminderTime)
    if (!initial && dt <= new Date()) return setError('Reminder time must be in the future.')

    setLoading(true)
    try {
      await onSubmit({
        message: message.trim(),
        reminder_time: dt.toISOString(),
      })
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="reminder-form" onSubmit={handleSubmit}>
      <h2>{initial ? 'Edit Reminder' : 'New Reminder'}</h2>

      <div className="field">
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          rows={3}
          placeholder="What do you want to be reminded about?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          autoFocus
        />
      </div>

      <div className="field">
        <label htmlFor="reminder-time">Remind me at</label>
        <input
          id="reminder-time"
          type="datetime-local"
          value={reminderTime}
          onChange={(e) => setReminderTime(e.target.value)}
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving…' : initial ? 'Save changes' : 'Add reminder'}
        </button>
      </div>
    </form>
  )
}
