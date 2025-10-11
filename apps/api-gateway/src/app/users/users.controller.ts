import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  OnModuleInit,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { USERS_PACKAGE_NAME, USERS_SERVICE_NAME, UsersServiceClient } from '@rosreestr-extracts/interfaces';
import { ClientGrpc } from '@nestjs/microservices';
import { throwIfError } from '@rosreestr-extracts/utils';
import { firstValueFrom } from 'rxjs';
import { UserDto } from '../common/dto/response.dto';
import { UpdateUserDto } from './dto/request.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OwnerOrAdminGuard } from '../common/guards/owner-or-admin.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@rosreestr-extracts/entities';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController implements OnModuleInit {
  private userService: UsersServiceClient;
  constructor(@Inject(USERS_PACKAGE_NAME) private readonly client: ClientGrpc) {}
  onModuleInit() {
    this.userService = this.client.getService<UsersServiceClient>(USERS_SERVICE_NAME);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async getAllUsers(): Promise<UserDto[]> {
    Logger.log('[getAllUsers]');
    const response = await firstValueFrom(this.userService.getAllUsers({}));

    Logger.log('[getAllUsers] response: ', response);

    throwIfError(response);

    return response.users;
  }

  @UseGuards(OwnerOrAdminGuard)
  @Get(':id')
  async getUser(@Param('id', ParseIntPipe) id: number): Promise<UserDto> {
    Logger.log('[getUser] id: ', id);
    const response = await firstValueFrom(this.userService.getUser({ id }));

    Logger.log('[getUser] response: ', response);

    throwIfError(response);

    return response.user;
  }

  @UseGuards(OwnerOrAdminGuard)
  @Patch(':id')
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto): Promise<UserDto> {
    Logger.log('[updateUser] id: ', id);
    const response = await firstValueFrom(this.userService.updateUser({ id, ...updateUserDto }));

    Logger.log('[getAllUsers] response: ', response);

    throwIfError(response);

    return response.user;
  }
}
