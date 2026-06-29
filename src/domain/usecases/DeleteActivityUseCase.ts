import { IActivityRepository } from '@domain/repositories/IActivityRepository';

export class DeleteActivityUseCase {
  constructor(private readonly activityRepository: IActivityRepository) {}
  execute(id: string): Promise<void> {
    return this.activityRepository.remove(id);
  }
}
