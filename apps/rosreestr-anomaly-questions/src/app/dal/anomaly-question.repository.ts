import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnomalyQuestionEntity } from '../entities/anomaly-question.entity';

/**
 * Repository for managing anomaly questions
 */
@Injectable()
export class AnomalyQuestionRepository {
  constructor(
    @InjectRepository(AnomalyQuestionEntity)
    private readonly repository: Repository<AnomalyQuestionEntity>,
  ) {}

  /**
   * Normalize question text for searching
   * - Converts to lowercase
   * - Replaces multiple spaces with single space
   * - Trims whitespace
   */
  private normalizeQuestion(question: string): string {
    return question
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Search for a question by normalized text and rosreestr user name
   */
  async findByQuestion(
    question: string,
    rosreestrUserName: string
  ): Promise<AnomalyQuestionEntity | null> {
    const normalizedQuestion = this.normalizeQuestion(question);

    return await this.repository.findOne({
      where: {
        normalizedQuestion,
        rosreestrUserName,
      },
    });
  }

  /**
   * Create a new question without answer
   */
  async createQuestionWithoutAnswer(
    question: string,
    rosreestrUserName: string
  ): Promise<AnomalyQuestionEntity> {
    const normalizedQuestion = this.normalizeQuestion(question);

    const entity = this.repository.create({
      question,
      normalizedQuestion,
      rosreestrUserName,
      answer: null,
    });

    return await this.repository.save(entity);
  }

  /**
   * Create a question with answer
   */
  async createQuestionWithAnswer(
    question: string,
    answer: string,
    rosreestrUserName: string
  ): Promise<AnomalyQuestionEntity> {
    const normalizedQuestion = this.normalizeQuestion(question);

    const entity = this.repository.create({
      question,
      answer,
      normalizedQuestion,
      rosreestrUserName,
    });

    return await this.repository.save(entity);
  }

  /**
   * Get all questions without answers
   * Optionally filtered by rosreestr user name
   */
  async findQuestionsWithoutAnswer(
    rosreestrUserName?: string
  ): Promise<AnomalyQuestionEntity[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('aq')
      .where('aq.answer IS NULL');

    if (rosreestrUserName) {
      queryBuilder.andWhere('aq.rosreestr_user_name = :rosreestrUserName', {
        rosreestrUserName,
      });
    }

    return await queryBuilder
      .orderBy('aq.created_at', 'DESC')
      .getMany();
  }

  /**
   * Update answer for a question by ID
   */
  async updateAnswer(
    id: number,
    answer: string
  ): Promise<AnomalyQuestionEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });

    if (!entity) {
      return null;
    }

    entity.answer = answer;
    return await this.repository.save(entity);
  }

  /**
   * Find question by ID
   */
  async findById(id: number): Promise<AnomalyQuestionEntity | null> {
    return await this.repository.findOne({ where: { id } });
  }
}
