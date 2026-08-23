FROM node:20-alpine

WORKDIR /app
COPY services ./services

ENV NODE_ENV=production
CMD ["node", "services/service.js"]
