import { Component, Input } from '@angular/core';

export interface CurrentWeather {
  temperature: number;
  condition: string;
  icon: string; // WMO weather code or Material symbol name
  humidity: number;
  windSpeed: number;
}

export interface DayForecast {
  day: string;      // e.g. 'Mon'
  icon: string;
  high: number;
  low: number;
  rainMm: number;
}

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  styleUrl: './weather-widget.component.scss',
  template: `
    <div class="weather-widget">
      <div class="weather-widget__current">
        <span class="material-symbols-outlined weather-widget__main-icon">{{ current.icon }}</span>
        <div>
          <p class="weather-widget__temp">{{ current.temperature }}°</p>
          <p class="weather-widget__condition">{{ current.condition }}</p>
        </div>
      </div>

      <div class="weather-widget__forecast">
        @for (day of forecast; track day.day) {
          <div class="weather-widget__day" [class.weather-widget__day--rain]="day.rainMm > 1">
            <p class="weather-widget__day-label">{{ day.day }}</p>
            <span class="material-symbols-outlined weather-widget__day-icon">{{ day.icon }}</span>
            <p class="weather-widget__day-temp">{{ day.high }}° / {{ day.low }}°</p>
            @if (day.rainMm > 1) {
              <span class="material-symbols-outlined weather-widget__rain-icon">water_drop</span>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class WeatherWidgetComponent {
  @Input({ required: true }) current!: CurrentWeather;
  @Input() forecast: DayForecast[] = [];
}
