import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ROSREESTR_USERS_PACKAGE_NAME,
  RosreestrUser,
  RosreestrUsersServiceClient,
} from '@rosreestr-extracts/interfaces';
import { ClientGrpc } from '@nestjs/microservices';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@rosreestr-extracts/entities';
import { BaseGrpcController } from '../common/base-grpc.controller';
import {
  CreateRosreestrUserDto,
  UpdateRosreestrUserDto,
  RosreestrUserDto,
} from './dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('rosreestr-users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class RosreestrUsersController extends BaseGrpcController<RosreestrUsersServiceClient> {
  private readonly logger = new Logger(RosreestrUsersController.name);

  constructor(@Inject(ROSREESTR_USERS_PACKAGE_NAME) client: ClientGrpc) {
    super(client, 'RosreestrUsersService');
  }

  private toDto(data: RosreestrUser): RosreestrUserDto {
    const { passwordEncrypted: _, ...rest } = data;
    return rest;
  }

  @Post()
  async createRosreestrUser(@Body() dto: CreateRosreestrUserDto): Promise<RosreestrUserDto> {
    this.logger.log('[createRosreestrUser] dto:', dto);

    const response = await this.callGrpc(
      this.service.createRosreestrUser({
        username: dto.username,
        password: dto.password,
        guLogin: dto.guLogin,
        comment: dto.comment,
      })
    );

    this.logger.log('[createRosreestrUser] response:', response);
    return this.toDto(response.rosreestrUser);
  }

  @Get()
  async getAllRosreestrUsers(): Promise<RosreestrUserDto[]> {
    this.logger.log('[getAllRosreestrUsers]');

    const response = await this.callGrpc(this.service.getAllRosreestrUsers({}));

    this.logger.log('[getAllRosreestrUsers] response:', response);
    return response.data.map((user: RosreestrUser) => this.toDto(user));
  }

  @Get(':id')
  async getRosreestrUser(@Param('id', ParseIntPipe) id: number): Promise<RosreestrUserDto> {
    this.logger.log('[getRosreestrUser] id:', id);

    const response = await this.callGrpc(this.service.getRosreestrUser({ id }));

    this.logger.log('[getRosreestrUser] response:', response);
    return this.toDto(response.rosreestrUser);
  }

  @Get('by-username/:username')
  async getRosreestrUserByUsername(@Param('username') username: string): Promise<RosreestrUserDto> {
    this.logger.log('[getRosreestrUserByUsername] username:', username);

    const response = await this.callGrpc(
      this.service.getRosreestrUserByUsername({ username })
    );

    this.logger.log('[getRosreestrUserByUsername] response:', response);
    return this.toDto(response.rosreestrUser);
  }

  @Patch(':id')
  async updateRosreestrUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRosreestrUserDto
  ): Promise<RosreestrUserDto> {
    this.logger.log('[updateRosreestrUser] id:', id, 'dto:', dto);

    const response = await this.callGrpc(
      this.service.updateRosreestrUser({
        id,
        ...dto,
      })
    );

    this.logger.log('[updateRosreestrUser] response:', response);
    return this.toDto(response.rosreestrUser);
  }

  @Delete(':id')
  async deleteRosreestrUser(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
    this.logger.log('[deleteRosreestrUser] id:', id);

    const response = await this.callGrpc(this.service.deleteRosreestrUser({ id }));

    this.logger.log('[deleteRosreestrUser] response:', response);
    return { success: response.success };
  }
}
