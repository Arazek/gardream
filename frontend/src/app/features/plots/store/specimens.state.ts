export const SYSTEM_STAGES = ['germinating', 'seedling', 'vegetative', 'flowering', 'harvest-ready'] as const;
export type SystemStage = (typeof SYSTEM_STAGES)[number];

export interface PhotoEntry {
  url: string;
  filename: string;
  taken_at: string; // ISO date string
  note?: string;
}

export interface NoteEntry {
  text: string;
  date: string; // ISO date string YYYY-MM-DD
}

export interface Milestone {
  stage_name: string;
  expected_day: number;
  actual_day?: number;
  notes?: string;
}

export interface Specimen {
  id: string;
  plot_slot_id: string;
  note_entries: NoteEntry[];
  stage_override?: string;
  photo_log: PhotoEntry[];
  milestones: Milestone[];
  current_stage: string;
  progress_pct: number;
  created_at: string;
  updated_at: string;
}

export interface SpecimenUpdate {
  note_entries?: NoteEntry[];
  stage_override?: string | null;
  photo_log?: PhotoEntry[];
  milestones?: Milestone[];
}

export interface SpecimensState {
  specimensBySlotId: Record<string, Specimen>;
  specimensById: Record<string, Specimen>;
  loading: boolean;
  error: string | null;
}

export const initialSpecimensState: SpecimensState = {
  specimensBySlotId: {},
  specimensById: {},
  loading: false,
  error: null,
};
