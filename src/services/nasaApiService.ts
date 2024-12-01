import dotenv from 'dotenv';

dotenv.config();

export class NasaApiService {
  private readonly NASA_API_KEY = process.env.NASA_API_KEY;
  private readonly BASE_URL = 'https://api.nasa.gov';

  async getEPICImage() {
    const response = await fetch(
      `${this.BASE_URL}/EPIC/api/natural?api_key=${this.NASA_API_KEY}`
    );
    return await response.json();
  }

  async getGeomagneticStorm() {
    const response = await fetch(
      `${this.BASE_URL}/DONKI/GST?api_key=${this.NASA_API_KEY}`
    );
    return await response.json();
  }

  async getSolarFlare() {
    const response = await fetch(
      `${this.BASE_URL}/DONKI/FLR?api_key=${this.NASA_API_KEY}`
    );
    return await response.json();
  }

  async getCoronalMassEjection() {
    const response = await fetch(
      `${this.BASE_URL}/DONKI/CME?api_key=${this.NASA_API_KEY}`
    );
    return await response.json();
  }

  async getSatellitePosition(noradId: string) {
    return { lat: 0, lon: 0, alt: 0 };
  }
} 