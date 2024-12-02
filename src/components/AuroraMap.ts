import L from 'leaflet';
import { AuroraForecast } from '../types/spaceWeather';
import { finnishCities } from '../config/cities';

export class AuroraMap {
  private map: L.Map;
  private probabilityLayer: L.LayerGroup;
  private auroraOverlay: L.LayerGroup;
  private animationFrame: number | null = null;

  constructor(containerId: string) {
    this.map = L.map(containerId).setView([65, 26], 5);
    
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors, © CARTO'
    }).addTo(this.map);

    this.probabilityLayer = L.layerGroup().addTo(this.map);
    this.auroraOverlay = L.layerGroup().addTo(this.map);

    
    const overlays = {
      "Probability": this.probabilityLayer,
      "Aurora Band": this.auroraOverlay
    };
    L.control.layers({}, overlays).addTo(this.map);

    
    this.drawAuroraZones();
  }

  updateProbabilities(forecasts: { location: { lat: number; lon: number; city: string }, forecast: AuroraForecast }[]) {
    this.probabilityLayer.clearLayers();
    this.animateAuroraBand(forecasts);

    forecasts.forEach(({ location, forecast }) => {
      const color = this.getProbabilityColor(forecast.probability);
      const radius = 30000 * forecast.probability;

      const circle = L.circle([location.lat, location.lon], {
        color: color,
        fillColor: color,
        fillOpacity: 0.5,
        radius: radius
      }).addTo(this.probabilityLayer);

      this.pulseMarker(circle, forecast.probability);

      const popup = L.popup({
        className: 'aurora-popup'
      }).setContent(`
        <div class="popup-content">
          <h3 class="location-title">${location.city}</h3>
          <div class="forecast-details">
            <div class="forecast-item">
              <i class="fas fa-percentage"></i>
              <div class="probability-bar" style="background: linear-gradient(to right, ${color} ${forecast.probability * 100}%, transparent ${forecast.probability * 100}%)">
                <span class="value">${(forecast.probability * 100).toFixed(1)}%</span>
                <span class="label">todennäköisyys</span>
              </div>
            </div>
            
            <div class="forecast-item">
              <i class="fas fa-map-marker-alt"></i>
              <div class="coordinates">
                <span class="value">${location.lat.toFixed(2)}°N, ${location.lon.toFixed(2)}°E</span>
                <span class="label">sijainti</span>
              </div>
            </div>

            <div class="forecast-item">
              <i class="fas fa-eye"></i>
              <div class="visibility">
                <span class="value">Näkyvyys ${forecast.visibleLatitudeRange.min.toFixed(1)}°N alkaen</span>
                <span class="label">näkyvyysalue</span>
              </div>
            </div>

            <div class="forecast-item">
              <i class="fas fa-clock"></i>
              <div class="viewing-time">
                <span class="value">${this.calculateBestViewingTime(forecast)}</span>
                <span class="label">paras katseluaika</span>
              </div>
            </div>
          </div>
        </div>
      `);

      circle.bindPopup(popup);
    });
  }

  private pulseMarker(circle: L.Circle, probability: number) {
    let size = 1;
    let growing = true;

    const animate = () => {
      if (growing) {
        size += 0.01;
        if (size >= 1.2) growing = false;
      } else {
        size -= 0.01;
        if (size <= 1) growing = true;
      }

      circle.setRadius(circle.getRadius() * size);
      
      if (probability > 0.4) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  private animateAuroraBand(forecasts: any[]) {
    this.auroraOverlay.clearLayers();
    let phase = 0;

    const animate = () => {
      this.auroraOverlay.clearLayers();
      const avgLat = this.calculateAuroraBandLatitude(forecasts);
      
      
      for (let lon = -180; lon <= 180; lon += 2) {
        const waveLat = avgLat + Math.sin(lon / 30 + phase) * 2;
        const point = L.circle([waveLat, lon], {
          radius: 50000,
          color: '#00ff00',
          fillColor: '#00ff00',
          fillOpacity: 0.3,
          weight: 0
        }).addTo(this.auroraOverlay);
      }

      phase += 0.02;
      this.animationFrame = requestAnimationFrame(animate);
    };

    animate();
  }

  private calculateAuroraBandLatitude(forecasts: any[]): number {
    const highProbForecasts = forecasts.filter(f => f.forecast.probability > 0.5);
    if (highProbForecasts.length === 0) return 65;
    
    return highProbForecasts.reduce((sum, f) => sum + f.location.lat, 0) / highProbForecasts.length;
  }

  private calculateBestViewingTime(forecast: AuroraForecast): string {
    const now = new Date();
    const sunset = this.calculateSunset(now);
    const sunrise = this.calculateSunrise(now);
    
    if (forecast.probability > 0.7) {
      return `${sunset.toLocaleTimeString()} - ${sunrise.toLocaleTimeString()}`;
    } else {
      const midnight = new Date(now.setHours(0, 0, 0, 0));
      const bestStart = new Date(midnight.setHours(22));
      const bestEnd = new Date(midnight.setHours(2));
      return `${bestStart.toLocaleTimeString()} - ${bestEnd.toLocaleTimeString()}`;
    }
  }

  private calculateSunset(date: Date): Date {
    const sunset = new Date(date);
    sunset.setHours(21, 0, 0);
    return sunset;
  }

  private calculateSunrise(date: Date): Date {
    const sunrise = new Date(date);
    sunrise.setHours(6, 0, 0);
    return sunrise;
  }

  private getProbabilityColor(probability: number): string {
    if (probability > 0.7) return '#00ff00';
    if (probability > 0.4) return '#ffff00';
    return '#ff0000';
  }

  cleanup() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  private drawAuroraZones() {
    const zones = [
      { lat: 67, probability: 0.8, color: '#00ff00' },
      { lat: 65, probability: 0.6, color: '#40ff00' },
      { lat: 63, probability: 0.4, color: '#80ff00' },
      { lat: 61, probability: 0.2, color: '#c0ff00' }
    ];

    zones.forEach(zone => {
      L.polyline([
        [zone.lat, -180],
        [zone.lat, 180]
      ], {
        color: zone.color,
        weight: 2,
        opacity: 0.6,
        dashArray: '5, 10'
      }).addTo(this.map)
      .bindTooltip(`Todennäköisyys: ${(zone.probability * 100).toFixed(0)}%`, {
        permanent: true,
        direction: 'right'
      });
    });
  }
} 