import type { Server, Socket } from 'socket.io';
import { SessionsGateway } from './sessions.gateway.js';

describe('SessionsGateway', () => {
  const emit = vi.fn();
  let gateway: SessionsGateway;
  const first = { id: 'first' } as Socket;
  const second = { id: 'second' } as Socket;

  beforeEach(() => {
    emit.mockReset();
    gateway = new SessionsGateway();
    gateway.server = { emit } as unknown as Server<
      Record<string, never>,
      {
        'sessions:count': (payload: { count: number }) => void;
      }
    >;
  });

  it('broadcasts updated counts when tabs connect and disconnect', () => {
    gateway.handleConnection(first);
    gateway.handleConnection(second);
    gateway.handleDisconnect(first);
    gateway.handleDisconnect(second);
    expect(emit.mock.calls).toEqual([
      ['sessions:count', { count: 1 }],
      ['sessions:count', { count: 2 }],
      ['sessions:count', { count: 1 }],
      ['sessions:count', { count: 0 }],
    ]);
  });

  it('does not double-count a connection or underflow on repeated disconnection', () => {
    gateway.handleConnection(first);
    gateway.handleConnection(first);
    expect(emit).toHaveBeenLastCalledWith('sessions:count', { count: 1 });
    gateway.handleDisconnect(first);
    gateway.handleDisconnect(first);
    gateway.handleDisconnect(second);
    expect(emit).toHaveBeenLastCalledWith('sessions:count', { count: 0 });
    expect(emit).toHaveBeenCalledTimes(3);
  });

  it('counts a reconnected tab once under its new socket ID', () => {
    gateway.handleConnection(first);
    gateway.handleDisconnect(first);
    gateway.handleConnection(second);
    expect(emit).toHaveBeenLastCalledWith('sessions:count', { count: 1 });
  });
});
