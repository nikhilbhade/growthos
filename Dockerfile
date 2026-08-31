# Container image for the GradientOS web control plane (server.js).
#
# The control plane serves the dashboard UI and the /api/* surface. Provider
# microservices ship from services/Dockerfile and are deployed separately.
#
# Cloud Run injects PORT at runtime; server.js already honors process.env.PORT.

# ---- Stage 1: build the React/shadcn SPA (web/) into /app/public-dist ----
FROM node:22-alpine AS webbuild
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web ./
# vite outDir is ../public-dist, so this writes to /app/public-dist.
RUN npm run build

# ---- Stage 2: runtime image ----
FROM node:22-alpine
WORKDIR /app

# Install production dependencies first so this layer is cached across code
# changes. The control plane pulls in the LangChain/Supabase runtime deps;
# devDependencies are omitted from the image.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Application code. Only what server.js actually loads at runtime.
COPY server.js ./
COPY lib ./lib
COPY public ./public
# The built SPA (server.js prefers public-dist/ over the legacy public/).
COPY --from=webbuild /app/public-dist ./public-dist

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
