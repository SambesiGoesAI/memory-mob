import { formatFinnish, TZ } from '../lib/dateUtils'

const timeUntil = (iso) => {
  const diff = new Date(iso) - new Date()
  if (diff <= 0) return 'myöhässä'
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} t ${mins % 60} min`
  const days = Math.floor(hrs / 24)
  return `${days} pv ${hrs % 24} t`
}

export default function ReminderCard({ reminder, onEdit, onDelete }) {
  const isPending = reminder.status === 'pending'
  const isOverdue = isPending && new Date(reminder.reminder_time) <= new Date()

  return (
    <div className={`reminder-card ${reminder.status} ${isOverdue ? 'overdue' : ''}`}>
      <div className="card-body">
        <p className="card-message">{reminder.message}</p>
        <div className="card-meta">
          <span className="card-time">{formatFinnish(reminder.reminder_time)}</span>
          {isPending && (
            <span className={`card-countdown ${isOverdue ? 'overdue' : ''}`}>
              {timeUntil(reminder.reminder_time)}
            </span>
          )}
        </div>
      </div>

      <div className="card-side">
        <span className={`status-badge ${reminder.status}`}>
          {reminder.status === 'pending' ? 'odottaa' : 'lähetetty'}
        </span>
        <div className="card-actions">
          {isPending && (
            <button className="btn-icon" title="Muokkaa" onClick={() => onEdit(reminder)}>
              ✎
            </button>
          )}
          <button className="btn-icon danger" title="Arkistoi" onClick={() => onDelete(reminder.id)}>
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
