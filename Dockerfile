# Container build for Glama hosted deployment of the Merka2a MCP server.
# The server speaks stdio; Glama wraps the stdio transport automatically.
FROM node:20-alpine AS build
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
# Starts immediately and lists tools with no network access (lazy auth);
# the Merka2a API is only contacted on the first tool call.
CMD ["node", "dist/cli.js"]
