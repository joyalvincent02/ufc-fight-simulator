export default function Footer() {
  return (
    <footer className="bg-white dark:bg-black text-gray-900 dark:text-white text-sm border-t border-gray-200 dark:border-white/10">
      <div className="max-w-5xl mx-auto px-4 py-6 text-center leading-relaxed">
        © {new Date().getFullYear()}{" "}
        <span className="font-semibold">MMA Math</span>. Built by Joyal Vincent.
        <br />
        <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
          This project is not affiliated with the UFC®. All names and data are used for educational purposes only.
        </span>
      </div>
    </footer>
  );
}
