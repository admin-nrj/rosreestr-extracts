export class UserDto {
  userId: number;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string;
  emailVerified: boolean;
  payCount: number;
  pbxExtension?: number;
}
