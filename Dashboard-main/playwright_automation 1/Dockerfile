# Minimal Dockerfile for FNP Automation Framework
FROM node:20-bookworm-slim

# Install Chromium dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 \
    libpango-1.0-0 libcairo2 libasound2 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Install dependencies
COPY package*.json ./
RUN npm ci --ignore-scripts && npm cache clean --force

# Install Playwright Chromium
RUN npx playwright install chromium --with-deps

# Copy application code only (no test artifacts)
COPY src/ ./src/
COPY cucumber.config.js run-tests.js ./

# NO directories created - all will be volume-mounted from Jenkins
# This ensures NO data persists in the Docker image

# Set environment
ENV HEADLESS=true CI=true

# Run tests
CMD ["node", "--expose-gc", "--max-old-space-size=2048", "run-tests.js"]
