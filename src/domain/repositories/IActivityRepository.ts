import { Activity, ActivityDraft } from '@domain/entities/Activity';

export interface IActivityRepository {
  list(): Promise<Activity[]>;
  create(draft: ActivityDraft): Promise<Activity>;
  update(id: string, draft: ActivityDraft): Promise<Activity>;
  remove(id: string): Promise<void>;
}
