import { SolarActivity, CMEEvent, AuroraForecast } from '../types/spaceWeather';

/**
 * Service for calculating aurora borealis viewing probabilities and visibility ranges.
 * Combines solar activity data with geographical location to predict aurora visibility.
 * 
 * Probability calculation is based on:
 * - Geographic latitude (higher probability in northern locations)
 * - Solar activity (CME events and their speeds)
 * - Solar flare classifications (X and M class flares)
 * - Kp index estimation
 */
export class AuroraPredictor {
  /** Minimum Kp index threshold for potential aurora visibility */
  private readonly KP_INDEX_THRESHOLD = 5;

  /** Multiplier used to convert solar wind speed to probability impact */
  private readonly SPEED_IMPACT_FACTOR = 0.001;

  /** Latitude range in degrees where location affects probability calculation */
  private readonly LOCATION_IMPACT_RANGE = 45;

  /**
   * Calculates aurora visibility probability and range for a specific location.
   * 
   * @param solarActivity - Current solar activity data including CME events
   * @param latitude - Geographic latitude in degrees (-90 to 90)
   * @param longitude - Geographic longitude in degrees (-180 to 180)
   * @returns {AuroraForecast} Forecast containing probability (0-1) and visibility range
   * 
   * @example
   * const forecast = predictor.calculateAuroraProbability(
   *   solarActivity,
   *   65.01, // Oulu latitude
   *   25.47  // Oulu longitude
   * );
   */
  calculateAuroraProbability(
    solarActivity: SolarActivity,
    latitude: number,
    longitude: number
  ): AuroraForecast {
    const mostSignificantEvents = this.getMostSignificantEvents(solarActivity.cmeEvents);
    const kpEstimate = this.estimateKpIndex(mostSignificantEvents);
    
    return {
      probability: this.calculateProbability(kpEstimate, latitude),
      visibleLatitudeRange: this.calculateVisibleLatitudeRange(kpEstimate)
    };
  }

  /**
   * Filters and sorts CME events by significance.
   * Returns the top 3 most impactful events based on speed.
   * 
   * @param events - Array of CME events to analyze
   * @returns Array of up to 3 most significant CME events
   * @private
   */
  private getMostSignificantEvents(events: CMEEvent[]): CMEEvent[] {
    return events
      .sort((a, b) => b.speed - a.speed)
      .slice(0, 3);
  }

  /**
   * Estimates Kp index based on solar events.
   * Takes into account event speed and type (solar flare classifications).
   * 
   * @param events - Array of significant CME events
   * @returns Estimated Kp index (0-9)
   * @private
   */
  private estimateKpIndex(events: CMEEvent[]): number {
    if (events.length === 0) return 0;

    return events.reduce((kp, event) => {
      let eventKp = event.speed * this.SPEED_IMPACT_FACTOR;
      
      // Adjust for solar flare intensity
      if (event.type.includes('Solar Flare')) {
        if (event.type.includes('X')) eventKp *= 2;      // X-class flares
        if (event.type.includes('M')) eventKp *= 1.5;    // M-class flares
      }

      return Math.max(kp, eventKp);
    }, 0);
  }

  /**
   * Calculates aurora viewing probability based on Kp index and latitude.
   * Returns 0 for locations below 55 degrees latitude.
   * 
   * @param kpIndex - Estimated Kp index
   * @param latitude - Geographic latitude
   * @returns Probability between 0 and 1
   * @private
   */
  private calculateProbability(kpIndex: number, latitude: number): number {
    const absLat = Math.abs(latitude);
    if (absLat < 55) return 0;
    
    const latitudeFactor = (absLat - 55) / 35;
    const kpFactor = kpIndex / 9;
    
    return Math.min(latitudeFactor * kpFactor * 100, 100) / 100;
  }

  /**
   * Calculates the latitude range where aurora might be visible.
   * Range expands southward as Kp index increases.
   * 
   * @param kpIndex - Estimated Kp index
   * @returns Object containing minimum and maximum visible latitudes
   * @private
   */
  private calculateVisibleLatitudeRange(kpIndex: number): { min: number; max: number } {
    const minLatitude = Math.max(65 - (kpIndex * 1.5), 50);
    
    return {
      min: minLatitude,
      max: 90
    };
  }
} 