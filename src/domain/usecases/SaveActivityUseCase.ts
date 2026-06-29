import { Activity, ActivityDraft } from '@domain/entities/Activity';
import { IActivityRepository } from '@domain/repositories/IActivityRepository';
import { ValidationError } from '@shared/errors/AppError';

export class SaveActivityUseCase {
  constructor(private readonly activityRepository: IActivityRepository) {}

  async create(draft: ActivityDraft): Promise<Activity> {
    this.validate(draft);
    return this.activityRepository.create(draft);
  }

  async update(id: string, draft: ActivityDraft): Promise<Activity> {
    this.validate(draft);
    return this.activityRepository.update(id, draft);
  }

  private validate(draft: ActivityDraft): void {
    if (!draft.name.trim()) {
      throw new ValidationError('Dê um nome para a atividade.');
    }
    const { idealMin, idealMax, hardMin, hardMax } = draft.temperatureC;
    if (!(hardMin <= idealMin && idealMin <= idealMax && idealMax <= hardMax)) {
      throw new ValidationError(
        'A faixa de temperatura está inconsistente: confira mínimos e máximos.',
      );
    }
    if (
      draft.maxPrecipitationProbability < 0 ||
      draft.maxPrecipitationProbability > 100
    ) {
      throw new ValidationError('A tolerância de chuva precisa estar entre 0% e 100%.');
    }
    if (draft.maxWindKmh < 0) {
      throw new ValidationError('A tolerância de vento não pode ser negativa.');
    }
    if (draft.maxUvIndex < 0 || draft.maxUvIndex > 11) {
      throw new ValidationError('O índice UV máximo precisa estar entre 0 e 11.');
    }
    const totalWeight =
      draft.weights.temperature +
      draft.weights.precipitation +
      draft.weights.wind +
      draft.weights.uv;
    if (totalWeight <= 0) {
      throw new ValidationError('Pelo menos um fator precisa ter peso maior que zero.');
    }
  }
}
