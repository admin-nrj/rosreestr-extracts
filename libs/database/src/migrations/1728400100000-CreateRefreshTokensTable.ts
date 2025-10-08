import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateRefreshTokensTable1728400100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'token',
            type: 'text',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'is_revoked',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'revoked_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create index on token for fast lookups
    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'IDX_REFRESH_TOKEN',
        columnNames: ['token'],
      })
    );

    // Create index on user_id for filtering user tokens
    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'IDX_REFRESH_TOKEN_USER_ID',
        columnNames: ['user_id'],
      })
    );

    // Create index on expires_at for cleanup queries
    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'IDX_REFRESH_TOKEN_EXPIRES_AT',
        columnNames: ['expires_at'],
      })
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'refresh_tokens',
      new TableForeignKey({
        name: 'FK_REFRESH_TOKEN_USER',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('refresh_tokens', 'FK_REFRESH_TOKEN_USER');
    await queryRunner.dropIndex('refresh_tokens', 'IDX_REFRESH_TOKEN_EXPIRES_AT');
    await queryRunner.dropIndex('refresh_tokens', 'IDX_REFRESH_TOKEN_USER_ID');
    await queryRunner.dropIndex('refresh_tokens', 'IDX_REFRESH_TOKEN');
    await queryRunner.dropTable('refresh_tokens');
  }
}
