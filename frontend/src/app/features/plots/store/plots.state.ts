import { Crop } from '../../crops/store/crops.state';

export type PlotType = 'ground_bed' | 'raised_bed' | 'container' | 'vertical' | 'seedling_tray';

export interface Plot {
  id: string;
  user_id: string;
  name: string;
  plot_type: PlotType;
  rows: number;
  cols: number;
  substrate: string | null;
  watering_days: number[];
  fertilise_days: number[];
  crop_count: number;
  created_at: string;
  updated_at: string;
}

export interface PlotCreate {
  name: string;
  plot_type: PlotType;
  rows: number;
  cols: number;
  substrate?: string;
  watering_days?: number[];
  fertilise_days?: number[];
}

export interface PlotUpdate {
  name?: string;
  substrate?: string;
  watering_days?: number[];
}

export interface PlotSlot {
  id: string;
  plot_id: string;
  crop_id: string;
  row: number;
  col: number;
  sow_date: string;
  created_at: string;
  updated_at: string;
  crop?: Crop;
  watering_days_override: number[] | null;
  watering_interval_weeks: number;
  fertilise_days_override: number[] | null;
  fertilise_interval_weeks: number;
  germination_date: string | null;
}

export interface PlotSlotCreate {
  crop_id: string;
  row: number;
  col: number;
  sow_date: string;
  watering_days_override?: number[] | null;
  watering_interval_weeks?: number;
  fertilise_days_override?: number[] | null;
  fertilise_interval_weeks?: number;
}



export interface PlotSlotUpdate {
  crop_id?: string;
  sow_date?: string;
}

export interface PlotsState {
  plots: Plot[];
  slotsById: Record<string, PlotSlot[]>; // keyed by plot_id
  loading: boolean;
  slotsLoading: boolean;
  error: string | null;
  selectedPlotId: string | null;
}

export const initialPlotsState: PlotsState = {
  plots: [],
  slotsById: {},
  loading: false,
  slotsLoading: false,
  error: null,
  selectedPlotId: null,
};
