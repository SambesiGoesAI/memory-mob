import { formatFinnish } from '../lib/dateUtils'

export default function ArchiveCard({ reminder, onRestore }) {
  return (
    <div className="reminder-card archived">
      <div className="card-body">
        <p className="card-message">{reminder.message}</p>
        <div className="card-meta">
          <span className="card-time">{formatFinnish(reminder.reminder_time)}</span>
          <span className="card-archived-at">
            Arkistoitu {formatFinnish(reminder.deleted_at)}
          </span>
        </div>
      </div>
      <div className="card-side">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onRestore(reminder.id)}
        >
          Palauta
        </button>
      </div>
    </div>
  )
}
