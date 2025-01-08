import { SolarActivity, CMEEvent, AuroraForecast } from '../types/spaceWeather';

export class AuroraPredictor {
  // Threshold values for aurora predictions
  private readonly KP_INDEX_THRESHOLD = 5;
  private readonly SPEED_IMPACT_FACTOR = 0.001;
  private readonly LOCATION_IMPACT_RANGE = 45; 

  // Calculate aurora probability based on solar activity and location
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

  // Get the most impactful CME events for probability calculation
  private getMostSignificantEvents(events: CMEEvent[]): CMEEvent[] {
    // Sort by speed and take top 3 most significant events
    return events
      .sort((a, b) => b.speed - a.speed)
      .slice(0, 3); 
  }

  // Estimate Kp index based on solar events
  private estimateKpIndex(events: CMEEvent[]): number {
    if (events.length === 0) return 0;

    // Calculate Kp index considering event speed and type
    return events.reduce((kp, event) => {
      let eventKp = event.speed * this.SPEED_IMPACT_FACTOR;
      
      // Adjust for solar flare intensity
      if (event.type.includes('Solar Flare')) {
        if (event.type.includes('X')) eventKp *= 2;
        if (event.type.includes('M')) eventKp *= 1.5;
      }

      return Math.max(kp, eventKp);
    }, 0);
  }

  // Calculate probability based on Kp index and latitude
  private calculateProbability(kpIndex: number, latitude: number): number {
    const absLat = Math.abs(latitude);
    if (absLat < 55) return 0;
    
    // Calculate probability factors based on latitude and Kp index
    const latitudeFactor = (absLat - 55) / 35; 
    const kpFactor = kpIndex / 9; 
    
    return Math.min(latitudeFactor * kpFactor * 100, 100) / 100;
  }

  // Calculate the latitude range where aurora might be visible
  private calculateVisibleLatitudeRange(kpIndex: number): { min: number; max: number } {
    // Minimum latitude decreases as Kp index increases
    const minLatitude = Math.max(65 - (kpIndex * 1.5), 50);
    
    return {
      min: minLatitude,
      max: 90
    };
  }
} 