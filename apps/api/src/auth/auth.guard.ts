import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      !(await this.auth.session(context.switchToHttp().getRequest<Request>()))
    ) {
      throw new UnauthorizedException('Sign in to change inventory');
    }
    return true;
  }
}
