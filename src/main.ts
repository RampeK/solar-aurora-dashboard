import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import SpaceWeatherService from './services/spaceWeatherService';
import { AuroraPredictor } from './services/auroraPredictor';
import { VisualizationService } from './services/visualizationService';
import { CMEEvent, SolarActivity } from './types/spaceWeather';
import { createMenu } from './menu';
import { AuroraMap } from './components/AuroraMap';
import { SatelliteTracker } from './components/SatelliteTracker';
import { NasaImageService } from './services/nasaImageService';

interface Location {
  city: string;
  lat: number;
  lon: number;
}

interface Forecast {
  location: Location;
  forecast: any; 
}

async function createDashboard() {
  const weatherService = new SpaceWeatherService();
  const predictor = new AuroraPredictor();
  const visualizer = new VisualizationService();
  const nasaImageService = new NasaImageService();

  const [solarData, apodData] = await Promise.all([
    weatherService.getSolarActivityData(),
    nasaImageService.getAstronomyPictureOfTheDay()
  ]);
  
  const locations = [
    { city: 'Helsinki', lat: 60.17, lon: 24.94 },
    { city: 'Espoo', lat: 60.21, lon: 24.66 },
    { city: 'Vantaa', lat: 60.29, lon: 25.04 },
    { city: 'Tampere', lat: 61.50, lon: 23.79 },
    { city: 'Oulu', lat: 65.01, lon: 25.47 },
    { city: 'Turku', lat: 60.45, lon: 22.27 },
    { city: 'Jyväskylä', lat: 62.24, lon: 25.75 },
    { city: 'Lahti', lat: 60.98, lon: 25.66 },
    { city: 'Kuopio', lat: 62.89, lon: 27.68 },
    { city: 'Rovaniemi', lat: 66.50, lon: 25.73 },
    { city: 'Sodankylä', lat: 67.42, lon: 26.59 },
    { city: 'Inari', lat: 68.91, lon: 27.03 },
    { city: 'Kilpisjärvi', lat: 69.05, lon: 20.79 }
  ];

  const forecasts = locations.map(loc => ({
    location: loc,
    forecast: predictor.calculateAuroraProbability(solarData, loc.lat, loc.lon)
  }));

  const chartConfig = await visualizer.createVisualization(solarData, forecasts[0].forecast);
  
  // Tallenna HTML väliaikaisesti
  const tempPath = path.join(app.getPath('temp'), 'aurora_dashboard.html');
  const htmlContent = generateHtml(chartConfig, forecasts, solarData, apodData);
  fs.writeFileSync(tempPath, htmlContent);
  
  return tempPath;
}

function generateHtml(chartConfig: any, forecasts: Forecast[], solarData: SolarActivity, apodData: any) {
  console.log('Event types:', solarData.cmeEvents.map(e => e.type));

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Aurora Activity Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"></script>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        <style>
          :root {
            --primary: #00ff9d;
            --primary-dark: #00cc7d;
            --secondary: #7000ff;
            --background: #0a0a14;
            --surface: #1a1a24;
            --surface-light: #2a2a34;
            --text: #ffffff;
            --text-secondary: rgba(255, 255, 255, 0.7);
          }

          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            background: var(--background);
            color: var(--text);
            min-height: 100vh;
            background: radial-gradient(circle at top, #1a1a2e 0%, var(--background) 100%);
          }

          .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
          }

          h1, h2, h3 {
            font-family: 'Orbitron', sans-serif;
            color: var(--primary);
            text-transform: uppercase;
            letter-spacing: 2px;
          }

          h1 {
            font-size: 2.5rem;
            text-align: center;
            margin-bottom: 3rem;
            text-shadow: 0 0 15px rgba(0, 255, 157, 0.5);
            animation: glow 2s ease-in-out infinite alternate;
          }

          .dashboard-item {
            background: var(--surface);
            border-radius: 20px;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }

          .dashboard-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 48px rgba(0, 255, 157, 0.2);
          }

          .event-category {
            background: var(--surface-light);
            border-radius: 15px;
            padding: 1.5rem;
            transition: transform 0.3s ease;
          }

          .event-category:hover {
            transform: scale(1.02);
          }

          .event-item {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 1rem;
            border-left: 4px solid;
            transition: all 0.3s ease;
          }

          .event-item:hover {
            transform: translateX(5px);
            background: rgba(255, 255, 255, 0.1);
          }

          .event-item.high { border-color: #ff4444; }
          .event-item.medium { border-color: #ffaa00; }
          .event-item.low { border-color: var(--primary); }

          .event-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .event-speed {
            font-family: 'Orbitron', monospace;
            color: var(--primary);
            background: rgba(0, 255, 157, 0.1);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
          }

          #map {
            height: 600px;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 0 30px rgba(0, 255, 157, 0.2);
          }

          .forecast-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
          }

          .forecast-card {
            background: var(--surface-light);
            border-radius: 15px;
            padding: 1.5rem;
            transition: all 0.3s ease;
          }

          .forecast-card:hover {
            transform: translateY(-5px) scale(1.02);
          }

          .forecast-probability {
            display: inline-block;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 600;
            margin: 1rem 0;
          }

          @keyframes glow {
            from {
              text-shadow: 0 0 10px rgba(0, 255, 157, 0.5);
            }
            to {
              text-shadow: 0 0 20px rgba(0, 255, 157, 0.8),
                           0 0 30px rgba(0, 255, 157, 0.6);
            }
          }

          @keyframes float {
            0% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
            100% {
              transform: translateY(0px);
            }
          }

          .refresh-button {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: var(--text);
            border: none;
            padding: 1rem 2rem;
            border-radius: 30px;
            font-family: 'Orbitron', sans-serif;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 5px 20px rgba(0, 255, 157, 0.3);
          }

          .refresh-button:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 25px rgba(0, 255, 157, 0.4);
          }

          /* Lisää animaatioita */
          .fade-in {
            animation: fadeIn 0.5s ease-out forwards;
            opacity: 0;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Lisää glassmorphism efektejä */
          .glass {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Aurora Activity Dashboard</h1>
          
          <div class="dashboard-item">
            <h2>Aurora Probability Map</h2>
            <div id="map"></div>
          </div>

          <div class="dashboard-item">
            <h2>Solar Activity</h2>
            <div class="solar-events-grid">
              <div class="event-category">
                <h3>Solar Flares</h3>
                <div class="event-list">
                  ${solarData.cmeEvents
                    .filter(event => event.type.startsWith('Solar Flare'))
                    .sort((a, b) => b.speed - a.speed)
                    .slice(0, 3)
                    .map(event => `
                      <div class="event-item ${getEventClass(event.speed)}">
                        <div class="event-header">
                          <span class="event-type">${event.type}</span>
                          <span class="event-speed">${event.speed.toFixed(0)} km/s</span>
                        </div>
                        <div class="event-details">
                          <span class="event-time">${new Date(event.startTime).toLocaleString('fi-FI')}</span>
                          <span class="event-impact ${getImpactClass(event.speed)}">
                            ${event.speed > 800 ? 'Korkea vaikutus' : event.speed > 500 ? 'Keskitaso' : 'Matala vaikutus'}
                          </span>
                        </div>
                      </div>
                    `).join('')}
                </div>
              </div>

              <div class="event-category">
                <h3>Coronal Mass Ejections</h3>
                <div class="event-list">
                  ${solarData.cmeEvents
                    .filter(event => event.type.startsWith('C '))
                    .sort((a, b) => b.speed - a.speed)
                    .slice(0, 3)
                    .map(event => `
                      <div class="event-item ${getEventClass(event.speed)}">
                        <div class="event-header">
                          <span class="event-type">CME ${event.type.slice(2)}</span>
                          <span class="event-speed">${event.speed.toFixed(0)} km/s</span>
                        </div>
                        <div class="event-details">
                          <span class="event-time">${new Date(event.startTime).toLocaleString('fi-FI')}</span>
                          <span class="event-impact ${getImpactClass(event.speed)}">
                            ${event.speed > 800 ? 'Korkea vaikutus' : event.speed > 500 ? 'Keskitaso' : 'Matala vaikutus'}
                          </span>
                        </div>
                      </div>
                    `).join('')}
                </div>
              </div>

              <div class="event-category">
                <h3>High Speed Streams</h3>
                <div class="event-list">
                  ${solarData.cmeEvents
                    .filter(event => event.type.startsWith('High Speed Stream') || event.type.startsWith('S '))
                    .sort((a, b) => b.speed - a.speed)
                    .slice(0, 3)
                    .map(event => `
                      <div class="event-item ${getEventClass(event.speed)}">
                        <div class="event-header">
                          <span class="event-type">${event.type.startsWith('S ') ? 'Stream ' + event.type.slice(2) : event.type}</span>
                          <span class="event-speed">${event.speed.toFixed(0)} km/s</span>
                        </div>
                        <div class="event-details">
                          <span class="event-time">${new Date(event.startTime).toLocaleString('fi-FI')}</span>
                          <span class="event-impact ${getImpactClass(event.speed)}">
                            ${event.speed > 800 ? 'Korkea vaikutus' : event.speed > 500 ? 'Keskitaso' : 'Matala vaikutus'}
                          </span>
                        </div>
                      </div>
                    `).join('')}
                </div>
              </div>
            </div>
          </div>

          <div class="dashboard-item">
            <h2>Aurora Forecasts by Location</h2>
            <div class="forecast-grid">
              ${forecasts
                .sort((a, b) => b.forecast.probability - a.forecast.probability)
                .map(f => {
                  const probabilityClass = f.forecast.probability > 0.7 ? 'high' : 
                                         f.forecast.probability > 0.4 ? 'medium' : 'low';
                  return `
                    <div class="forecast-card ${probabilityClass}">
                      <h3>${f.location.city}</h3>
                      <div class="forecast-probability ${probabilityClass}">
                        ${(f.forecast.probability * 100).toFixed(1)}% todennäköisyys
                      </div>
                      <p><i class="fas fa-map-marker-alt"></i> ${f.location.lat.toFixed(2)}°N, ${f.location.lon.toFixed(2)}°E</p>
                      <p><i class="fas fa-eye"></i> Näkyvyys: ${f.forecast.visibleLatitudeRange.min.toFixed(1)}°N alkaen</p>
                    </div>
                  `;
                }).join('')}
            </div>
          </div>

          <div class="dashboard-item">
            <h2>NASA Astronomy Picture of the Day</h2>
            <div class="apod-container">
              ${apodData.media_type === 'video' 
                ? `<iframe width="100%" height="400" src="${apodData.url}" frameborder="0" allowfullscreen></iframe>`
                : `<img class="apod-image" src="${apodData.url}" alt="${apodData.title}">`
              }
              <div class="apod-info">
                <h3 class="apod-title">${apodData.title}</h3>
                <p class="apod-explanation">${apodData.explanation}</p>
                <p class="apod-date">${new Date(apodData.date).toLocaleDateString()}</p>
                ${apodData.copyright ? `<p class="apod-copyright">© ${apodData.copyright}</p>` : ''}
              </div>
            </div>
          </div>
        </div>

        <button class="refresh-button">
          <i class="fas fa-sync-alt"></i> Refresh Data
        </button>

        <script>
          // Alusta kartta
          document.addEventListener('DOMContentLoaded', function() {
            const map = L.map('map').setView([65, 26], 5);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
              attribution: '© OpenStreetMap contributors, © CARTO'
            }).addTo(map);

            // Lisää ennusteet kartalle
            const forecasts = ${JSON.stringify(forecasts)};
            forecasts.forEach(f => {
              const circle = L.circle([f.location.lat, f.location.lon], {
                color: f.forecast.probability > 0.5 ? '#00ff00' : '#ffff00',
                fillColor: f.forecast.probability > 0.5 ? '#00ff00' : '#ffff00',
                fillOpacity: 0.5,
                radius: 30000 * f.forecast.probability
              }).addTo(map);

              circle.bindPopup(\`
                <h3>\${f.location.city}</h3>
                <p>Probability: \${(f.forecast.probability * 100).toFixed(1)}%</p>
              \`);
            });
          });

          // Alusta kaavio
          const ctx = document.getElementById('auroraChart').getContext('2d');
          new Chart(ctx, ${JSON.stringify(chartConfig)});

          const satelliteTracker = new SatelliteTracker(map);
          satelliteTracker.updatePositions();

          // Päivitä satelliittien sijainnit minuutin välein
          setInterval(() => satelliteTracker.updatePositions(), 60000);

          // Lisää smooth scroll efekti
          document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
              e.preventDefault();
              document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
              });
            });
          });

          // Lisää scroll-triggered animaatiot
          const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px'
          };

          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                if (entry.target.classList.contains('event-category')) {
                  entry.target.style.animationDelay = '0.2s';
                }
              }
            });
          }, observerOptions);

          document.querySelectorAll('.dashboard-item, .event-category, .forecast-card').forEach(el => {
            observer.observe(el);
          });

          // Lisää hover efektit kartalle
          const map = L.map('map');
          map.on('mouseover', () => {
            document.querySelector('#map').style.transform = 'scale(1.01)';
          });
          map.on('mouseout', () => {
            document.querySelector('#map').style.transform = 'scale(1)';
          });
        </script>
      </body>
    </html>
  `;
}

function getEventClass(speed: number): string {
  if (speed > 800) return 'high';
  if (speed > 500) return 'medium';
  return 'low';
}

function getImpactClass(speed: number): string {
  if (speed > 800) return 'high';
  if (speed > 500) return 'medium';
  return 'low';
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  createMenu(win);
  createDashboard().then(htmlPath => {
    win.loadFile(htmlPath);
  });

  // Automaattinen päivitys
  setInterval(() => {
    win.webContents.reload();
  }, 15 * 60 * 1000); // 15 minuutin välein
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 