import dotenv from 'dotenv';

dotenv.config();

export class NasaApiService {
  // NASA API configuration
  private readonly NASA_API_KEY = process.env.NASA_API_KEY;
  private readonly BASE_URL = 'https://api.nasa.gov';

  // Fetch Earth Polychromatic Imaging Camera data
  async getEPICImage() {
    const response = await fetch(
      `${this.BASE_URL}/EPIC/api/natural?api_key=${this.NASA_API_KEY}`
    );
    return await response.json();
  }

  // Fetch geomagnetic storm data from DONKI API
  async getGeomagneticStorm() {
    const response = await fetch(
      `${this.BASE_URL}/DONKI/GST?api_key=${this.NASA_API_KEY}`
    );
    return await response.json();
  }

  // Fetch solar flare data from DONKI API
  async getSolarFlare() {
    const response = await fetch(
      `${this.BASE_URL}/DONKI/FLR?api_key=${this.NASA_API_KEY}`
    );
    return await response.json();
  }

  // Fetch Coronal Mass Ejection data from DONKI API
  async getCoronalMassEjection() {
    const response = await fetch(
      `${this.BASE_URL}/DONKI/CME?api_key=${this.NASA_API_KEY}`
    );
    return await response.json();
  }

  // Get satellite position by NORAD ID (placeholder implementation)
  async getSatellitePosition(noradId: string) {
    return { lat: 0, lon: 0, alt: 0 };
  }
} 