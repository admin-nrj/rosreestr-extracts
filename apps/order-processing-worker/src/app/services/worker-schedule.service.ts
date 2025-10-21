import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkerScheduleEntity } from '@rosreestr-extracts/entities';

/**
 * Service for managing worker schedules and checking execution permissions
 */
@Injectable()
export class WorkerScheduleService {
  private readonly logger = new Logger(WorkerScheduleService.name);

  constructor(
    @InjectRepository(WorkerScheduleEntity)
    private readonly scheduleRepository: Repository<WorkerScheduleEntity>
  ) {}

  /**
   * Get schedule configuration for a worker
   * @param workerName - Name of the worker
   * @returns Schedule configuration or null if not found
   */
  async getSchedule(workerName: string): Promise<WorkerScheduleEntity | null> {
    return this.scheduleRepository.findOne({
      where: { workerName },
    });
  }

  /**
   * Check if current time is within active interval
   * Supports day transition (e.g., 20:00-07:00 next day)
   * @param schedule - Worker schedule configuration
   * @returns true if current time is within active interval
   */
  isActiveInterval(schedule: WorkerScheduleEntity): boolean {
    const now = new Date();
    const currentTime = this.getTimeInMinutes(now.getHours(), now.getMinutes());

    const [startHour, startMinute] = schedule.activeIntervalStart.split(':').map(Number);
    const [endHour, endMinute] = schedule.activeIntervalEnd.split(':').map(Number);

    const startTime = this.getTimeInMinutes(startHour, startMinute);
    const endTime = this.getTimeInMinutes(endHour, endMinute);

    // Check if interval crosses midnight (e.g., 20:00-07:00)
    if (startTime > endTime) {
      // Current time should be either >= start OR <= end
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      // Normal interval within same day
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  /**
   * Check if worker can run (previous run completed)
   * @param schedule - Worker schedule configuration
   * @returns true if worker can run
   */
  canRun(schedule: WorkerScheduleEntity): boolean {
    // If never run before, can run
    if (!schedule.lastRunAt) {
      return true;
    }

    // If last run completed, can run
    if (schedule.lastRunCompletedAt && schedule.lastRunCompletedAt >= schedule.lastRunAt) {
      return true;
    }

    // Previous run not completed yet
    return false;
  }

  /**
   * Mark worker run start
   * @param workerName - Name of the worker
   */
  async markRunStart(workerName: string): Promise<void> {
    await this.scheduleRepository.update(
      { workerName },
      { lastRunAt: new Date() }
    );
    this.logger.log(`Marked run start for worker: ${workerName}`);
  }

  /**
   * Mark worker run completion
   * @param workerName - Name of the worker
   */
  async markRunComplete(workerName: string): Promise<void> {
    await this.scheduleRepository.update(
      { workerName },
      { lastRunCompletedAt: new Date() }
    );
    this.logger.log(`Marked run complete for worker: ${workerName}`);
  }

  /**
   * Convert hours and minutes to total minutes since midnight
   * @param hours - Hours (0-23)
   * @param minutes - Minutes (0-59)
   * @returns Total minutes since midnight
   */
  private getTimeInMinutes(hours: number, minutes: number): number {
    return hours * 60 + minutes;
  }
}
