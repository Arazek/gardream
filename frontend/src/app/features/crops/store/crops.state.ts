export type CropCategory = 'vegetable' | 'herb' | 'fruit' | 'flower';
export type SunRequirement = 'full_sun' | 'partial_shade' | 'shade';

export interface Crop {
  id: string;
  name: string;
  latin_name: string;
  category: CropCategory;
  description: string | null;
  thumbnail_url: string | null;
  days_to_germination: number;
  days_to_harvest: number;
  watering_frequency_days: number;
  fertilise_frequency_days: number;
  prune_frequency_days: number | null;
  prune_start_day: number | null;
  sun_requirement: SunRequirement;
  spacing_cm: number;
  soil_mix: Record<string, unknown> | null;
  companion_crops: string[];
  avoid_crops: string[];
  created_at: string;
  updated_at: string;
}

export interface CropsState {
  items: Crop[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  categoryFilter: CropCategory | null;
}

export const initialCropsState: CropsState = {
  items: [],
  loading: false,
  error: null,
  selectedId: null,
  categoryFilter: null,
};
