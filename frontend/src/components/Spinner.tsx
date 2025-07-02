const Spinner = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md">
    <div className="relative w-12 h-12 mb-3">
      <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-spin"></div>
      <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-red-600 animate-spin"></div>
    </div>
    <p className="text-sm text-white font-semibold tracking-wide uppercase">Simulating Fight Card</p>
  </div>
);

export default Spinner;
