import { useState, useEffect } from 'react'
import { buildReminderTime, isoToHelsinki, todayHelsinki } from '../lib/dateUtils'
import { useAudioRecorder, transcriptionService } from '@yourusername/stt-module'

const LS_KEY = 'deepgram_api_key'

function getDeepgramKey() {
  return localStorage.getItem(LS_KEY) || import.meta.env.VITE_DEEPGRAM_API_KEY || ''
}

export default function ReminderForm({ onSubmit, onCancel, initial }) {
  const [message, setMessage] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [showKeyPrompt, setShowKeyPrompt] = useState(false)
  const [keyInput, setKeyInput] = useState('')

  const { isRecording, error: recordingError, startRecording, stopRecording } = useAudioRecorder()

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

  useEffect(() => {
    if (recordingError) setError(recordingError)
  }, [recordingError])

  const handleVoice = async () => {
    if (isRecording) {
      try {
        setIsTranscribing(true)
        const audioBlob = await stopRecording()
        const key = getDeepgramKey()
        transcriptionService.setApiKey(key)
        const result = await transcriptionService.transcribe(audioBlob)
        if (result.transcript) {
          setMessage(prev => prev ? prev + ' ' + result.transcript : result.transcript)
        }
      } catch (err) {
        const msg = err.message || 'Transcription failed.'
        if (msg.includes('401')) {
          localStorage.removeItem(LS_KEY)
          setShowKeyPrompt(true)
          setError('API key rejected (401) — please enter a valid key.')
        } else {
          setError(msg)
        }
      } finally {
        setIsTranscribing(false)
      }
    } else {
      if (!getDeepgramKey()) {
        setShowKeyPrompt(true)
        return
      }
      setError('')
      await startRecording()
    }
  }

  const handleSaveKey = () => {
    const trimmed = keyInput.trim()
    if (!trimmed) return
    localStorage.setItem(LS_KEY, trimmed)
    setKeyInput('')
    setShowKeyPrompt(false)
    setError('')
  }

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

  const voiceLabel = isTranscribing ? 'Transcribing…' : isRecording ? 'Stop recording' : 'Speak your reminder'

  return (
    <form className="reminder-form" onSubmit={handleSubmit}>
      <h2>{title}</h2>

      <div className="field">
        <label htmlFor="msg">What do you want to remember?</label>
        <div className="textarea-wrapper">
          <textarea
            id="msg"
            rows={3}
            placeholder="e.g. Buy milk, Call dad, Pay electricity bill…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSent}
            className={isSent ? 'field-disabled' : ''}
          />
          {!isSent && (
            <button
              type="button"
              className={[
                'voice-btn',
                isRecording ? 'voice-btn--recording' : '',
                isTranscribing ? 'voice-btn--busy' : '',
              ].join(' ').trim()}
              onClick={handleVoice}
              disabled={isTranscribing}
              title={voiceLabel}
              aria-label={voiceLabel}
            >
              {isTranscribing ? (
                <span className="voice-btn__spinner" aria-hidden="true" />
              ) : isRecording ? (
                /* Stop icon */
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                  <rect x="2" y="2" width="10" height="10" rx="2" />
                </svg>
              ) : (
                /* Microphone icon */
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/>
                  <path d="M19 10a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V19h-2a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.08A7 7 0 0 0 19 10z"/>
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {showKeyPrompt && (
        <div className="key-prompt">
          <p className="key-prompt__label">Enter your Deepgram API key to enable voice input:</p>
          <div className="key-prompt__row">
            <input
              type="password"
              className="key-prompt__input"
              placeholder="Paste API key here…"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveKey())}
              autoFocus
            />
            <button type="button" className="btn btn-primary" onClick={handleSaveKey}>
              Save
            </button>
          </div>
          <p className="key-prompt__hint">
            Stored in this browser only. Get a free key at{' '}
            <a href="https://console.deepgram.com" target="_blank" rel="noreferrer">console.deepgram.com</a>.
          </p>
        </div>
      )}

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
