import { SolarActivity } from '../types/spaceWeather';

interface ActivityStats {
  monthlyActivity: { [key: string]: number };
  bestViewingLocations: Array<{ location: string; probability: number }>;
  peakTimes: Array<{ time: Date; intensity: number }>;
  seasonalPatterns: { [season: string]: number };
}

// Service for analyzing historical aurora activity data
export class StatisticsService {
  // Generate comprehensive activity statistics
  analyzeAuroraActivity(historicalData: SolarActivity[]): ActivityStats {
    return {
      monthlyActivity: this.calculateMonthlyActivity(historicalData),
      bestViewingLocations: this.findBestLocations(historicalData),
      peakTimes: this.findPeakTimes(historicalData),
      seasonalPatterns: this.analyzeSeasonalPatterns(historicalData)
    };
  }

  // Calculate activity levels by month
  private calculateMonthlyActivity(data: SolarActivity[]): { [key: string]: number } {
    const monthly: { [key: string]: number } = {};
    
    data.forEach(activity => {
      activity.cmeEvents.forEach(event => {
        const date = new Date(event.startTime);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        monthly[monthKey] = (monthly[monthKey] || 0) + event.speed;
      });
    });
    
    return monthly;
  }

  // Determine best viewing locations based on historical data
  private findBestLocations(data: SolarActivity[]): Array<{ location: string; probability: number }> {
    // Implement location analysis based on historical data
    return [];
  }

  // Find peak activity times from historical data
  private findPeakTimes(data: SolarActivity[]): Array<{ time: Date; intensity: number }> {
    const peaks = data.flatMap(activity =>
      activity.cmeEvents
        .filter(event => event.speed > 800)
        .map(event => ({
          time: new Date(event.startTime),
          intensity: event.speed / 1000
        }))
    );
    
    return peaks.sort((a, b) => b.intensity - a.intensity);
  }

  // Analyze seasonal patterns in aurora activity
  private analyzeSeasonalPatterns(data: SolarActivity[]): { [season: string]: number } {
    const seasons: { [key: string]: number } = {
      winter: 0,
      spring: 0,
      summer: 0,
      fall: 0
    };
    
    // Implement seasonal analysis
    return seasons;
  }
} 