export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white text-sm py-4 mt-12">
      <div className="max-w-5xl mx-auto px-4 text-center">
        © {new Date().getFullYear()} UFC Fight Simulator. Built by Joyal Vincent.
        <br />
        This project is not affiliated with the UFC®. All names and data are used for educational purposes only. 
      </div>
    </footer>
  );
}
