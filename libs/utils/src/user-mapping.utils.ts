import { UserEntity } from '@rosreestr-extracts/entities';

/**
 * Map UserEntity to proto User message
 * @param entity - User entity from database
 * @returns Proto User message without sensitive data
 */
export function mapUserToProto(entity: UserEntity) {
  return {
    userId: entity.id,
    email: entity.email,
    name: entity.name || '',
    role: entity.role,
    isActive: entity.isActive,
    lastLoginAt: entity.lastLoginAt?.toISOString() || '',
    emailVerified: entity.emailVerified,
    payCount: entity.payCount,
    pbxExtension: entity.pbxExtension
  };
}
