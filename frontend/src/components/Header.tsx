import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="bg-black text-white px-4 py-3 shadow">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold tracking-tight">
          UFC Simulator
        </Link>
        <nav className="space-x-4 text-sm">
          <Link to="/events" className="hover:underline">
            Events
          </Link>
          <Link to="/custom" className="hover:underline">
            Custom
          </Link>
        </nav>
      </div>
    </header>
  );
}
