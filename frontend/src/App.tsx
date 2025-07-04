import { Routes, Route } from "react-router-dom";
import 'katex/dist/katex.min.css';
import { ThemeProvider } from "./hooks/useTheme";
import Layout from "./layouts/Layout";
import HomePage from "./pages/HomePage";
import EventsPage from "./pages/EventsPage";
import SimulatePage from "./pages/SimulatePage";
import CustomSimPage from "./pages/CustomSimPage";
import ModelsPage from "./pages/ModelsPage";
import ResultsPage from "./pages/ResultsPage";

export default function App() {
  return (
    <ThemeProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/simulate/:eventId" element={<SimulatePage />} />
          <Route path="/custom" element={<CustomSimPage />} />
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}