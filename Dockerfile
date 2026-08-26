# Container image for the GrowthOS web control plane (server.js).
#
# The control plane serves the dashboard UI and the /api/* surface. Provider
# microservices ship from services/Dockerfile and are deployed separately.
#
# Cloud Run injects PORT at runtime; server.js already honors process.env.PORT.
FROM node:20-alpine

WORKDIR /app

# Install production dependencies first so this layer is cached across code
# changes. The control plane pulls in the LangChain/Supabase runtime deps;
# devDependencies (e.g. vercel) are omitted from the image.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Application code. Only what server.js actually loads at runtime.
COPY server.js ./
COPY lib ./lib
COPY public ./public

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
