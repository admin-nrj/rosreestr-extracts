import { Controller } from '@nestjs/common';
import {
  AllUsersResponse,
  UpdateUserRequest,
  UserRequest,
  UserResponse,
  UsersServiceController,
  UsersServiceControllerMethods,
} from '@rosreestr-extracts/interfaces';
import { AppService } from './app.service';

@Controller()
@UsersServiceControllerMethods()
export class AppController implements UsersServiceController {
  constructor(private readonly userService: AppService) {}

  getAllUsers(): Promise<AllUsersResponse>{
    return this.userService.getAllUsers();
  }

  getUser(request: UserRequest): Promise<UserResponse> {
    return this.userService.getUser(request);
  }

  updateUser(request: UpdateUserRequest): Promise<UserResponse> {
    return this.userService.updateUser(request);
  }
}
