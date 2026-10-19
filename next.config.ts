import type { NextConfig } from "next";

const config: NextConfig = {
  outputFileTracingIncludes: {
    "/api/**": ["./fixtures/**"],
    "/[lang]/app": ["./fixtures/**"],
  },
};

export default config;
