/**
 * Transcription service layer for Deepgram API integration
 * This service can be easily swapped out for other providers (Google, AWS, Azure, etc.)
 */

import type {
  TranscriptionOptions,
  TranscriptionResult,
  ITranscriptionService,
  DeepgramResponse
} from './types';

const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1/listen';

/**
 * Transcription service class for Deepgram API
 */
export class TranscriptionService implements ITranscriptionService {
  private apiKey: string;

  constructor(apiKey: string = '') {
    this.apiKey = apiKey;
  }

  /**
   * Set or update the API key
   * @param apiKey - Deepgram API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Transcribe an audio blob using Deepgram API
   * @param audioBlob - Audio data to transcribe
   * @param options - Transcription options
   * @returns Transcription result with transcript, confidence, and raw response
   * @throws Error if API key is not set or if API request fails
   */
  async transcribe(
    audioBlob: Blob,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    if (!this.apiKey) {
      throw new Error('API key not set. Please provide a Deepgram API key.');
    }

    const {
      language = 'en-US',
      punctuate = true,
      model = 'nova-2',
      smartFormat = true
    } = options;

    try {
      // Build query parameters
      const params = new URLSearchParams({
        language,
        punctuate: punctuate.toString(),
        model,
        smart_format: smartFormat.toString()
      });

      // Make API request
      const response = await fetch(`${DEEPGRAM_API_URL}?${params}`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': audioBlob.type || 'audio/webm'
        },
        body: audioBlob
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as { message?: string }).message ||
          `Deepgram API error: ${response.status} ${response.statusText}`
        );
      }

      const data: DeepgramResponse = await response.json();

      // Extract transcript from response
      const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
      const confidence = data.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

      return {
        transcript,
        confidence,
        raw: data
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if the service is configured
   * @returns True if API key is set
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

/**
 * Factory function to create a new transcription service instance
 * Useful for testing or using multiple API keys
 * @param apiKey - Deepgram API key
 * @returns New TranscriptionService instance
 */
export const createTranscriptionService = (apiKey: string): TranscriptionService => {
  return new TranscriptionService(apiKey);
};

/**
 * Default singleton instance
 * Note: In a module context, you'll need to initialize this with your API key
 */
export const transcriptionService = new TranscriptionService();

export default transcriptionService;
