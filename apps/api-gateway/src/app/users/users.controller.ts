import { Body, Controller, Get, Inject, Logger, OnModuleInit, Param, ParseIntPipe, Patch } from '@nestjs/common';
import {
  AUTH_PACKAGE_NAME,
  USERS_SERVICE_NAME,
  UsersServiceClient
} from '@rosreestr-extracts/interfaces';
import { ClientGrpc } from '@nestjs/microservices';
import { throwIfError } from '@rosreestr-extracts/utils';
import { firstValueFrom } from 'rxjs';
import { UserDto } from '../common/dto/response.dto';
import { UpdateUserDto } from './dto/request.dto';

@Controller('users')
export class UsersController implements OnModuleInit {
  private userService: UsersServiceClient;
  constructor(@Inject(AUTH_PACKAGE_NAME) private readonly client: ClientGrpc) {}
  onModuleInit() {
    this.userService = this.client.getService<UsersServiceClient>(USERS_SERVICE_NAME);
  }

  @Get()
  async getAllUsers(): Promise<UserDto[]> {
    Logger.log('[getAllUsers]');
    const response = await firstValueFrom(this.userService.getAllUsers({}));

    Logger.log('[getAllUsers] response: ', response);

    throwIfError(response);

    return response.users;
  }

  @Get('id')
  async getUser(@Param('id', ParseIntPipe) id: number): Promise<UserDto> {
    Logger.log('[getUser] id: ', id);
    const response = await firstValueFrom(this.userService.getUser({ id }));

    Logger.log('[getUser] response: ', response);

    throwIfError(response);

    return response.user;
  }

  @Patch('id')
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto): Promise<UserDto> {
    Logger.log('[updateUser] id: ', id);
    const response = await firstValueFrom(this.userService.updateUser({ id, ...updateUserDto }));

    Logger.log('[getAllUsers] response: ', response);

    throwIfError(response);

    return response.user;
  }
}
