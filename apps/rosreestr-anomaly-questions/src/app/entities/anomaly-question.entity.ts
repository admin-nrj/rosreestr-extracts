import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@rosreestr-extracts/entities';

/**
 * Entity for storing anomaly questions and answers
 */
@Entity('anomaly_questions')
@Index(['rosreestrUserName'])
export class AnomalyQuestionEntity extends BaseEntity {
  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text', nullable: true })
  answer: string | null;

  @Column({ name: 'rosreestr_user_name', type: 'varchar', length: 255 })
  rosreestrUserName: string;

  /**
   * Normalized question for case-insensitive and space-insensitive search
   * Stores lowercased question with single spaces between words
   */
  @Column({ name: 'normalized_question', type: 'text' })
  @Index()
  normalizedQuestion: string;
}
