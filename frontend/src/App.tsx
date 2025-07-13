import { Routes, Route } from "react-router-dom";
import 'katex/dist/katex.min.css';
import { ThemeProvider } from "./hooks/useTheme";
import Layout from "./layouts/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import HomePage from "./pages/HomePage";
import EventsPage from "./pages/EventsPage";
import SimulatePage from "./pages/SimulatePage";
import CustomSimPage from "./pages/CustomSimPage";
import ModelsPage from "./pages/ModelsPage";
import ResultsPage from "./pages/ResultsPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/simulate/:eventId" element={<SimulatePage />} />
            <Route path="/custom" element={<CustomSimPage />} />
            <Route path="/models" element={<ModelsPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </ThemeProvider>
    </ErrorBoundary>
  );
}