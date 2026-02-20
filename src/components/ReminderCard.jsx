const formatDateTime = (iso) => {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const timeUntil = (iso) => {
  const diff = new Date(iso) - new Date()
  if (diff <= 0) return 'overdue'
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `in ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `in ${hrs}h ${mins % 60}m`
  const days = Math.floor(hrs / 24)
  return `in ${days}d ${hrs % 24}h`
}

export default function ReminderCard({ reminder, onEdit, onDelete }) {
  const isPending = reminder.status === 'pending'
  const isOverdue = isPending && new Date(reminder.reminder_time) <= new Date()

  return (
    <div className={`reminder-card ${reminder.status} ${isOverdue ? 'overdue' : ''}`}>
      <div className="card-body">
        <p className="card-message">{reminder.message}</p>
        <div className="card-meta">
          <span className="card-time">{formatDateTime(reminder.reminder_time)}</span>
          {isPending && (
            <span className={`card-countdown ${isOverdue ? 'overdue' : ''}`}>
              {timeUntil(reminder.reminder_time)}
            </span>
          )}
        </div>
      </div>

      <div className="card-side">
        <span className={`status-badge ${reminder.status}`}>
          {reminder.status}
        </span>
        {isPending && (
          <div className="card-actions">
            <button
              className="btn-icon"
              title="Edit"
              onClick={() => onEdit(reminder)}
            >
              ✎
            </button>
            <button
              className="btn-icon danger"
              title="Delete"
              onClick={() => onDelete(reminder.id)}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
