import { Inject, Injectable, Logger } from '@nestjs/common';
import { RosreestrUserRepository } from '@rosreestr-extracts/dal';
import { CryptoService } from '@rosreestr-extracts/crypto';
import {
  CreateRosreestrUserRequest,
  GetRosreestrUserRequest,
  GetRosreestrUserByUsernameRequest,
  GetAllRosreestrUsersResponse,
  UpdateRosreestrUserRequest,
  DeleteRosreestrUserRequest,
  RosreestrUserResponse,
  DeleteRosreestrUserResponse,
  RosreestrUser,
  ErrorCode,
} from '@rosreestr-extracts/interfaces';
import { RosreestrUserEntity } from '@rosreestr-extracts/entities';
import { cryptoConfig } from '@rosreestr-extracts/config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class RosreestrUsersService {
  private readonly logger = new Logger(RosreestrUsersService.name);

  constructor(
    private readonly rosreestrUserRepository: RosreestrUserRepository,
    private readonly cryptoService: CryptoService,
    @Inject(cryptoConfig.KEY)
    private readonly cryptoCfg: ConfigType<typeof cryptoConfig>,
  ) {}

  async createRosreestrUser(request: CreateRosreestrUserRequest): Promise<RosreestrUserResponse> {
    try {
      // Check if username already exists
      const exists = await this.rosreestrUserRepository.usernameExists(request.username);
      if (exists) {
        return {
          rosreestrUser: undefined,
          error: {
            message: `Username ${request.username} already exists`,
            errorCode: ErrorCode.USER_ALREADY_EXISTS,
          },
        };
      }

      // Encrypt the password
      const passwordEncrypted = await this.cryptoService.encrypt(request.password, this.cryptoCfg.rrSecret);

      // Create the user
      const user = await this.rosreestrUserRepository.create({
        username: request.username,
        passwordEncrypted,
        guLogin: request.guLogin,
        comment: request.comment,
      });

      this.logger.log(`Created Rosreestr user: ${user.username} (ID: ${user.id})`);

      return {
        rosreestrUser: this.mapEntityToProto(user),
        error: undefined,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to create Rosreestr user: ${err.message}`, err.stack);
      return {
        rosreestrUser: undefined,
        error: {
          message: 'Failed to create Rosreestr user',
          errorCode: ErrorCode.INTERNAL_ERROR,
        },
      };
    }
  }

  async getRosreestrUser(request: GetRosreestrUserRequest): Promise<RosreestrUserResponse> {
    try {
      const user = await this.rosreestrUserRepository.findById(request.id);

      if (!user) {
        return {
          rosreestrUser: undefined,
          error: {
            message: `Rosreestr user with ID ${request.id} not found`,
            errorCode: ErrorCode.USER_NOT_FOUND,
          },
        };
      }

      return {
        rosreestrUser: this.mapEntityToProto(user),
        error: undefined,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to get Rosreestr user: ${err.message}`, err.stack);
      return {
        rosreestrUser: undefined,
        error: {
          message: 'Failed to get Rosreestr user',
          errorCode: ErrorCode.INTERNAL_ERROR,
        },
      };
    }
  }

  async getRosreestrUserByUsername(request: GetRosreestrUserByUsernameRequest): Promise<RosreestrUserResponse> {
    try {
      const user = await this.rosreestrUserRepository.findByUsername(request.username);

      if (!user) {
        return {
          rosreestrUser: undefined,
          error: {
            message: `Rosreestr user with username ${request.username} not found`,
            errorCode: ErrorCode.USER_NOT_FOUND,
          },
        };
      }

      return {
        rosreestrUser: this.mapEntityToProto(user),
        error: undefined,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to get Rosreestr user by username: ${err.message}`, err.stack);
      return {
        rosreestrUser: undefined,
        error: {
          message: 'Failed to get Rosreestr user by username',
          errorCode: ErrorCode.INTERNAL_ERROR,
        },
      };
    }
  }

  async getAllRosreestrUsers(): Promise<GetAllRosreestrUsersResponse> {
    try {
      const users = await this.rosreestrUserRepository.findAll();

      return {
        data: users.map(user => this.mapEntityToProto(user)),
        error: undefined,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to get all Rosreestr users: ${err.message}`, err.stack);
      return {
        data: [],
        error: {
          message: 'Failed to get all Rosreestr users',
          errorCode: ErrorCode.INTERNAL_ERROR,
        },
      };
    }
  }

  async updateRosreestrUser(request: UpdateRosreestrUserRequest): Promise<RosreestrUserResponse> {
    try {
      const user = await this.rosreestrUserRepository.findById(request.id);

      if (!user) {
        return {
          rosreestrUser: undefined,
          error: {
            message: `Rosreestr user with ID ${request.id} not found`,
            errorCode: ErrorCode.USER_NOT_FOUND,
          },
        };
      }

      // Check if username is being changed and if it conflicts
      if (request.username && request.username !== user.username) {
        const exists = await this.rosreestrUserRepository.usernameExists(request.username);
        if (exists) {
          return {
            rosreestrUser: undefined,
            error: {
              message: `Username ${request.username} already exists`,
              errorCode: ErrorCode.USER_ALREADY_EXISTS,
            },
          };
        }
      }

      const updateData: Partial<RosreestrUserEntity> = {
        ...request,
      };

      if (request.password) {
        updateData.passwordEncrypted = await this.cryptoService.encrypt(request.password, this.cryptoCfg.rrSecret);
      }

      const updatedUser = await this.rosreestrUserRepository.update(request.id, updateData);

      this.logger.log(`Updated Rosreestr user: ${updatedUser.username} (ID: ${updatedUser.id})`);

      return {
        rosreestrUser: this.mapEntityToProto(updatedUser),
        error: undefined,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to update Rosreestr user: ${err.message}`, err.stack);
      return {
        rosreestrUser: undefined,
        error: {
          message: 'Failed to update Rosreestr user',
          errorCode: ErrorCode.INTERNAL_ERROR,
        },
      };
    }
  }

  async deleteRosreestrUser(request: DeleteRosreestrUserRequest): Promise<DeleteRosreestrUserResponse> {
    try {
      const user = await this.rosreestrUserRepository.findById(request.id);

      if (!user) {
        return {
          success: false,
          error: {
            message: `Rosreestr user with ID ${request.id} not found`,
            errorCode: ErrorCode.USER_NOT_FOUND,
          },
        };
      }

      await this.rosreestrUserRepository.softDelete(request.id);

      this.logger.log(`Deleted Rosreestr user: ${user.username} (ID: ${user.id})`);

      return {
        success: true,
        error: undefined,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to delete Rosreestr user: ${err.message}`, err.stack);
      return {
        success: false,
        error: {
          message: 'Failed to delete Rosreestr user',
          errorCode: ErrorCode.INTERNAL_ERROR,
        },
      };
    }
  }

  private mapEntityToProto(entity: RosreestrUserEntity): RosreestrUser {
    return {
      id: entity.id,
      username: entity.username,
      passwordEncrypted: entity.passwordEncrypted,
      guLogin: entity.guLogin,
      comment: entity.comment,
    };
  }
}
