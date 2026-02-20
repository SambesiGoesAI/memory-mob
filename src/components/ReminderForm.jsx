import { useState, useEffect } from 'react'
import { buildReminderTime, isoToHelsinki, todayHelsinki } from '../lib/dateUtils'

export default function ReminderForm({ onSubmit, onCancel, initial }) {
  const [message, setMessage] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isSent = initial?.status === 'sent'

  useEffect(() => {
    if (initial) {
      setMessage(initial.message)
      const { date: d, time: t } = isoToHelsinki(initial.reminder_time)
      setDate(d)
      setTime(t)
    } else {
      setMessage('')
      setDate('')
      setTime('')
    }
  }, [initial])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!message.trim()) return setError('Please enter a reminder message.')

    const reminderISO = buildReminderTime(date, time)
    if (!initial && new Date(reminderISO) <= new Date()) {
      return setError('That date and time is already in the past.')
    }

    setLoading(true)
    try {
      await onSubmit({ message: message.trim(), reminder_time: reminderISO })
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const title = isSent ? 'Reschedule reminder' : initial ? 'Edit reminder' : 'New reminder'
  const submitLabel = loading ? 'Saving…' : isSent ? 'Reschedule' : initial ? 'Save changes' : 'Add reminder'

  return (
    <form className="reminder-form" onSubmit={handleSubmit}>
      <h2>{title}</h2>

      <div className="field">
        <label htmlFor="msg">What do you want to remember?</label>
        <textarea
          id="msg"
          rows={3}
          placeholder="e.g. Buy milk, Call dad, Pay electricity bill…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSent}
          className={isSent ? 'field-disabled' : ''}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="date">Date <span className="optional">(leave empty = today)</span></label>
          <input
            id="date"
            type="date"
            value={date}
            min={todayHelsinki()}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="time">Time <span className="optional">(leave empty = 21:00)</span></label>
          <input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>

      <p className="form-hint">
        {!date && !time && 'Will be set to today at 21:00'}
        {date && !time && 'Time will default to 21:00'}
        {!date && time && `Will be set to today at ${time}`}
        {date && time && `Reminder set for ${date} at ${time}`}
      </p>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
