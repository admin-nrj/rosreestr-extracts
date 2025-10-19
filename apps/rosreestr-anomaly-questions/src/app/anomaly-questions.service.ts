import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { AnomalyQuestionRepository } from './dal/anomaly-question.repository';
import {
  SearchQuestionRequest,
  SearchQuestionResponse,
  AddQuestionWithAnswerRequest,
  AddQuestionWithAnswerResponse,
  GetQuestionsWithoutAnswerRequest,
  GetQuestionsWithoutAnswerResponse,
  UpdateAnswerRequest,
  UpdateAnswerResponse,
  AnomalyQuestion,
} from '@rosreestr-extracts/interfaces';
import { ErrorCode } from '@rosreestr-extracts/interfaces';
import { AnomalyQuestionEntity } from './entities/anomaly-question.entity';

@Injectable()
export class AnomalyQuestionsService {
  private readonly logger = new Logger(AnomalyQuestionsService.name);

  constructor(
    private readonly anomalyQuestionRepository: AnomalyQuestionRepository
  ) {}

  /**
   * Convert entity to proto message
   */
  private toProtoMessage(entity: AnomalyQuestionEntity): AnomalyQuestion {
    return {
      id: entity.id,
      question: entity.question,
      answer: entity.answer || undefined,
      rosreestrUserName: entity.rosreestrUserName,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  /**
   * Search for a question by text
   * If not found, creates a new question without answer
   */
  async searchQuestion(
    request: SearchQuestionRequest
  ): Promise<SearchQuestionResponse> {
    try {
      const { question, rosreestrUserName } = request;

      if (!question || !rosreestrUserName) {
        throw new RpcException({
          message: 'Question and rosreestrUserName are required',
          errorCode: ErrorCode.MISSING_REQUIRED_FIELD,
        });
      }

      // Search for existing question
      let entity = await this.anomalyQuestionRepository.findByQuestion(
        question,
        rosreestrUserName
      );

      let isNew = false;

      // If not found, create new question without answer
      if (!entity) {
        this.logger.log(
          `Question not found, creating new question without answer for user: ${rosreestrUserName}`
        );
        entity = await this.anomalyQuestionRepository.createQuestionWithoutAnswer(
          question,
          rosreestrUserName
        );
        isNew = true;
      }

      return {
        anomalyQuestion: this.toProtoMessage(entity),
        isNew,
      };
    } catch (error) {
      this.logger.error('Error searching question:', error);
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'Failed to search question',
        errorCode: ErrorCode.INTERNAL_ERROR,
      });
    }
  }

  /**
   * Add a new question with answer
   */
  async addQuestionWithAnswer(
    request: AddQuestionWithAnswerRequest
  ): Promise<AddQuestionWithAnswerResponse> {
    try {
      const { question, answer, rosreestrUserName } = request;

      if (!question || !answer || !rosreestrUserName) {
        throw new RpcException({
          message: 'Question, answer and rosreestrUserName are required',
          errorCode: ErrorCode.MISSING_REQUIRED_FIELD,
        });
      }

      const entity = await this.anomalyQuestionRepository.createQuestionWithAnswer(
        question,
        answer,
        rosreestrUserName
      );

      this.logger.log(
        `Created new question with answer for user: ${rosreestrUserName}`
      );

      return {
        anomalyQuestion: this.toProtoMessage(entity),
      };
    } catch (error) {
      this.logger.error('Error adding question with answer:', error);
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'Failed to add question with answer',
        errorCode: ErrorCode.INTERNAL_ERROR,
      });
    }
  }

  /**
   * Get all questions without answers
   * Optionally filtered by rosreestr user name
   */
  async getQuestionsWithoutAnswer(
    request: GetQuestionsWithoutAnswerRequest
  ): Promise<GetQuestionsWithoutAnswerResponse> {
    try {
      const entities = await this.anomalyQuestionRepository.findQuestionsWithoutAnswer(
        request.rosreestrUserName
      );

      this.logger.log(
        `Found ${entities.length} questions without answer${
          request.rosreestrUserName ? ` for user: ${request.rosreestrUserName}` : ''
        }`
      );

      return {
        questions: entities.map((entity) => this.toProtoMessage(entity)),
      };
    } catch (error) {
      this.logger.error('Error getting questions without answer:', error);
      throw new RpcException({
        message: 'Failed to get questions without answer',
        errorCode: ErrorCode.INTERNAL_ERROR,
      });
    }
  }

  /**
   * Update answer for a question by ID
   */
  async updateAnswer(
    request: UpdateAnswerRequest
  ): Promise<UpdateAnswerResponse> {
    try {
      const { id, answer } = request;

      if (!id || !answer) {
        throw new RpcException({
          message: 'ID and answer are required',
          errorCode: ErrorCode.MISSING_REQUIRED_FIELD,
        });
      }

      const entity = await this.anomalyQuestionRepository.updateAnswer(
        id,
        answer
      );

      if (!entity) {
        throw new RpcException({
          message: `Question with ID ${id} not found`,
          errorCode: ErrorCode.USER_NOT_FOUND,
        });
      }

      this.logger.log(`Updated answer for question ID: ${id}`);

      return {
        anomalyQuestion: this.toProtoMessage(entity),
      };
    } catch (error) {
      this.logger.error('Error updating answer:', error);
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'Failed to update answer',
        errorCode: ErrorCode.INTERNAL_ERROR,
      });
    }
  }
}
