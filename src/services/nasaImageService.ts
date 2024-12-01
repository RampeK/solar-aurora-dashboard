import dotenv from 'dotenv';

dotenv.config();

interface APODResponse {
  title: string;
  explanation: string;
  url: string;
  media_type: string;
  date: string;
  copyright?: string;
}

export class NasaImageService {
  private readonly NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';

  async getAstronomyPictureOfTheDay(): Promise<APODResponse> {
    try {
      const response = await fetch(
        `https://api.nasa.gov/planetary/apod?api_key=${this.NASA_API_KEY}`
      );
      const data = await response.json();
      
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