import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RefreshTokenEntity } from '@rosreestr-extracts/entities';
import { IRefreshTokenRepository } from '../interfaces/refresh-token-repository.interface';

/**
 * Refresh token repository implementation
 */
@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly repository: Repository<RefreshTokenEntity>,
  ) {}

  async findByToken(token: string): Promise<RefreshTokenEntity | null> {
    return this.repository.findOne({
      where: { token, isRevoked: false },
      relations: ['user'],
    });
  }

  async create(tokenData: {
    userId: number;
    token: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<RefreshTokenEntity> {
    const refreshToken = this.repository.create(tokenData);
    return this.repository.save(refreshToken);
  }

  async revoke(token: string): Promise<void> {
    await this.repository.update(
      { token },
      { isRevoked: true, revokedAt: new Date() }
    );
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.repository.update(
      { userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );
  }

  async deleteExpired(): Promise<void> {
    await this.repository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  async findActiveByUserId(userId: number): Promise<RefreshTokenEntity[]> {
    return this.repository.find({
      where: {
        userId,
        isRevoked: false,
      },
      order: { createdAt: 'DESC' },
    });
  }
}
