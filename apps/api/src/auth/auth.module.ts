import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AUTH_CONFIG, readAuthConfig } from './auth.config.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './auth.guard.js';
import { WriteOriginGuard } from './write-origin.guard.js';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    { provide: AUTH_CONFIG, useFactory: readAuthConfig },
    AuthService,
    AuthGuard,
    WriteOriginGuard,
  ],
  exports: [AuthGuard, WriteOriginGuard, AuthService, AUTH_CONFIG],
})
export class AuthModule {}
