import '@testing-library/jest-dom';
// Provide a default value for base API URL in tests
if (!import.meta.env.VITE_API_BASE_URL) {
  // @ts-ignore
  import.meta.env.VITE_API_BASE_URL = 'http://localhost';
}
