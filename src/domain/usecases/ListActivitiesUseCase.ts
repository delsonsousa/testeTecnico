import { Activity } from '@domain/entities/Activity';
import { IActivityRepository } from '@domain/repositories/IActivityRepository';

export class ListActivitiesUseCase {
  constructor(private readonly activityRepository: IActivityRepository) {}
  execute(): Promise<Activity[]> {
    return this.activityRepository.list();
  }
}
