import { Module } from '@nestjs/common';
import { SessionsGateway } from './sessions.gateway.js';

@Module({ providers: [SessionsGateway] })
export class SessionsModule {}
