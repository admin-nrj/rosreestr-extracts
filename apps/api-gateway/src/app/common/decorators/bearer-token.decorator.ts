import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const BearerToken = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<{ headers: { authorization: string } }>();
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    throw new UnauthorizedException('Token is required');
  }

  return authHeader.split(' ')[1];
})
