import { AuroraPredictor } from '../services/auroraPredictor';
import { SolarActivity } from '../types/spaceWeather';

describe('AuroraPredictor', () => {
  let predictor: AuroraPredictor;
  
  beforeEach(() => {
    predictor = new AuroraPredictor();
  });

  test('should calculate higher probability for northern locations', () => {
    const mockSolarActivity: SolarActivity = {
      cmeEvents: [
        {
          startTime: new Date(),
          speed: 800,
          type: 'CME'
        }
      ],
      estimatedImpactTimes: []
    };

    const southernForecast = predictor.calculateAuroraProbability(
      mockSolarActivity,
      60.17, // Helsinki
      24.94
    );

    const northernForecast = predictor.calculateAuroraProbability(
      mockSolarActivity,
      68.91, // Inari
      27.03
    );

    expect(northernForecast.probability).toBeGreaterThan(southernForecast.probability);
  });

  test('should return zero probability for locations below 55 degrees', () => {
    const mockSolarActivity: SolarActivity = {
      cmeEvents: [
        {
          startTime: new Date(),
          speed: 800,
          type: 'CME'
        }
      ],
      estimatedImpactTimes: []
    };

    const forecast = predictor.calculateAuroraProbability(
      mockSolarActivity,
      50.0, // Too South
      24.94
    );

    expect(forecast.probability).toBe(0);
  });

  test('should calculate visible latitude range correctly', () => {
    const mockSolarActivity: SolarActivity = {
      cmeEvents: [
        {
          startTime: new Date(),
          speed: 1200, // Strong CME
          type: 'CME'
        }
      ],
      estimatedImpactTimes: []
    };

    const forecast = predictor.calculateAuroraProbability(
      mockSolarActivity,
      65.0,
      25.0
    );

    expect(forecast.visibleLatitudeRange.min).toBeLessThan(65);
    expect(forecast.visibleLatitudeRange.max).toBe(90);
  });
});