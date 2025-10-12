import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '@rosreestr-extracts/entities';
import { IOrderRepository } from '../interfaces/order-repository.interface';

/**
 * Order repository implementation
 * Handles all database operations for orders
 */
@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>,
  ) {}

  async findById(id: number): Promise<OrderEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByUserId(userId: number): Promise<OrderEntity[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(): Promise<OrderEntity[]> {
    return this.repository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async create(orderData: Partial<OrderEntity>): Promise<OrderEntity> {
    const order = this.repository.create(orderData);
    return this.repository.save(order);
  }

  async createMany(ordersData: Partial<OrderEntity>[]): Promise<OrderEntity[]> {
    const orders = this.repository.create(ordersData);
    return this.repository.save(orders);
  }

  async update(id: number, orderData: Partial<OrderEntity>): Promise<OrderEntity> {
    await this.repository.update(id, orderData);
    const updatedOrder = await this.findById(id);
    if (!updatedOrder) {
      throw new Error(`Order with id ${id} not found`);
    }
    return updatedOrder;
  }

  async updateStatus(id: number, status: string): Promise<void> {
    await this.repository.update(id, { status });
  }

  async markComplete(id: number, completedAt: Date = new Date()): Promise<void> {
    await this.repository.update(id, {
      isComplete: true,
      completedAt,
    });
  }

  async softDelete(id: number): Promise<void> {
    await this.repository.softDelete(id);
  }

  async restore(id: number): Promise<void> {
    await this.repository.restore(id);
  }
}
