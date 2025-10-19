import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@rosreestr-extracts/database';
import { appConfig } from '@rosreestr-extracts/config';
import { AnomalyQuestionsController } from './anomaly-questions.controller';
import { AnomalyQuestionsService } from './anomaly-questions.service';
import { AnomalyQuestionEntity } from './entities/anomaly-question.entity';
import { AnomalyQuestionRepository } from './dal/anomaly-question.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env']
    }),
    DatabaseModule.forRoot({
      entities: [AnomalyQuestionEntity],
    }),
    TypeOrmModule.forFeature([AnomalyQuestionEntity]),
  ],
  controllers: [AnomalyQuestionsController],
  providers: [AnomalyQuestionsService, AnomalyQuestionRepository],
})
export class AnomalyQuestionsModule {}
