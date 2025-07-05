import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-black">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
