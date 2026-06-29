import { create } from 'zustand';
import { City } from '@domain/entities/City';

interface SelectionState {
  city: City | null;
  activityId: string | null;
  setCity: (city: City) => void;
  setActivityId: (id: string) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  city: null,
  activityId: 'preset-walk',
  setCity: (city) => set({ city }),
  setActivityId: (activityId) => set({ activityId }),
}));
