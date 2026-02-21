/**
 * TypeScript type definitions for STT Module
 */

/**
 * Audio recording hook return type
 */
export interface UseAudioRecorderReturn {
  /** Whether recording is currently active */
  isRecording: boolean;
  /** Error message if any occurred during recording */
  error: string | null;
  /** Start recording audio from the user's microphone */
  startRecording: () => Promise<void>;
  /** Stop recording and return the audio blob */
  stopRecording: () => Promise<Blob>;
  /** Cancel the current recording without saving */
  cancelRecording: () => void;
}

/**
 * Media stream constraints for audio recording
 */
export interface AudioConstraints {
  /** Number of audio channels (default: 1 for mono) */
  channelCount?: number;
  /** Sample rate in Hz (default: 16000) */
  sampleRate?: number;
  /** Enable echo cancellation (default: true) */
  echoCancellation?: boolean;
  /** Enable noise suppression (default: true) */
  noiseSuppression?: boolean;
}

/**
 * Transcription options for Deepgram API
 */
export interface TranscriptionOptions {
  /** Language code (default: 'en-US') */
  language?: string;
  /** Enable automatic punctuation (default: true) */
  punctuate?: boolean;
  /** Deepgram model to use (default: 'nova-2') */
  model?: string;
  /** Enable smart formatting (default: true) */
  smartFormat?: boolean;
}

/**
 * Transcription result from the API
 */
export interface TranscriptionResult {
  /** The transcribed text */
  transcript: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Raw API response data */
  raw: DeepgramResponse;
}

/**
 * Deepgram API response structure
 */
export interface DeepgramResponse {
  metadata?: {
    transaction_key?: string;
    request_id?: string;
    sha256?: string;
    created?: string;
    duration?: number;
    channels?: number;
  };
  results?: {
    channels?: Array<{
      alternatives?: Array<{
        transcript?: string;
        confidence?: number;
        words?: Array<{
          word: string;
          start: number;
          end: number;
          confidence: number;
        }>;
      }>;
    }>;
  };
}

/**
 * Transcription service interface
 */
export interface ITranscriptionService {
  /** Set or update the API key */
  setApiKey(apiKey: string): void;
  /** Transcribe an audio blob */
  transcribe(audioBlob: Blob, options?: TranscriptionOptions): Promise<TranscriptionResult>;
  /** Check if the service is configured */
  isConfigured(): boolean;
}

/**
 * Audio utility function types
 */
export interface AudioUtils {
  /** Convert Float32Array to WAV blob */
  audioBufferToWav(audioBuffer: Float32Array, sampleRate: number): Blob;
  /** Check if audio recording is supported in the browser */
  isAudioRecordingSupported(): boolean;
}
