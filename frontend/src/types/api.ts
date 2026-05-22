export type Mode = "driving" | "transit";

export interface Suggestion {
  description: string;
  place_id: string;
}

export interface HourlyDataPoint {
  hour: string;
  duration_minutes: number;
}

export interface TransitLeg {
  line_name: string;
  short_name: string;
  vehicle_type: string;
  num_stops: number;
  departure_stop: string;
  arrival_stop: string;
}

export interface RouteResult {
  index: number;
  summary: string;
  distance: string;
  duration_current: string;
  duration_typical: string;
  hourly_traffic: HourlyDataPoint[];
  transit_legs: TransitLeg[] | null;
  transfers: number | null;
}

export interface RoutesResponse {
  origin: string;
  destination: string;
  routes: RouteResult[];
}
