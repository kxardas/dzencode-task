import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { AUTH_CONFIG, type AuthConfig } from './auth.config.js';

@Injectable()
export class WriteOriginGuard implements CanActivate {
  constructor(@Inject(AUTH_CONFIG) private readonly config: AuthConfig) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (
      request.headers.origin !== this.config.origin ||
      request.headers['x-inventory-request'] !== '1'
    ) {
      throw new ForbiddenException('Untrusted write request');
    }
    return true;
  }
}
