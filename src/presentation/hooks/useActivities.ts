import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityDraft } from '@domain/entities/Activity';
import { useContainer } from './useContainer';

const KEY = ['activities'];

export function useActivities() {
  const { listActivities } = useContainer();
  return useQuery({ queryKey: KEY, queryFn: () => listActivities.execute() });
}

export function useActivityMutations() {
  const { saveActivity, deleteActivity } = useContainer();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (draft: ActivityDraft) => saveActivity.create(draft),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, draft }: { id: string; draft: ActivityDraft }) =>
      saveActivity.update(id, draft),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteActivity.execute(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
