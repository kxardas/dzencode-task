import '../config/environment.js';
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

interface SessionEvents {
  'sessions:count': (payload: { count: number }) => void;
}

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' },
})
export class SessionsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server<Record<string, never>, SessionEvents>;

  private readonly connections = new Set<string>();

  handleConnection(client: Socket): void {
    this.connections.add(client.id);
    this.broadcastCount();
  }

  handleDisconnect(client: Socket): void {
    if (this.connections.delete(client.id)) this.broadcastCount();
  }

  private broadcastCount(): void {
    this.server.emit('sessions:count', { count: this.connections.size });
  }
}
