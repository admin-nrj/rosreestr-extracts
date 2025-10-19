import { join } from 'path';

// Export paths to proto files for gRPC service configuration
export const AUTH_PROTO_PATH = join(__dirname, 'auth.proto');
export const USERS_PROTO_PATH = join(__dirname, 'users.proto');
export const ORDERS_PROTO_PATH = join(__dirname, 'orders.proto');
export const ROSREESTR_USERS_PROTO_PATH = join(__dirname, 'rosreestr-users.proto');
export const ANOMALY_QUESTIONS_PROTO_PATH = join(__dirname, 'anomaly-questions.proto');
