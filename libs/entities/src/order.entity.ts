import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Order entity representing Rosreestr extract orders
 */
@Entity('orders')
export class OrderEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'integer' })
  userId: number;

  @Column({ name: 'cad_num', length: 255 })
  cadNum: string;

  @Column({ name: 'rosreestr_order_num', length: 255, nullable: true })
  rosreestrOrderNum?: string;

  @Column({ name: 'recipient_name', length: 255 })
  recipientName: string;

  @Column({ length: 255, default: 'Добавлен в очередь' })
  status: string;

  @Column({ name: 'is_complete', default: false })
  isComplete?: boolean;

  @Column({ length: 255, nullable: true })
  comment?: string;

  @Column({
    name: 'rosreestr_registration_started_at',
    type: 'timestamp with time zone',
    nullable: true
  })
  rosreestrRegistrationStartedAt?: Date;

  @Column({
    name: 'rosreestr_registered_at',
    type: 'timestamp with time zone',
    nullable: true
  })
  rosreestrRegisteredAt?: Date;

  @Column({
    name: 'completed_at',
    type: 'timestamp with time zone',
    nullable: true
  })
  completedAt?: Date;
}
