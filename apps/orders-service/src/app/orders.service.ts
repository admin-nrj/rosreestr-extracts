import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { OrderRepository } from '../dal/repositories/order.repository';
import { OrderEntity } from '@rosreestr-extracts/entities';
import {
  CreateOrdersRequest,
  CreateOrdersResponse,
  GetAllOrdersResponse,
  GetOrderRequest,
  OrderResponse,
  UpdateOrderRequest,
  GetRegisteredOrdersResponse,
  Order,
  ErrorCode,
} from '@rosreestr-extracts/interfaces';
import {
  createErrorResponse,
  getErrorMessage,
  convertTimestampsToDate,
  convertDatesToTimestamp,
} from '@rosreestr-extracts/utils';
import {
  ORDER_QUEUE_NAME,
  ORDER_JOB_NAMES,
  QUEUE_CONFIG,
  OrderJobData
} from '@rosreestr-extracts/queue';

/**
 * Orders service
 * Handles business logic for order operations
 */
@Injectable()
export class OrdersService {
  constructor(
    private readonly orderRepository: OrderRepository,
    @InjectQueue(ORDER_QUEUE_NAME) private readonly orderQueue: Queue<OrderJobData>
  ) {}

  /**
   * Create multiple orders
   */
  async createOrders(request: CreateOrdersRequest): Promise<CreateOrdersResponse> {
    try {
      const ordersData = request.orders
        .map((order) => this.mapProtoToEntity(order));
      const createdOrders = await this.orderRepository.createMany(ordersData);

      // Send each order to the processing queue
      for (const order of createdOrders) {
        const jobData: OrderJobData = {
          orderId: order.id,
          cadNum: order.cadNum,
          userId: order.userId,
        };

        await this.orderQueue.add(
          ORDER_JOB_NAMES.PROCESS_ORDER,
          jobData,
          QUEUE_CONFIG.DEFAULT_JOB_OPTIONS
        );

        Logger.log(`[createOrders] Order ${order.id} added to queue`);
      }

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
   * Get registered orders that need status checking
   * Returns orders where is_complete=false AND status=REGISTERED AND rosreestr_order_num IS NOT NULL
   */
  async getRegisteredOrders(): Promise<GetRegisteredOrdersResponse> {
    try {
      const orders = await this.orderRepository.findRegisteredOrders();

      Logger.log(`[getRegisteredOrders] Found ${orders.length} registered orders to check`);

      return {
        orders: orders.map((order) => this.mapEntityToProto(order)),
        error: undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error('[getRegisteredOrders] error: ', errorMessage);
      return {
        orders: [],
        ...createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to fetch registered orders'),
      };
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
