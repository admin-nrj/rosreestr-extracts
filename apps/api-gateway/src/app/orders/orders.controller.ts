import { Controller, Get, Post, Patch, Param, Body, UseGuards, Inject, ParseIntPipe } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  ORDERS_PACKAGE_NAME,
  ORDERS_SERVICE_NAME,
  OrdersServiceClient,
  CreateOrdersRequest,
  GetOrderRequest,
  Order,
} from '@rosreestr-extracts/interfaces';
import { ApiTags, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BaseGrpcController } from '../common/base-grpc.controller';
import { CreateOrderDto, UpdateOrderDto } from './dto';
import { convertDatesToTimestamp } from '@rosreestr-extracts/utils';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDto } from '../common/dto/response.dto';

/**
 * Orders HTTP controller for API Gateway
 * Exposes REST endpoints that communicate with orders-service via gRPC
 */
@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController extends BaseGrpcController<OrdersServiceClient> {
  constructor(@Inject(ORDERS_PACKAGE_NAME) client: ClientGrpc) {
    super(client, ORDERS_SERVICE_NAME);
  }

  @Post()
  async createOrders(@Body() body: CreateOrderDto[], @CurrentUser() user: UserDto) {
    const request: CreateOrdersRequest = {
      orders: body.map((order) => ({
        ...convertDatesToTimestamp<Order, CreateOrderDto>(order),
        userId: user.userId
      })),
    };

    return this.callGrpc(this.service.createOrders(request));
  }

  @Get()
  async getAllOrders() {
    return this.callGrpc(this.service.getAllOrders({}));
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Order ID', type: 'number' })
  async getOrderById(@Param('id', ParseIntPipe) id: number) {
    const request: GetOrderRequest = { id };
    const response = await this.callGrpc(this.service.getOrder(request))

    return response.order;
  }

  @Patch(':id')
  @ApiParam({ name: 'id', description: 'Order ID', type: 'number' })
  async updateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateOrderDto,
  ) {
    const request = convertDatesToTimestamp<Order, UpdateOrderDto>(body);
    const response = await this.callGrpc(this.service.updateOrder({ ...request, id }));

    return response.order;
  }
}
