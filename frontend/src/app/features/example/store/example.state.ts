export interface ExampleItem {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface ExampleState {
  items: ExampleItem[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
}

export const initialExampleState: ExampleState = {
  items: [],
  loading: false,
  error: null,
  selectedId: null,
};
