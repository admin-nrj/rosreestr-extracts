import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLastCheckedAtToOrders1760985600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'orders',
      new TableColumn({
        name: 'last_checked_at',
        type: 'timestamp with time zone',
        isNullable: true,
        comment: 'Last time order status was checked',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('orders', 'last_checked_at');
  }
}
