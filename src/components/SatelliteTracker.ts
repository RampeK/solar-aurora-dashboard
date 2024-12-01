import L from 'leaflet';
import { NasaApiService } from '../services/nasaApiService';

const G_CONSTANT = 6.67430e-11; // Gravitaatiovakio
const EARTH_MASS = 5.972e24;    // Maan massa

interface Satellite {
  id: string;
  name: string;
  type: string;
  altitude: number;
}

export class SatelliteTracker {
  private map: L.Map;
  private satellites: L.Marker[] = [];
  private nasaApi: NasaApiService;
  private trajectoryLayers: L.Polyline[] = [];

  private readonly SATELLITES: Satellite[] = [
    { id: '25544', name: 'ISS', type: 'Space Station', altitude: 408 },
    { id: '27424', name: 'NOAA 18', type: 'Weather Satellite', altitude: 854 },
    { id: '33591', name: 'NOAA 19', type: 'Weather Satellite', altitude: 870 },
    { id: '43013', name: 'GOES-17', type: 'Weather Satellite', altitude: 35786 }
  ];

  constructor(map: L.Map) {
    this.map = map;
    this.nasaApi = new NasaApiService();
    this.addSatelliteControl();
  }

  private addSatelliteControl() {
    const control = new L.Control({ position: 'topright' });
    control.onAdd = () => {
      const div = L.DomUtil.create('div', 'satellite-control');
      div.innerHTML = `
        <div class="satellite-list">
          ${this.SATELLITES.map(sat => `
            <div class="satellite-item">
              <input type="checkbox" id="${sat.id}" checked>
              <label for="${sat.id}">${sat.name}</label>
            </div>
          `).join('')}
        </div>
      `;
      
      div.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.toggleSatellite(target.id, target.checked);
      });
      
      return div;
    };
    control.addTo(this.map);
  }

  async updatePositions() {
    this.clearTrajectories();
    this.satellites.forEach(marker => marker.remove());
    this.satellites = [];

    for (const satellite of this.SATELLITES) {
      const position = await this.nasaApi.getSatellitePosition(satellite.id);
      const marker = this.createSatelliteMarker(satellite, position);
      this.satellites.push(marker);

      // Piirrä satelliitin rata
      const trajectory = await this.calculateTrajectory(satellite);
      this.drawTrajectory(trajectory);
    }
  }

  private createSatelliteMarker(satellite: Satellite, position: any): L.Marker {
    const icon = L.divIcon({
      className: 'satellite-icon',
      html: `<div class="satellite-marker" data-type="${satellite.type}">🛰️</div>`,
      iconSize: [20, 20]
    });

    return L.marker([position.lat, position.lon], { icon })
      .bindPopup(`
        <div class="satellite-popup">
          <h3>${satellite.name}</h3>
          <p>Type: ${satellite.type}</p>
          <p>Altitude: ${satellite.altitude} km</p>
          <p>Speed: ${this.calculateOrbitalSpeed(satellite.altitude)} km/s</p>
          <p>Period: ${this.calculateOrbitalPeriod(satellite.altitude)} minutes</p>
        </div>
      `)
      .addTo(this.map);
  }

  private calculateOrbitalSpeed(altitude: number): number {
    // Yksinkertaistettu laskenta
    const R = 6371000 + altitude * 1000; // Etäisyys maan keskipisteestä (m)
    return Math.sqrt(G_CONSTANT * EARTH_MASS / R) / 1000; // Muunna km/s
  }

  private calculateOrbitalPeriod(altitude: number): number {
    const R = 6371 + altitude; // km
    return Math.sqrt(4 * Math.PI * Math.PI * R * R * R / (G_CONSTANT * EARTH_MASS)) / 60; // Minuutteina
  }

  private async calculateTrajectory(satellite: Satellite): Promise<[number, number][]> {
    const points: [number, number][] = [];
    const center = await this.nasaApi.getSatellitePosition(satellite.id);
    
    for (let i = 0; i < 360; i += 5) {
      const rad = i * Math.PI / 180;
      const lat = center.lat + 5 * Math.sin(rad);
      const lon = center.lon + 5 * Math.cos(rad);
      points.push([lat, lon]);
    }
    
    return points;
  }

  private drawTrajectory(points: [number, number][]) {
    const line = L.polyline(points, {
      color: '#00ff00',
      weight: 1,
      opacity: 0.5,
      dashArray: '5, 5'
    }).addTo(this.map);
    
    this.trajectoryLayers.push(line);
  }

  private clearTrajectories() {
    this.trajectoryLayers.forEach(layer => layer.remove());
    this.trajectoryLayers = [];
  }

  private toggleSatellite(id: string, visible: boolean) {
    const satellite = this.satellites.find(s => s.getElement()?.querySelector(`[data-id="${id}"]`));
    if (satellite) {
      if (visible) {
        satellite.addTo(this.map);
      } else {
        satellite.remove();
      }
    }
  }
} 