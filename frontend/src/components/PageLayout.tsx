import { type ReactNode } from "react";

interface PageLayoutProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export default function PageLayout({ title, children, className = "" }: PageLayoutProps) {
  return (
    <div className={`min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden ${className}`}>
      {/* Background glow accents */}
      <div className="absolute -top-20 -left-32 w-[500px] h-[500px] bg-red-700 opacity-20 rounded-full blur-[160px] z-0" />
      <div className="absolute bottom-[-80px] right-[-60px] w-[300px] h-[300px] bg-red-500 opacity-10 rounded-full blur-[100px] z-0" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-10 text-center">{title}</h1>
        {children}
      </div>
    </div>
  );
}
