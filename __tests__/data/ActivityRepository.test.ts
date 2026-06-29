import { ActivityRepository } from '@data/repositories/ActivityRepository';
import { ACTIVITY_PRESETS } from '@domain/services/activityPresets';
import { IKeyValueStore } from '@infrastructure/cache/IKeyValueStore';
import { makeActivityDraft } from '../fixtures';

class InMemoryStore implements IKeyValueStore {
  private map = new Map<string, string>();
  get = (k: string) => Promise.resolve(this.map.get(k) ?? null);
  set = (k: string, v: string) => {
    this.map.set(k, v);
    return Promise.resolve();
  };
  seed(k: string, v: string) {
    this.map.set(k, v);
  }
}

describe('ActivityRepository', () => {
  it('returns presets when there are no custom activities', async () => {
    const repo = new ActivityRepository(new InMemoryStore());
    const list = await repo.list();
    expect(list).toHaveLength(ACTIVITY_PRESETS.length);
    expect(list.every((a) => a.isPreset)).toBe(true);
  });

  it('appends a created activity after the presets', async () => {
    const repo = new ActivityRepository(new InMemoryStore());
    const draft = makeActivityDraft({ name: 'Surfe' });
    const created = await repo.create(draft);
    expect(created.isPreset).toBe(false);
    const list = await repo.list();
    expect(list).toHaveLength(ACTIVITY_PRESETS.length + 1);
    expect(list[list.length - 1].name).toBe('Surfe');
  });

  it('updates and removes a custom activity', async () => {
    const repo = new ActivityRepository(new InMemoryStore());
    const draft = makeActivityDraft({ name: 'Surfe' });
    const created = await repo.create(draft);
    await repo.update(created.id, { ...draft, name: 'Stand Up' });
    let list = await repo.list();
    expect(list.find((a) => a.id === created.id)?.name).toBe('Stand Up');
    await repo.remove(created.id);
    list = await repo.list();
    expect(list.find((a) => a.id === created.id)).toBeUndefined();
  });

  it('returns only presets when cached custom data is corrupted', async () => {
    const store = new InMemoryStore();
    store.seed('@testetecnico/custom-activities', '{bad json');

    const repo = new ActivityRepository(store);
    const list = await repo.list();

    expect(list).toHaveLength(ACTIVITY_PRESETS.length);
  });

  it('throws when trying to update a missing custom activity', async () => {
    const repo = new ActivityRepository(new InMemoryStore());

    await expect(repo.update('missing', makeActivityDraft())).rejects.toThrow(
      'Atividade não encontrada.',
    );
  });

  it('never lets presets be removed', async () => {
    const repo = new ActivityRepository(new InMemoryStore());
    await repo.remove('preset-walk');
    const list = await repo.list();
    expect(list.find((a) => a.id === 'preset-walk')).toBeDefined();
  });
});
