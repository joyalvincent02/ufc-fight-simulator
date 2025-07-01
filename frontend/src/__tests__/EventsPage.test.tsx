import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import EventsPage from '../pages/EventsPage';
import * as api from '../services/api';

vi.mock('../services/api');

test('loads and displays events', async () => {
  const getEventsMock = vi.mocked(api.getEvents);
  getEventsMock.mockResolvedValue([{ id: '1', name: 'Event 1' }]);
  render(
    <MemoryRouter>
      <EventsPage />
    </MemoryRouter>
  );
  await waitFor(() => expect(screen.getByText('Event 1')).toBeInTheDocument());
});
