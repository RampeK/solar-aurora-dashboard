import dotenv from 'dotenv';

dotenv.config();

export interface WeatherData {
  cloudCover: number;
  moonPhase: number;
  temperature: number;
  visibility: number;
}

export class WeatherService {
  private readonly API_KEY = process.env.WEATHER_API_KEY;

  async getViewingConditions(lat: number, lon: number): Promise<WeatherData> {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.API_KEY}`
      );
      const data = await response.json();
      
      return {
        cloudCover: data.list[0].clouds.all,
        moonPhase: this.calculateMoonPhase(new Date()),
        temperature: data.list[0].main.temp - 273.15, // Kelvin to Celsius
        visibility: data.list[0].visibility / 1000 // meters to kilometers
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }

  private calculateMoonPhase(date: Date): number {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    const c = Math.floor(365.25 * year);
    const e = Math.floor(30.6 * month);
    const jd = c + e + day - 694039.09;
    const phase = jd / 29.53;
    
    return phase - Math.floor(phase);
  }
} 