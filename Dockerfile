FROM node:24-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@11.20.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# Central Icons checks its licence on install (as in frantic). Deploy with:
#   fly deploy --build-secret CENTRAL_LICENSE_KEY="$CENTRAL_LICENSE_KEY"
RUN --mount=type=secret,id=CENTRAL_LICENSE_KEY \
    CENTRAL_LICENSE_KEY="$(cat /run/secrets/CENTRAL_LICENSE_KEY)" pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ponytail: static output served by Caddy (~90 MB image). Switch to @astrojs/node if pages need per-request rendering.
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 8080
