"use client";

export default function ThemeToggle() {
  return (
    <button
      className="p-2 rounded bg-gray-200 dark:bg-gray-800"
      onClick={() => {
      const html = document.documentElement;
      const computed = getComputedStyle(html);

      const darkBg = "#0a0a0a";
      const darkFg = "#ededed";
      const lightBg = "#ffffff";
      const lightFg = "#000000";

      // current value may come from media query or inline style
      const currentBg = (html.style.getPropertyValue("--background") || computed.getPropertyValue("--background")).trim();

      const saved = localStorage.getItem("theme");
      // consider it dark if saved as dark, or if no saved value and computed bg matches dark value
      const isCurrentlyDark = saved === "dark" || (!saved && currentBg === darkBg);

      if (isCurrentlyDark) {
        html.style.setProperty("--background", lightBg);
        html.style.setProperty("--foreground", lightFg);
        localStorage.setItem("theme", "light");
      } else {
        html.style.setProperty("--background", darkBg);
        html.style.setProperty("--foreground", darkFg);
        localStorage.setItem("theme", "dark");
      }
      }}
    >
      Toggle Theme
    </button>
  );
}