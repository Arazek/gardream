import { createReducer, on } from '@ngrx/store';
import { ExampleActions } from './example.actions';
import { ExampleState, initialExampleState } from './example.state';

export const exampleReducer = createReducer(
  initialExampleState,

  on(ExampleActions.loadItems, (state) => ({
    ...state, loading: true, error: null,
  })),
  on(ExampleActions.loadItemsSuccess, (state, { items }) => ({
    ...state, items, loading: false,
  })),
  on(ExampleActions.loadItemsFailure, (state, { error }) => ({
    ...state, error, loading: false,
  })),

  on(ExampleActions.createItemSuccess, (state, { item }) => ({
    ...state, items: [...state.items, item],
  })),

  on(ExampleActions.updateItemSuccess, (state, { item }) => ({
    ...state,
    items: state.items.map((i) => (i.id === item.id ? item : i)),
  })),

  on(ExampleActions.deleteItemSuccess, (state, { id }) => ({
    ...state,
    items: state.items.filter((i) => i.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId,
  })),

  on(ExampleActions.selectItem, (state, { id }) => ({
    ...state, selectedId: id,
  })),
);
