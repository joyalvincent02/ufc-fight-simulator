import { Routes, Route } from "react-router-dom";
import 'katex/dist/katex.min.css';
import Layout from "./layouts/Layout";
import HomePage from "./pages/HomePage";
import EventsPage from "./pages/EventsPage";
import SimulatePage from "./pages/SimulatePage";
import CustomSimPage from "./pages/CustomSimPage";
import ModelsPage from "./pages/ModelsPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/simulate/:eventId" element={<SimulatePage />} />
        <Route path="/custom" element={<CustomSimPage />} />
        <Route path="/models" element={<ModelsPage />} />
      </Routes>
    </Layout>
  );
}