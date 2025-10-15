import { Controller } from '@nestjs/common';
import { RosreestrUsersService } from './rosreestr-users.service';
import {
  RosreestrUsersServiceController,
  RosreestrUsersServiceControllerMethods,
  CreateRosreestrUserRequest,
  GetRosreestrUserRequest,
  GetRosreestrUserByUsernameRequest,
  GetAllRosreestrUsersRequest,
  GetAllRosreestrUsersResponse,
  UpdateRosreestrUserRequest,
  DeleteRosreestrUserRequest,
  RosreestrUserResponse,
  DeleteRosreestrUserResponse,
} from '@rosreestr-extracts/interfaces';

@Controller()
@RosreestrUsersServiceControllerMethods()
export class RosreestrUsersController implements RosreestrUsersServiceController {
  constructor(private readonly rosreestrUsersService: RosreestrUsersService) {}

  async createRosreestrUser(request: CreateRosreestrUserRequest): Promise<RosreestrUserResponse> {
    return this.rosreestrUsersService.createRosreestrUser(request);
  }

  async getRosreestrUser(request: GetRosreestrUserRequest): Promise<RosreestrUserResponse> {
    return this.rosreestrUsersService.getRosreestrUser(request);
  }

  async getRosreestrUserByUsername(request: GetRosreestrUserByUsernameRequest): Promise<RosreestrUserResponse> {
    return this.rosreestrUsersService.getRosreestrUserByUsername(request);
  }

  async getAllRosreestrUsers(request: GetAllRosreestrUsersRequest): Promise<GetAllRosreestrUsersResponse> {
    return this.rosreestrUsersService.getAllRosreestrUsers();
  }

  async updateRosreestrUser(request: UpdateRosreestrUserRequest): Promise<RosreestrUserResponse> {
    return this.rosreestrUsersService.updateRosreestrUser(request);
  }

  async deleteRosreestrUser(request: DeleteRosreestrUserRequest): Promise<DeleteRosreestrUserResponse> {
    return this.rosreestrUsersService.deleteRosreestrUser(request);
  }
}
