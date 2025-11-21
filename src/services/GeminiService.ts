/**
 * GeminiService
 *
 * Centralized service for rating jokes using Google's Gemini AI API.
 * Implements rate limiting to prevent API abuse and provides intelligent
 * joke rating with feedback messages.
 */

import type { JokeRating } from '../types/comedy';

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class GeminiService {
  private readonly API_KEY: string;
  private readonly API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
  private lastRequestTime: number = 0;
  private readonly RATE_LIMIT_MS = 60000; // 1 minute

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY is not configured. Please add it to your .env file.');
    }
    this.API_KEY = apiKey;
  }

  async rateJoke(jokeText: string): Promise<JokeRating> {
    // Validate input
    if (!jokeText || jokeText.trim().length === 0) {
      throw new Error('Joke text cannot be empty');
    }

    if (jokeText.length > 500) {
      throw new Error('Joke text cannot exceed 500 characters');
    }

    // Check rate limit
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
      const remainingSeconds = Math.ceil((this.RATE_LIMIT_MS - timeSinceLastRequest) / 1000);
      throw new Error(`Please wait ${remainingSeconds} seconds before telling another joke.`);
    }

    try {
      const prompt = `Rate this joke on a scale of 1-10 for humor. Respond with ONLY a number between 1 and 10.

Joke: "${jokeText}"

Rating (1-10):`;

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.API_KEY,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt,
            }],
          }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`AI service error: ${errorData.error?.message || response.statusText}`);
      }

      const data: GeminiResponse = await response.json();
      const ratingText = data.candidates[0]?.content?.parts[0]?.text || '5';
      
      // Extract rating number
      const ratingMatch = ratingText.match(/\d+/);
      let rating = ratingMatch ? parseInt(ratingMatch[0], 10) : 5;
      
      // Clamp to 1-10 range
      rating = Math.max(1, Math.min(10, rating));

      // Update last request time
      this.lastRequestTime = now;

      return {
        rating,
        feedback: this.generateFeedback(rating),
        jokeText,
        timestamp: now,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('wait')) {
        throw error; // Re-throw rate limit errors
      }
      
      console.error('Gemini API error:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to AI service. Please try again later.');
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to rate joke. Please try again.');
    }
  }

  private generateFeedback(rating: number): string {
    if (rating >= 9) {
      return 'Hilarious! 🤣';
    } else if (rating >= 7) {
      return 'Pretty funny! 😄';
    } else if (rating >= 4) {
      return 'Getting there, but needs work!';
    } else {
      return 'Not quite funny enough...';
    }
  }
}

// Singleton instance
export const geminiService = new GeminiService();

