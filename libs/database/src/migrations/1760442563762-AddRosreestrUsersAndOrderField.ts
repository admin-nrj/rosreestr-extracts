import { MigrationInterface, QueryRunner, Table, TableColumn } from "typeorm";

export class AddRosreestrUsersAndOrderField1760442563762 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create rosreestr_users table
        await queryRunner.createTable(
            new Table({
                name: 'rosreestr_users',
                columns: [
                    {
                        name: 'id',
                        type: 'integer',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'username',
                        type: 'varchar',
                        length: '255',
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: 'password_encrypted',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'gu_login',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                        comment: 'Логин на портал госУслуги, это может быть номер телефона или СНИЛС',
                    },
                    {
                        name: 'comment',
                        type: 'varchar',
                        length: '500',
                        isNullable: true,
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
                ],
            }),
            true
        );

        // Add rosreestr_user_id column to orders table
        await queryRunner.addColumn(
            'orders',
            new TableColumn({
                name: 'rosreestr_user_id',
                type: 'integer',
                isNullable: true,
                comment: 'ID пользователя Росреестра, который обрабатывает заказ',
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove rosreestr_user_id column from orders table
        await queryRunner.dropColumn('orders', 'rosreestr_user_id');

        // Drop rosreestr_users table
        await queryRunner.dropTable('rosreestr_users');
    }

}
