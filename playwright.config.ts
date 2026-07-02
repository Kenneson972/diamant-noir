import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mocked",
      testMatch: [
        "tests/stripe-checkout-mocked.spec.ts",
        "tests/cgv-checkout.spec.ts",
        "tests/booking.spec.ts",
      ],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "live-stripe",
      testMatch: ["tests/stripe-checkout-live.spec.ts"],
      retries: 1,
      timeout: 60000,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "dashboards",
      testMatch: [
        "tests/villa-editor.spec.ts",
        "tests/responsive-dashboards.spec.ts",
        "tests/chatbot-scroll.spec.ts",
        "tests/chatbot-prebooking.spec.ts",
        "tests/hero-search.spec.ts",
        "tests/search.spec.ts",
        "tests/login.spec.ts",
        "tests/a11y.spec.ts",
      ],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
