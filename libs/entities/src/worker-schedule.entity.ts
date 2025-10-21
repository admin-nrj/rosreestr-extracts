import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Worker Schedule entity for managing cron job schedules
 * Supports active time intervals with day transition (e.g., 20:00-07:00)
 */
@Entity('worker_schedules')
export class WorkerScheduleEntity extends BaseEntity {
  @Column({ name: 'worker_name', unique: true, length: 100 })
  workerName: string;

  @Column({ name: 'active_interval_start', length: 5, comment: 'Format: HH:MM, e.g., "20:00"' })
  activeIntervalStart: string;

  @Column({ name: 'active_interval_end', length: 5, comment: 'Format: HH:MM, e.g., "07:00"' })
  activeIntervalEnd: string;

  @Column({ name: 'cron_expression', length: 100, comment: 'Cron expression, e.g., "*/30 * * * *"' })
  cronExpression: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({
    name: 'last_run_at',
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'When the worker last started running'
  })
  lastRunAt?: Date;

  @Column({
    name: 'last_run_completed_at',
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'When the worker last completed running'
  })
  lastRunCompletedAt?: Date;
}
