FROM node:22-slim

WORKDIR /app

# Copy ONLY package.json (NOT package-lock.json)
# The lockfile was generated on Windows and locks in Windows-specific native
# binaries (Turbopack, LightningCSS .node files). On Linux we need fresh resolution.
COPY package.json ./

# Fresh install — npm resolves correct Linux x64 native binaries
RUN npm install

# Copy source code
COPY . .

# Remove any Windows node_modules that might have been copied
RUN rm -rf node_modules/.cache

# Environment settings for build
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm run build

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", ".next/standalone/server.js"]
