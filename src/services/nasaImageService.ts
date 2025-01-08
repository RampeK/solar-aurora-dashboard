import dotenv from 'dotenv';

dotenv.config();

// Interface for NASA's Astronomy Picture of the Day API response
interface APODResponse {
  title: string;
  explanation: string;
  url: string;
  media_type: string;
  date: string;
  copyright?: string;
}

export class NasaImageService {
  // Use provided API key or fallback to demo key
  private readonly NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';

  // Fetch NASA's Astronomy Picture of the Day
  async getAstronomyPictureOfTheDay(): Promise<APODResponse> {
    try {
      const response = await fetch(
        `https://api.nasa.gov/planetary/apod?api_key=${this.NASA_API_KEY}`
      );
      const data = await response.json();
      
      // Warn if using demo key and hitting rate limits
      if (response.status === 429) {
        console.warn(
          'Demo API key rate limit exceeded. Get your own API key from https://api.nasa.gov/ ' +
          'for higher limits.'
        );
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching APOD:', error);
      throw error;
    }
  }
} 