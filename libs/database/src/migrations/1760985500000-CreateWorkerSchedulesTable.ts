import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateWorkerSchedulesTable1760985500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'worker_schedules',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'worker_name',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'active_interval_start',
            type: 'varchar',
            length: '5',
            comment: 'Format: HH:MM, e.g., "20:00"',
          },
          {
            name: 'active_interval_end',
            type: 'varchar',
            length: '5',
            comment: 'Format: HH:MM, e.g., "07:00"',
          },
          {
            name: 'cron_expression',
            type: 'varchar',
            length: '100',
            comment: 'Cron expression, e.g., "*/30 * * * *"',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'last_run_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'When the worker last started running',
          },
          {
            name: 'last_run_completed_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'When the worker last completed running',
          },
        ],
      }),
      true
    );

    // Insert seed data for order-status-checker worker
    await queryRunner.query(`
      INSERT INTO "worker_schedules" (
        "worker_name",
        "active_interval_start",
        "active_interval_end",
        "cron_expression",
        "is_active"
      ) VALUES (
        'order-status-checker',
        '20:00',
        '07:00',
        '*/30 * * * *',
        true
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('worker_schedules');
  }
}
