import { registerAs } from '@nestjs/config';
import { DEFAULT_NODE_ENV } from '@rosreestr-extracts/constants';

export default registerAs('app', () => ({
  environment: process.env.NODE_ENV ?? DEFAULT_NODE_ENV,
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),

  // Service ports
  ports: {
    apiGateway: parseInt(process.env.API_GATEWAY_PORT || '3003', 10),
    authService: parseInt(process.env.AUTH_SERVICE_PORT || '5001', 10),
    usersService: parseInt(process.env.USERS_SERVICE_PORT || '5002', 10),
    ordersService: parseInt(process.env.ORDERS_SERVICE_PORT || '5003', 10),
  },

  // Service URLs for gRPC connections
  urls: {
    authService: `${process.env.AUTH_SERVICE_HOST || 'localhost'}:${process.env.AUTH_SERVICE_PORT || '5001'}`,
    usersService: `${process.env.USERS_SERVICE_HOST || 'localhost'}:${process.env.USERS_SERVICE_PORT || '5002'}`,
    ordersService: `${process.env.ORDERS_SERVICE_HOST || 'localhost'}:${process.env.ORDERS_SERVICE_PORT || '5003'}`,
  },

  // Worker configuration
  worker: {
    rosreestrUserName: process.env.ROSREESTR_USER_NAME || '',
  },
}));
