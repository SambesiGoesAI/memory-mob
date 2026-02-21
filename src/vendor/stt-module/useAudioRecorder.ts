/**
 * Custom React hook for audio recording using MediaRecorder API
 */

import { useState, useRef, useCallback } from 'react';
import type { UseAudioRecorderReturn, AudioConstraints } from './types';

/**
 * Default audio constraints for recording
 */
const DEFAULT_AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    channelCount: 1,
    sampleRate: 16000,
    echoCancellation: true,
    noiseSuppression: true,
  }
};

/**
 * Custom hook for audio recording using Web Audio API
 * @param constraints - Optional audio constraints to override defaults
 * @returns Recording state and control functions
 */
export const useAudioRecorder = (
  constraints: AudioConstraints = {}
): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Start recording audio from the user's microphone
   */
  const startRecording = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      audioChunksRef.current = [];

      // Merge custom constraints with defaults
      const audioConstraints = {
        ...(DEFAULT_AUDIO_CONSTRAINTS.audio as MediaTrackConstraints),
        ...constraints,
      };

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints
      });

      streamRef.current = stream;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      // Collect audio data
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
    }
  }, [constraints]);

  /**
   * Stop recording and return the audio blob
   * @returns Promise that resolves to the recorded audio blob
   */
  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current) {
        reject(new Error('No active recording'));
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        // Create blob from recorded chunks
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm;codecs=opus'
        });

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        setIsRecording(false);
        resolve(audioBlob);
      };

      mediaRecorderRef.current.onerror = (event: Event) => {
        const error = event as ErrorEvent;
        reject(new Error('Recording error: ' + (error.message || 'Unknown error')));
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  /**
   * Cancel the current recording without saving
   */
  const cancelRecording = useCallback((): void => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      audioChunksRef.current = [];
      setIsRecording(false);
    }
  }, [isRecording]);

  return {
    isRecording,
    error,
    startRecording,
    stopRecording,
    cancelRecording
  };
};
