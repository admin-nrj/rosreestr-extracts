import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDto } from '../dto/response.dto';

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): UserDto => {
  const request = ctx.switchToHttp().getRequest<{ user: UserDto }>();
  return request.user;
});
