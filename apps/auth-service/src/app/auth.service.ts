import { Inject, Injectable } from '@nestjs/common';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
  ErrorCode,
  ValidateTokenResponse,
  ValidateTokenRequest
} from '@rosreestr-extracts/interfaces';
import { CryptoService } from '@rosreestr-extracts/crypto';
import { jwtConfig } from '@rosreestr-extracts/config';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '@rosreestr-extracts/dal';
import { RefreshTokenRepository } from './dal/repositories/refresh-token.repository';
import { UserEntity, UserRole as EntityUserRole } from '@rosreestr-extracts/entities';
import { JwtPayload, JwtRefreshPayload } from './interfaces/jwt-payload.interface';
import {
  createErrorResponse,
  getErrorMessage,
  getErrorName,
  mapUserToProto,
} from '@rosreestr-extracts/utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly cryptoService: CryptoService,
    @Inject(jwtConfig.KEY)
    private readonly jwt: ConfigType<typeof jwtConfig>
  ) {}

  /**
   * Register a new user
   * @param registerData - Registration data (email, password, name)
   * @returns Registration result with tokens and user data or error
   */
  async register(registerData: RegisterRequest): Promise<RegisterResponse> {
    try {
      if (!registerData.email || !registerData.password) {
        return createErrorResponse(ErrorCode.MISSING_REQUIRED_FIELD);
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registerData.email)) {
        return createErrorResponse(ErrorCode.INVALID_EMAIL_FORMAT);
      }

      const existingUser = await this.userRepository.findByEmail(registerData.email);
      if (existingUser) {
        return createErrorResponse(ErrorCode.USER_ALREADY_EXISTS);
      }

      if (registerData.password.length < 8) {
        return createErrorResponse(ErrorCode.PASSWORD_TOO_SHORT);
      }

      const passwordHash = await this.cryptoService.hashPassword(registerData.password);

      const newUser = await this.userRepository.create({
        email: registerData.email,
        passwordHash,
        name: registerData.name || '',
        role: EntityUserRole.USER,
        isActive: true,
        emailVerified: false,
      });

      const tokens = await this.generateTokens(newUser);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: mapUserToProto(newUser),
      };
    } catch (error) {
      console.log('[register] error: ', getErrorMessage(error));
      return createErrorResponse(ErrorCode.INTERNAL_ERROR);
    }
  }

  /**
   * Authenticate user with email and password
   * @param loginData - Login credentials
   * @returns Login result with tokens and user data or error
   */
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    try {
      if (!loginData.email || !loginData.password) {
        return createErrorResponse(ErrorCode.MISSING_REQUIRED_FIELD);
      }

      const user = await this.validateUser(loginData.email);

      const isPasswordValid = await this.cryptoService.comparePassword(loginData.password, user.passwordHash);

      if (!isPasswordValid) {
        return createErrorResponse(ErrorCode.INVALID_CREDENTIALS);
      }

      await this.userRepository.updateLastLogin(user.id);

      return { user: mapUserToProto(user), };
    } catch (error) {
      let errorCode = ErrorCode.INTERNAL_ERROR;
      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'User not found') {
        errorCode = ErrorCode.USER_NOT_FOUND;
      } else if (errorMessage === 'User not active') {
        errorCode = ErrorCode.USER_NOT_ACTIVE;
      }

      return createErrorResponse(errorCode);
    }
  }

  async validateToken({ email }: ValidateTokenRequest): Promise<ValidateTokenResponse> {
    try {
      const user = await this.validateUser(email);

      return { user: mapUserToProto(user) };
    } catch (error) {
      let errorCode = ErrorCode.INVALID_TOKEN;
      const errorMessage = getErrorMessage(error);
      if (getErrorName(error) === 'TokenExpiredError') {
        errorCode = ErrorCode.TOKEN_EXPIRED;
      } else if (errorMessage === 'User not found') {
        errorCode = ErrorCode.USER_NOT_FOUND;
      } else if (errorMessage === 'User not active') {
        errorCode = ErrorCode.USER_NOT_ACTIVE;
      }

      return createErrorResponse(errorCode);
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
        return createErrorResponse(ErrorCode.REFRESH_TOKEN_NOT_FOUND);
      }

      if (storedToken.expiresAt < new Date()) {
        await this.refreshTokenRepository.revoke(refreshToken);
        return createErrorResponse(ErrorCode.TOKEN_EXPIRED);
      }

      const user = await this.validateUser(payload.email);

      await this.refreshTokenRepository.revoke(refreshToken);

      const tokens = await this.generateTokens(user);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: mapUserToProto(user),
      };
    } catch (error) {
      let errorCode = ErrorCode.INVALID_TOKEN;
      const errorMessage = getErrorMessage(error);
      if (getErrorName(error) === 'TokenExpiredError') {
        errorCode = ErrorCode.TOKEN_EXPIRED;
      } else if (errorMessage === 'User not found') {
        errorCode = ErrorCode.USER_NOT_FOUND;
      } else if (errorMessage === 'User not active') {
        errorCode = ErrorCode.USER_NOT_ACTIVE;
      }

      return createErrorResponse(errorCode);
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

  async generateTokens(user: Pick<UserEntity, "id" | "email" | "name" | "role">) {
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
