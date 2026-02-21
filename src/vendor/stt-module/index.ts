/**
 * STT Module - Speech-to-Text functionality for TypeScript/React applications
 *
 * This module provides a clean, reusable interface for audio recording and
 * transcription using the Deepgram API.
 *
 * @packageDocumentation
 */

// Main hook
export { useAudioRecorder } from './useAudioRecorder';

// Transcription service
export {
  TranscriptionService,
  createTranscriptionService,
  transcriptionService
} from './transcriptionService';

// Audio utilities
export {
  audioBufferToWav,
  isAudioRecordingSupported
} from './utils/audioUtils';

// TypeScript types
export type {
  UseAudioRecorderReturn,
  AudioConstraints,
  TranscriptionOptions,
  TranscriptionResult,
  DeepgramResponse,
  ITranscriptionService,
  AudioUtils
} from './types';
