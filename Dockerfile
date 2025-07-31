# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies with production flags
RUN pnpm install --frozen-lockfile --production=false

# Copy the rest of the application
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_LINT=true
ENV NEXT_DISABLE_ESLINT=1
ENV NEXT_DISABLE_TYPE_CHECKS=1

# Build the application
RUN pnpm build

# Expose the port
EXPOSE 3000

# Set environment for runtime
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Start the application
CMD ["pnpm", "start"]