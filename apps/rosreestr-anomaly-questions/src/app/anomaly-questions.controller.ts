import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  SearchQuestionRequest,
  SearchQuestionResponse,
  AddQuestionWithAnswerRequest,
  AddQuestionWithAnswerResponse,
  GetQuestionsWithoutAnswerRequest,
  GetQuestionsWithoutAnswerResponse,
  UpdateAnswerRequest,
  UpdateAnswerResponse,
  ANOMALY_QUESTIONS_SERVICE_NAME,
} from '@rosreestr-extracts/interfaces';
import { AnomalyQuestionsService } from './anomaly-questions.service';

@Controller()
export class AnomalyQuestionsController {
  constructor(
    private readonly anomalyQuestionsService: AnomalyQuestionsService
  ) {}

  @GrpcMethod(ANOMALY_QUESTIONS_SERVICE_NAME, 'searchQuestion')
  async searchQuestion(
    request: SearchQuestionRequest
  ): Promise<SearchQuestionResponse> {
    return this.anomalyQuestionsService.searchQuestion(request);
  }

  @GrpcMethod(ANOMALY_QUESTIONS_SERVICE_NAME, 'addQuestionWithAnswer')
  async addQuestionWithAnswer(
    request: AddQuestionWithAnswerRequest
  ): Promise<AddQuestionWithAnswerResponse> {
    return this.anomalyQuestionsService.addQuestionWithAnswer(request);
  }

  @GrpcMethod(ANOMALY_QUESTIONS_SERVICE_NAME, 'getQuestionsWithoutAnswer')
  async getQuestionsWithoutAnswer(
    request: GetQuestionsWithoutAnswerRequest
  ): Promise<GetQuestionsWithoutAnswerResponse> {
    return this.anomalyQuestionsService.getQuestionsWithoutAnswer(request);
  }

  @GrpcMethod(ANOMALY_QUESTIONS_SERVICE_NAME, 'updateAnswer')
  async updateAnswer(
    request: UpdateAnswerRequest
  ): Promise<UpdateAnswerResponse> {
    return this.anomalyQuestionsService.updateAnswer(request);
  }
}
