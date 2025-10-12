import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { USERS_PACKAGE_NAME, USERS_SERVICE_NAME, UsersServiceClient } from '@rosreestr-extracts/interfaces';
import { ClientGrpc } from '@nestjs/microservices';
import { UserDto } from '../common/dto/response.dto';
import { UpdateUserDto } from './dto/request.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OwnerOrAdminGuard } from '../common/guards/owner-or-admin.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@rosreestr-extracts/entities';
import { BaseGrpcController } from '../common/base-grpc.controller';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController extends BaseGrpcController<UsersServiceClient> {
  constructor(@Inject(USERS_PACKAGE_NAME) client: ClientGrpc) {
    super(client, USERS_SERVICE_NAME);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async getAllUsers(): Promise<UserDto[]> {
    Logger.log('[getAllUsers]');
    const response = await this.callGrpc(this.service.getAllUsers({}));

    Logger.log('[getAllUsers] response: ', response);

    return response.users;
  }

  @UseGuards(OwnerOrAdminGuard)
  @Get(':id')
  async getUser(@Param('id', ParseIntPipe) id: number): Promise<UserDto> {
    Logger.log('[getUser] id: ', id);
    const response = await this.callGrpc(this.service.getUser({ id }));

    Logger.log('[getUser] response: ', response);

    return response.user;
  }

  @UseGuards(OwnerOrAdminGuard)
  @Patch(':id')
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto): Promise<UserDto> {
    Logger.log('[updateUser] id: ', id);
    const response = await this.callGrpc(this.service.updateUser({ id, ...updateUserDto }));

    Logger.log('[updateUser] response: ', response);

    return response.user;
  }
}
