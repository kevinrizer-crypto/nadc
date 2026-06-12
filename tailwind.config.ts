import type { Config } from "tailwindcss";

// Palette derived from the NADC brand assets (/public/brand):
//   shield charcoal  #3F403A
//   shield blue      #00469C
//   shield red       #CC1332
// The previous site used a near-identical navy/red family (#1B3A8C / #CC1F2D);
// tokens below keep that continuity while matching the supplied logo exactly.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#00469C",
          dark: "#003573",
          light: "#1B5FB8",
        },
        accent: {
          DEFAULT: "#CC1332",
          dark: "#A50F28",
        },
        ink: "#3F403A",
        paper: "#F7F7F5",
      },
      fontFamily: {
        display: ['"DM Serif Display"', "Georgia", "serif"],
        body: ['"DM Sans"', "system-ui", "sans-serif"],
        mono: ['"DM Mono"', "monospace"],
      },
      fontSize: {
        "2xs": "0.6875rem",
      },
    },
  },
  plugins: [],
};

export default config;
