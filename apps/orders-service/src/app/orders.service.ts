import { Injectable, Logger } from '@nestjs/common';
import { OrderRepository } from '../dal/repositories/order.repository';
import { OrderEntity } from '@rosreestr-extracts/entities';
import {
  CreateOrdersRequest,
  CreateOrdersResponse,
  GetAllOrdersResponse,
  GetOrderRequest,
  OrderResponse,
  UpdateOrderRequest,
  Order,
  ErrorCode,
} from '@rosreestr-extracts/interfaces';
import {
  createErrorResponse,
  getErrorMessage,
  convertTimestampsToDate,
  convertDatesToTimestamp,
} from '@rosreestr-extracts/utils';

/**
 * Orders service
 * Handles business logic for order operations
 */
@Injectable()
export class OrdersService {
  constructor(private readonly orderRepository: OrderRepository) {}

  /**
   * Create multiple orders
   */
  async createOrders(request: CreateOrdersRequest): Promise<CreateOrdersResponse> {
    try {
      const ordersData = request.orders
        .map((order) => this.mapProtoToEntity(order));
      const createdOrders = await this.orderRepository.createMany(ordersData);
      // TODO send message to queues

      return {
        data: createdOrders.map((order) => this.mapEntityToProto(order)),
        error: undefined,
      };
    } catch (error) {
      Logger.error('[createOrders] error: ', getErrorMessage(error));
      return {
        data: [],
        ...createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to create orders'),
      };
    }
  }

  /**
   * Get all orders
   */
  async getAllOrders(): Promise<GetAllOrdersResponse> {
    try {
      const orders = await this.orderRepository.findAll();

      return {
        data: orders.map((order) => this.mapEntityToProto(order)),
        error: undefined,
      };
    } catch (error) {
      Logger.error('[getAllOrders] error: ', getErrorMessage(error));
      return {
        data: [],
        ...createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to fetch orders'),
      };
    }
  }

  /**
   * Get single order by ID
   */
  async getOrder(request: GetOrderRequest): Promise<OrderResponse> {
    try {
      const order = await this.orderRepository.findById(request.id);

      if (!order) {
        Logger.error('[getOrder] error: ', `Order with id ${request.id} not found`);
        return createErrorResponse(ErrorCode.USER_NOT_FOUND, `Order with id ${request.id} not found`)
      }

      return {
        order: this.mapEntityToProto(order),
        error: undefined,
      };
    } catch (error) {
      Logger.error('[getOrder] error: ', getErrorMessage(error));
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to fetch order')
    }
  }

  /**
   * Update an existing order
   */
  async updateOrder(request: UpdateOrderRequest): Promise<OrderResponse> {
    try {
      const updateData = convertTimestampsToDate<Partial<OrderEntity>, UpdateOrderRequest>(request);
      const updatedOrder = await this.orderRepository.update(request.id, updateData);

      return {
        order: this.mapEntityToProto(updatedOrder),
        error: undefined,
      };
    } catch (error) {
      Logger.error('[updateOrder] error: ', getErrorMessage(error));
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to update order')
    }
  }

  /**
   * Map proto Order to OrderEntity
   */
  private mapProtoToEntity(protoOrder: Order): Partial<OrderEntity> {
    // const cleanedEntity = removeUndefinedFields<Partial<Order>>(protoOrder);
    return convertTimestampsToDate<OrderEntity, Order>(protoOrder);
  }

  /**
   * Map OrderEntity to proto Order
   */
  private mapEntityToProto(entity: OrderEntity): Order {
    return convertDatesToTimestamp<Order, OrderEntity>(entity);
  }
}
