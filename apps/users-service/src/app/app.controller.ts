import { Controller } from '@nestjs/common';
import {
  AllUsersRequest,
  AllUsersResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  UserRequest,
  UserResponse,
  UsersServiceController,
  UsersServiceControllerMethods,
} from '@rosreestr-extracts/interfaces';
import { AppService } from './app.service';
import { Observable } from 'rxjs';

@Controller()
@UsersServiceControllerMethods()
export class AppController implements UsersServiceController {
  constructor(private readonly appService: AppService) {}

  getAllUsers(request: AllUsersRequest): Promise<AllUsersResponse> | Observable<AllUsersResponse> | AllUsersResponse {
    throw new Error('Method not implemented.');
  }
  getUser(request: UserRequest): Promise<UserResponse> | Observable<UserResponse> | UserResponse {
    throw new Error('Method not implemented.');
  }
  updateUser(
    request: UpdateUserRequest
  ): Promise<UpdateUserResponse> | Observable<UpdateUserResponse> | UpdateUserResponse {
    throw new Error('Method not implemented.');
  }
}
