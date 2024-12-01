import { 
  Storm, 
  AuroraForecast, 
  SolarActivity, 
  CMEEvent, 
  ImpactTimeEstimate,
  HSSEvent 
} from '../types/spaceWeather';
import dotenv from 'dotenv';

dotenv.config();

interface SpaceWeatherData {
  solarWindSpeed: number;
  kpIndex: number;
  geomagneticStorms: Storm[];
  auroraVisibility: AuroraForecast;
}

class SpaceWeatherService {
  private readonly NASA_API_KEY = process.env.NASA_API_KEY;
  private readonly WEATHER_API_KEY = process.env.WEATHER_API_KEY;

  private getLastWeek(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }

  async getSolarActivityData(): Promise<SolarActivity> {
    try {
      const [cmeResponse, flareResponse, hssResponse] = await Promise.all([
        fetch(
          `https://api.nasa.gov/DONKI/CME?startDate=${this.getLastWeek()}&api_key=${this.NASA_API_KEY}`
        ),
        fetch(
          `https://api.nasa.gov/DONKI/FLR?startDate=${this.getLastWeek()}&api_key=${this.NASA_API_KEY}`
        ),
        fetch(
          `https://api.nasa.gov/DONKI/HSS?startDate=${this.getLastWeek()}&api_key=${this.NASA_API_KEY}`
        )
      ]);
      
      if (!cmeResponse.ok || !flareResponse.ok || !hssResponse.ok) {
        throw new Error('NASA API error');
      }

      const [cmeData, flareData, hssData] = await Promise.all([
        cmeResponse.json(),
        flareResponse.json(),
        hssResponse.json() as Promise<HSSEvent[]>
      ]);

      const allData = [
        ...cmeData,
        ...flareData,
        ...hssData.map((hss: HSSEvent) => ({
          ...hss,
          type: 'HSS',
          speed: hss.speedValue || 400
        }))
      ];

      return this.processSolarData(allData);
    } catch (error) {
      console.error('Error fetching solar activity:', error);
      throw error;
    }
  }

  async getMagneticFieldStrength(latitude: number, longitude: number): Promise<number> {
    const baseStrength = 50000;
    const latitudeEffect = Math.abs(latitude) / 90 * 10000;
    return baseStrength + latitudeEffect;
  }

  private calculateProbability(solarData: SolarActivity, magneticStrength: number): number {
    const cmeIntensity = this.calculateCMEIntensity(solarData.cmeEvents);
    const magneticFactor = magneticStrength / 50000;
    
    return Math.min(cmeIntensity * magneticFactor, 1);
  }

  private calculateCMEIntensity(events: CMEEvent[]): number {
    if (events.length === 0) return 0;
    
    return events.reduce((sum, event) => sum + (event.speed / 1000), 0) / events.length;
  }

  private transformCMEData(rawEvent: any): CMEEvent {
    if (rawEvent.flrID) {
      return {
        startTime: new Date(rawEvent.beginTime || rawEvent.peakTime),
        speed: this.calculateFlareSpeed(rawEvent.classType),
        type: `Solar Flare (${rawEvent.classType || 'Unknown'})`
      };
    } else if (rawEvent.type === 'HSS') {
      return {
        startTime: new Date(rawEvent.eventTime),
        speed: rawEvent.speed || 400,
        type: `High Speed Stream (${rawEvent.sourceLocation || 'Unknown location'})`
      };
    } else {
      const analysis = rawEvent.cmeAnalyses?.[0];
      const speed = analysis?.speed || 
                   analysis?.velocity || 
                   rawEvent.velocityValue || 
                   0;
      
      const type = analysis?.type || 'CME';
      const location = analysis?.sourceLocation || rawEvent.sourceLocation || 'Unknown location';
      
      return {
        startTime: new Date(rawEvent.startTime || rawEvent.activityStartTime),
        speed: speed,
        type: `${type} (${location})`
      };
    }
  }

  private calculateFlareSpeed(classType: string): number {
    if (!classType) return 0;
    
    const magnitude = parseFloat(classType.substring(1));
    const classPrefix = classType.charAt(0).toUpperCase();
    
    switch (classPrefix) {
      case 'X':
        return magnitude * 1000;
      case 'M':
        return magnitude * 100;
      case 'C':
        return magnitude * 10;
      default:
        return 0;
    }
  }

  private calculateImpactTimes(data: any[]): ImpactTimeEstimate[] {
    return data
      .filter(event => event.expectedTimeOfArrival)
      .map(event => ({
        arrivalTime: new Date(event.expectedTimeOfArrival),
        confidence: event.confidence || 0.5
      }));
  }

  private processSolarData(data: any): SolarActivity {
    if (!Array.isArray(data)) {
      return {
        cmeEvents: [],
        estimatedImpactTimes: []
      };
    }

    return {
      cmeEvents: data.map(event => this.transformCMEData(event)),
      estimatedImpactTimes: this.calculateImpactTimes(data)
    };
  }
}

export default SpaceWeatherService; 