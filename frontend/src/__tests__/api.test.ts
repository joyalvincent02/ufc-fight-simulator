import { getEvents, simulateEvent } from '../services/api';
import { vi } from 'vitest';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('getEvents calls correct endpoint', async () => {
  fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve(['ok']) });
  await getEvents();
  expect(fetchMock).toHaveBeenCalledWith(`${import.meta.env.VITE_API_BASE_URL}/events`);
});

test('simulateEvent calls correct endpoint', async () => {
  fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve(['ok']) });
  await simulateEvent('123');
  expect(fetchMock).toHaveBeenCalledWith(`${import.meta.env.VITE_API_BASE_URL}/simulate-event/123`);
});
