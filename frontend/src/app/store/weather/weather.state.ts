export interface CurrentWeather {
  temperature: number;
  weather_code: number;
  condition: string;
  icon: string;
  humidity: number;
  wind_speed: number;
}

export interface DayForecast {
  date: string;
  weather_code: number;
  condition: string;
  icon: string;
  temp_max: number;
  temp_min: number;
  precipitation_mm: number;
  precipitation_probability: number;
  rain_expected: boolean;
}

export interface WeatherData {
  current: CurrentWeather;
  forecast: DayForecast[];
  latitude: number;
  longitude: number;
}

export interface WeatherState {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;   // ISO timestamp
}

export const initialWeatherState: WeatherState = {
  data: null,
  loading: false,
  error: null,
  lastUpdated: null,
};
