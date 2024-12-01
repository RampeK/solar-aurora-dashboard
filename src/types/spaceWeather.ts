export interface SpaceWeatherData {
  solarWindSpeed: number;
  kpIndex: number;
  geomagneticStorms: Storm[];
  auroraVisibility: AuroraForecast;
}

export interface Storm {
  startTime: Date;
  intensity: number;
  type: 'CME' | 'SolarWind';
  location: GeoLocation;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface AuroraForecast {
  probability: number;
  visibleLatitudeRange: {
    min: number;
    max: number;
  };
}

export interface SolarActivity {
  cmeEvents: CMEEvent[];
  estimatedImpactTimes: ImpactTimeEstimate[];
}

export interface CMEEvent {
  startTime: Date;
  speed: number;
  type: string;
}

export interface ImpactTimeEstimate {
  arrivalTime: Date;
  confidence: number;
}

export interface TimeRange {
  start: Date;
  end: Date;
  probability: number;
}

export interface HSSEvent {
  eventTime: string;
  sourceLocation: string;
  speedValue?: number;
  [key: string]: any;
} 