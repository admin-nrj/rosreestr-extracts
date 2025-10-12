import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import {
  CreateOrdersRequest,
  CreateOrdersResponse,
  GetAllOrdersResponse,
  GetOrderRequest,
  OrderResponse,
  UpdateOrderRequest,
  OrdersServiceController,
} from '@rosreestr-extracts/interfaces';

/**
 * Orders gRPC controller
 * Handles gRPC requests for order operations
 */
@Controller()
export class OrdersController implements OrdersServiceController {
  constructor(private readonly ordersService: OrdersService) {}

  @GrpcMethod('OrdersService', 'CreateOrders')
  async createOrders(request: CreateOrdersRequest): Promise<CreateOrdersResponse> {
    return this.ordersService.createOrders(request);
  }

  @GrpcMethod('OrdersService', 'GetAllOrders')
  async getAllOrders(): Promise<GetAllOrdersResponse> {
    return this.ordersService.getAllOrders();
  }

  @GrpcMethod('OrdersService', 'GetOrder')
  async getOrder(request: GetOrderRequest): Promise<OrderResponse> {
    return this.ordersService.getOrder(request);
  }

  @GrpcMethod('OrdersService', 'UpdateOrder')
  async updateOrder(request: UpdateOrderRequest): Promise<OrderResponse> {
    return this.ordersService.updateOrder(request);
  }
}
