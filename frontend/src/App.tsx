import { Routes, Route } from 'react-router-dom';
import EventsPage from './pages/EventsPage';
import SimulatePage from './pages/SimulatePage';
import CustomSimPage from './pages/CustomSimPage';

export default function App() {
  return (
    <Routes>
      <Route path="/events" element={<EventsPage />} />
      <Route path="/simulate/:eventId" element={<SimulatePage />} />
      <Route path="/custom" element={<CustomSimPage />} />
    </Routes>
  );
}
