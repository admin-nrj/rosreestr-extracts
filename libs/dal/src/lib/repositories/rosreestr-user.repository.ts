import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RosreestrUserEntity } from '@rosreestr-extracts/entities';
import { IRosreestrUserRepository } from '../interfaces/rosreestr-user-repository.interface';

/**
 * Rosreestr User repository implementation
 * Handles all database operations for Rosreestr users (workers)
 */
@Injectable()
export class RosreestrUserRepository implements IRosreestrUserRepository {
  constructor(
    @InjectRepository(RosreestrUserEntity)
    private readonly repository: Repository<RosreestrUserEntity>,
  ) {}

  async findById(id: number): Promise<RosreestrUserEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByUsername(username: string): Promise<RosreestrUserEntity | null> {
    return this.repository.findOne({ where: { username } });
  }

  async create(userData: Partial<RosreestrUserEntity>): Promise<RosreestrUserEntity> {
    const user = this.repository.create(userData);
    return this.repository.save(user);
  }

  async update(id: number, userData: Partial<RosreestrUserEntity>): Promise<RosreestrUserEntity> {
    await this.repository.update(id, userData);
    const updatedUser = await this.findById(id);
    if (!updatedUser) {
      throw new Error(`Rosreestr user with id ${id} not found`);
    }
    return updatedUser;
  }

  async softDelete(id: number): Promise<void> {
    await this.repository.softDelete(id);
  }

  async restore(id: number): Promise<void> {
    await this.repository.restore(id);
  }

  async usernameExists(username: string): Promise<boolean> {
    const count = await this.repository.count({ where: { username } });
    return count > 0;
  }
}
