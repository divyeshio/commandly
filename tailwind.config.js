/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {}
  },
  plugins: [],
  components: {
    badge: {
      variants: {
        success:
          "border border-green-200 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900"
      }
    }
  }
};
