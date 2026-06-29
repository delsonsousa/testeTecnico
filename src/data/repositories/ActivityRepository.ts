import { Activity, ActivityDraft } from '@domain/entities/Activity';
import { IActivityRepository } from '@domain/repositories/IActivityRepository';
import { ACTIVITY_PRESETS } from '@domain/services/activityPresets';
import { IKeyValueStore } from '@infrastructure/cache/IKeyValueStore';
import { NotFoundError } from '@shared/errors/AppError';

export class ActivityRepository implements IActivityRepository {
  private static readonly KEY = '@testetecnico/custom-activities';

  constructor(private readonly store: IKeyValueStore) {}

  async list(): Promise<Activity[]> {
    const custom = await this.readCustom();
    return [...ACTIVITY_PRESETS, ...custom];
  }

  async create(draft: ActivityDraft): Promise<Activity> {
    const custom = await this.readCustom();
    const activity: Activity = {
      ...draft,
      id: `custom-${Date.now()}`,
      isPreset: false,
    };
    await this.writeCustom([...custom, activity]);
    return activity;
  }

  async update(id: string, draft: ActivityDraft): Promise<Activity> {
    const custom = await this.readCustom();
    const index = custom.findIndex((a) => a.id === id);
    if (index === -1) throw new NotFoundError('Atividade não encontrada.');
    const updated: Activity = { ...draft, id, isPreset: false };
    custom[index] = updated;
    await this.writeCustom(custom);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const custom = await this.readCustom();
    await this.writeCustom(custom.filter((a) => a.id !== id));
  }

  private async readCustom(): Promise<Activity[]> {
    const raw = await this.store.get(ActivityRepository.KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Activity[];
    } catch {
      return [];
    }
  }

  private writeCustom(activities: Activity[]): Promise<void> {
    return this.store.set(ActivityRepository.KEY, JSON.stringify(activities));
  }
}
