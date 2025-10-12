import { OrderEntity } from '@rosreestr-extracts/entities';

/**
 * Interface for order repository operations
 */
export interface IOrderRepository {
  /**
   * Find order by ID
   */
  findById(id: number): Promise<OrderEntity | null>;

  /**
   * Find all orders for a specific user
   */
  findByUserId(userId: number): Promise<OrderEntity[]>;

  /**
   * Find all orders
   */
  findAll(): Promise<OrderEntity[]>;

  /**
   * Create a new order
   */
  create(orderData: Partial<OrderEntity>): Promise<OrderEntity>;

  /**
   * Create multiple orders
   */
  createMany(ordersData: Partial<OrderEntity>[]): Promise<OrderEntity[]>;

  /**
   * Update an existing order
   */
  update(id: number, orderData: Partial<OrderEntity>): Promise<OrderEntity>;

  /**
   * Update order status
   */
  updateStatus(id: number, status: string): Promise<void>;

  /**
   * Mark order as complete
   */
  markComplete(id: number, completedAt?: Date): Promise<void>;

  /**
   * Soft delete an order
   */
  softDelete(id: number): Promise<void>;

  /**
   * Restore a soft-deleted order
   */
  restore(id: number): Promise<void>;
}
