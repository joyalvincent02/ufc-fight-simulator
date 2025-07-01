// src/components/Spinner.tsx
const Spinner = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
    <div className="relative w-12 h-12 mb-3">
      <div className="absolute inset-0 rounded-full border-4 border-gray-300 animate-spin"></div>
      <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-red-600 animate-spin"></div>
    </div>
    <p className="text-sm text-gray-700 font-semibold tracking-wide uppercase">Simulating Fight Card</p>
  </div>
);

export default Spinner;
