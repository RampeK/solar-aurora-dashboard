import dotenv from 'dotenv';

dotenv.config();

/**
 * Interface for weather condition data returned by the service.
 */
export interface WeatherData {
  /** Cloud cover percentage (0-100) */
  cloudCover: number;
  /** Moon phase (0-1, where 0=new moon, 0.5=full moon) */
  moonPhase: number;
  /** Temperature in Celsius */
  temperature: number;
  /** Visibility in kilometers */
  visibility: number;
}

/**
 * Service for fetching and processing weather conditions relevant for aurora viewing.
 * Uses OpenWeatherMap API for weather data and calculates additional astronomical factors.
 */
export class WeatherService {
  /** OpenWeatherMap API key from environment variables */
  private readonly API_KEY = process.env.WEATHER_API_KEY;

  /**
   * Fetches current viewing conditions for a specific location.
   * Combines weather data with astronomical calculations.
   * 
   * @param lat - Geographic latitude in degrees (-90 to 90)
   * @param lon - Geographic longitude in degrees (-180 to 180)
   * @returns Promise containing weather and astronomical data
   * @throws Error if API request fails or API key is invalid
   * 
   * @example
   * const conditions = await weatherService.getViewingConditions(
   *   60.17, // Helsinki latitude
   *   24.94  // Helsinki longitude
   * );
   */
  async getViewingConditions(lat: number, lon: number): Promise<WeatherData> {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.API_KEY}`
      );
      const data = await response.json();
      
      return {
        cloudCover: data.list[0].clouds.all,
        moonPhase: this.calculateMoonPhase(new Date()),
        temperature: data.list[0].main.temp - 273.15, // Convert Kelvin to Celsius
        visibility: data.list[0].visibility / 1000    // Convert meters to kilometers
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }

  /**
   * Calculates the current moon phase using astronomical algorithms.
   * Based on lunar cycle calculations.
   * 
   * @param date - Date to calculate moon phase for
   * @returns Moon phase value between 0 and 1
   * @private
   * 
   * @example
   * 0.0 = New Moon
   * 0.25 = First Quarter
   * 0.5 = Full Moon
   * 0.75 = Last Quarter
   */
  private calculateMoonPhase(date: Date): number {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Calculate days since known lunar cycle start
    const c = Math.floor(365.25 * year);
    const e = Math.floor(30.6 * month);
    const jd = c + e + day - 694039.09;
    
    // Calculate phase (0-1)
    const phase = jd / 29.53;
    return phase - Math.floor(phase);
  }
} 