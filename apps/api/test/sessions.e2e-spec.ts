import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { io, type Socket } from 'socket.io-client';
import { SessionsModule } from '../dist/sessions/sessions.module.js';

describe('Active sessions over Socket.io', () => {
  it.each(['polling', 'websocket'] as const)(
    'broadcasts connections, closure, refresh, and automatic reconnection over %s',
    async (transport) => {
      const module = await Test.createTestingModule({
        imports: [SessionsModule],
      }).compile();
      const app: INestApplication = module.createNestApplication({
        logger: false,
      });
      const clients: Socket[] = [];

      try {
        await app.listen(0, '127.0.0.1');
        const url = await app.getUrl();
        function createClient() {
          const client = io(url, {
            autoConnect: false,
            forceNew: true,
            transports: [transport],
            reconnectionDelay: 20,
            reconnectionDelayMax: 50,
          });
          clients.push(client);
          return client;
        }

        const first = createClient();
        const firstCounts: number[] = [];
        first.on('sessions:count', ({ count }: { count: number }) =>
          firstCounts.push(count),
        );
        first.connect();
        await vi.waitFor(() => expect(firstCounts.at(-1)).toBe(1));

        const second = createClient();
        const secondCounts: number[] = [];
        second.on('sessions:count', ({ count }: { count: number }) =>
          secondCounts.push(count),
        );
        second.connect();
        await vi.waitFor(() => {
          expect(firstCounts.at(-1)).toBe(2);
          expect(secondCounts.at(-1)).toBe(2);
        });

        second.disconnect();
        await vi.waitFor(() => expect(firstCounts.at(-1)).toBe(1));
        second.connect();
        await vi.waitFor(() => {
          expect(second.connected).toBe(true);
          expect(secondCounts).toEqual([2, 2]);
          expect(firstCounts.at(-1)).toBe(2);
        });

        const previousId = second.id;
        // Closing the transport simulates a network interruption, not a manual logout.
        second.io.engine.close();
        await vi.waitFor(() => {
          expect(second.connected).toBe(true);
          expect(second.id).not.toBe(previousId);
          expect(secondCounts.at(-1)).toBe(2);
          expect(firstCounts.slice(-2)).toEqual([1, 2]);
        });

        first.disconnect();
        await vi.waitFor(() => expect(secondCounts.at(-1)).toBe(1));
        second.disconnect();

        const replacement = createClient();
        const replacementCounts: number[] = [];
        replacement.on('sessions:count', ({ count }: { count: number }) =>
          replacementCounts.push(count),
        );
        replacement.connect();
        await vi.waitFor(() => expect(replacementCounts.at(-1)).toBe(1));
      } finally {
        clients.forEach((client) => client.disconnect());
        await app.close();
      }
    },
  );
});
