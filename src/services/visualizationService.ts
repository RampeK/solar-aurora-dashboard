import { 
  Chart, 
  ChartConfiguration,
  registerables
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { SolarActivity, AuroraForecast } from '../types/spaceWeather';
import { BubbleDataPoint } from 'chart.js';

Chart.register(...registerables, ChartDataLabels);

export class VisualizationService {
  createVisualization(solarData: SolarActivity, forecast: AuroraForecast): ChartConfiguration {
    const events = solarData.cmeEvents
      .filter(event => event.speed > 0)
      .sort((a, b) => b.speed - a.speed);

    const solarFlares = events.filter(e => e.type.includes('Solar Flare'));
    const cmes = events.filter(e => e.type.includes('CME'));
    const hss = events.filter(e => e.type.includes('HSS'));

    return {
      type: 'bubble',
      data: {
        datasets: [
          {
            label: 'Solar Flares',
            data: solarFlares.map(event => ({
              x: new Date(event.startTime).getTime(),
              y: event.speed,
              r: event.speed / 50
            } as BubbleDataPoint)),
            backgroundColor: 'rgba(255, 0, 0, 0.6)'
          },
          {
            label: 'Coronal Mass Ejections',
            data: cmes.map(event => ({
              x: new Date(event.startTime).getTime(),
              y: event.speed,
              r: event.speed / 50
            } as BubbleDataPoint)),
            backgroundColor: 'rgba(255, 165, 0, 0.6)'
          },
          {
            label: 'High Speed Streams',
            data: hss.map(event => ({
              x: new Date(event.startTime).getTime(),
              y: event.speed,
              r: event.speed / 50
            } as BubbleDataPoint)),
            backgroundColor: 'rgba(0, 255, 255, 0.6)'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Solar Activity Timeline',
            color: '#00ff00',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'top',
            labels: { color: '#fff' }
          }
        },
        scales: {
          x: {
            type: 'time',
            adapters: {
              date: {
                locale: 'fi'
              }
            },
            time: {
              unit: 'day',
              displayFormats: {
                day: 'dd.MM.yyyy'
              }
            },
            grid: { color: '#333' },
            ticks: { 
              color: '#fff',
              callback: function(value) {
                return new Date(value).toLocaleDateString('fi-FI');
              }
            }
          },
          y: {
            title: {
              display: true,
              text: 'Speed (km/s)',
              color: '#fff'
            },
            grid: { color: '#333' },
            ticks: { color: '#fff' }
          }
        }
      }
    };
  }

  createKpIndexVisualization(kpData: number[]): ChartConfiguration {
    return {
      type: 'line',
      data: {
        labels: Array.from({length: 24}, (_, i) => `${i}:00`),
        datasets: [{
          label: 'Kp Index',
          data: kpData,
          borderColor: '#00ff00',
          backgroundColor: 'rgba(0, 255, 0, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Geomagnetic Activity (Kp Index)',
            color: '#00ff00'
          }
        },
        scales: {
          y: {
            min: 0,
            max: 9,
            grid: { color: '#333' },
            ticks: { color: '#fff' }
          }
        }
      }
    };
  }

  private getGradientColor(speed: number): string {
    const intensity = Math.min(speed / 2000, 1);
    const r = Math.round(255);
    const g = Math.round(255 * (1 - intensity));
    const b = 0;
    return `rgba(${r}, ${g}, ${b}, 0.7)`;
  }
} 