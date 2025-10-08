import { Inject, Injectable } from '@nestjs/common';
import { LoginRequest, LoginResponse, RefreshTokenResponse, UserRole } from '@rosreestr-extracts/interfaces';
import { CryptoService } from '@rosreestr-extracts/crypto';
import { jwtConfig } from '@rosreestr-extracts/config';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from './dal/repositories/user.repository';
import { RefreshTokenRepository } from './dal/repositories/refresh-token.repository';
import { UserEntity, UserRole as EntityUserRole } from '@rosreestr-extracts/entities';
import { JwtPayload, JwtRefreshPayload, ValidateTokenResponse } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {

  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly cryptoService: CryptoService,
    @Inject(jwtConfig.KEY)
    private readonly jwt: ConfigType<typeof jwtConfig>,
  ) {}

  /**
   * Authenticate user with email and password
   * @param loginData - Login credentials
   * @returns Login result with tokens and user data or error
   */
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    try {
      if (!loginData.email || !loginData.password) {
        return {
          accessToken: '',
          refreshToken: '',
          user: undefined,
          error: 'Email and password are required',
        };
      }

      const user = await this.validateUser(loginData.email)

      const isPasswordValid = await this.cryptoService.comparePassword(
        loginData.password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        return {
          accessToken: '',
          refreshToken: '',
          user: undefined,
          error: 'Invalid credentials',
        };
      }

      await this.userRepository.updateLastLogin(user.id);

      const tokens = await this.generateTokens(user);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: this.mapUserToProto(user),
        error: undefined
      };
    } catch (error) {
      return {
        accessToken: '',
        refreshToken: '',
        user: undefined,
        error: error.message || 'Login failed',
      };
    }
  }
  //
  // async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
  //   const createUserDto: CreateUserDto = {
  //     name: registerDto.email.split('@')[0],
  //     email: registerDto.email,
  //     password: registerDto.password,
  //     role: UserRole.USER,
  //   };
  //
  //   let userDto: UserResponseDto;
  //   try {
  //     userDto = await this.userRepository.create(createUserDto);
  //   } catch (error) {
  //     if (error instanceof ConflictException) {
  //       throw error;
  //     }
  //     throw new ConflictException(`Пользователь с email ${registerDto.email} уже существует`);
  //   }
  //
  //   const tokens = this.generateTokens(userDto);
  //
  //   return {
  //     ...tokens,
  //     user: {
  //       userId: userDto.userId,
  //       email: userDto.email,
  //       name: userDto.name,
  //       role: userDto.role,
  //     },
  //   };
  // }


  /**
   * Validate JWT token and check user in database
   * @param token - JWT access token
   * @returns Validation result with user data or error
   */
  async validateToken(token: string): Promise<ValidateTokenResponse> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.jwt.secret,
      });

      const user = await this.validateUser(payload.email)

      return {
        valid: true,
        user: this.mapUserToProto(user),
        error: undefined
      };
    } catch (error) {
      return {
        valid: false,
        user: undefined,
        error: error.message || 'Invalid token'
      };
    }
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken - Refresh token string
   * @returns New token pair and user data or error
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const payload = this.jwtService.verify<JwtRefreshPayload>(refreshToken, {
        secret: this.jwt.refreshSecret,
      });

      const storedToken = await this.refreshTokenRepository.findByToken(refreshToken);

      if (!storedToken) {
        return {
          accessToken: '',
          refreshToken: '',
          user: undefined,
          error: 'Invalid refresh token',
        };
      }

      if (storedToken.expiresAt < new Date()) {
        await this.refreshTokenRepository.revoke(refreshToken);

        return {
          accessToken: '',
          refreshToken: '',
          user: undefined,
          error: 'Refresh token expired',
        };
      }

      const user = await this.validateUser(payload.email);

      await this.refreshTokenRepository.revoke(refreshToken);

      const tokens = await this.generateTokens(user);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: this.mapUserToProto(user),
        error: undefined
      };
    } catch (error) {
      return {
        accessToken: '',
        refreshToken: '',
        user: undefined,
        error: error.message || 'Failed to refresh token',
      };
    }
  }

  /**
   * Validate user status (active and not soft-deleted)
   * @returns Error message if validation fails, null if user is valid
   * @param email
   */
  private async validateUser(email: string) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isActive) {
      throw new Error('User not active');
    }

    return user;
  }

  /**
   * Map UserEntity to proto User message
   * @param entity - User entity from database
   * @returns Proto User message without sensitive data
   */
  private mapUserToProto(entity: UserEntity) {
    return {
      userId: entity.id,
      email: entity.email,
      name: entity.name || '',
      role: this.mapRoleToProto(entity.role),
      isActive: entity.isActive,
      lastLoginAt: entity.lastLoginAt?.toISOString() || '',
      emailVerified: entity.emailVerified,
    };
  }

  /**
   * Convert entity UserRole (string) to proto UserRole (number)
   */
  private mapRoleToProto(role: EntityUserRole): UserRole {
    const roleMap = {
      [EntityUserRole.USER]: UserRole.USER,
      [EntityUserRole.ADMIN]: UserRole.ADMIN,
    };
    return roleMap[role] || UserRole.USER_ROLE_UNSPECIFIED;
  }

  private async generateTokens(user: UserEntity) {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.jwt.secret,
      expiresIn: this.jwt.expiresIn,
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.jwt.refreshSecret,
      expiresIn: this.jwt.refreshExpiresIn,
    });

    // Calculate expiration date for refresh token
    const expiresIn = this.jwt.refreshExpiresIn || '7d';
    const expiresAt = this.calculateExpirationDate(expiresIn);

    await this.refreshTokenRepository.create({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Calculate expiration date from JWT expiration string
   */
  private calculateExpirationDate(expiresIn: string): Date {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error('Invalid expiresIn format');
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    const now = new Date();
    switch (unit) {
      case 's':
        now.setSeconds(now.getSeconds() + value);
        break;
      case 'm':
        now.setMinutes(now.getMinutes() + value);
        break;
      case 'h':
        now.setHours(now.getHours() + value);
        break;
      case 'd':
        now.setDate(now.getDate() + value);
        break;
    }
    return now;
  }
}
