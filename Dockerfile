# Multi-stage build for optimal production performance and small container size
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency configuration manifests
COPY package.json package-lock.json* ./

# Install all dev and prod dependencies for build
RUN npm install

# Copy source code assets
COPY . .

# Build the client SPA bundles and compile the Express server entry point
RUN npm run build

# --- Runner Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

# Set variables for production environment
ENV NODE_ENV=production
# Hugging Face Spaces defaults to port 7860
ENV PORT=7860

# Copy package config for production dependencies
COPY package.json package-lock.json* ./

# Check package-lock.json to install only essential dependencies and minimize build footprint
RUN npm install --only=production

# Copy built artifacts from the compiler builder
COPY --from=builder /app/dist ./dist

# Expose target socket port for ingress routing
EXPOSE 7860

# CMD starts the compiled CommonJS bundle
CMD ["node", "dist/server.cjs"]
