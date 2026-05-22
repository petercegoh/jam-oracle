export interface HourlyDataPoint {
  hour: string;
  duration_minutes: number;
}

export interface RouteResult {
  index: number;
  summary: string;
  distance: string;
  duration_current: string;
  duration_typical: string;
  hourly_traffic: HourlyDataPoint[];
}

export interface RoutesResponse {
  origin: string;
  destination: string;
  routes: RouteResult[];
}
