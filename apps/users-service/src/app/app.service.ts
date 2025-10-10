import { Injectable } from '@nestjs/common';
import { UserRepository } from '@rosreestr-extracts/dal';
import { createErrorResponse, getErrorMessage, mapUserToProto } from '@rosreestr-extracts/utils';
import { ErrorCode, UpdateUserRequest, UserRequest } from '@rosreestr-extracts/interfaces';
import { UserEntity } from '@rosreestr-extracts/entities';

@Injectable()
export class AppService {
  constructor(private readonly userRepository: UserRepository) {}

  async getAllUsers() {
    try {
      const users = await this.userRepository.findAllActive();

      return { users: users.map(mapUserToProto) };
    } catch (error) {
      console.log('[getAllUsers] error: ', getErrorMessage(error));
      return {
        users: [],
        ...createErrorResponse(ErrorCode.INTERNAL_ERROR),
      };
    }
  }

  async getUser({ id }: UserRequest) {
    try {
      const user = await this.userRepository.findById(id);

      return { user: mapUserToProto(user) };
    } catch (error) {
      console.log('[getUser] error: ', getErrorMessage(error));
      return createErrorResponse(ErrorCode.INTERNAL_ERROR);
    }
  }

  async updateUser({ id, ...userData }: UpdateUserRequest) {
    try {
      const user = await this.userRepository.update(id, userData as Partial<UserEntity>);

      return { user: mapUserToProto(user) };
    } catch (error) {
      console.log('[updateUser] error: ', getErrorMessage(error));
      return createErrorResponse(ErrorCode.INTERNAL_ERROR);
    }
  }
}
