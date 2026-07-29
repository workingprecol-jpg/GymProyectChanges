# syntax=docker/dockerfile:1

##########################################################################
# gymassist.online web tier - two Vite builds served by one Nginx.
#
#   landing/    ->  /        public marketing site + legal pages
#   frontend/   ->  /app/    the gym dashboard (login, members, finance...)
#
# They are deliberately kept as two builds: the landing is Tailwind 4 /
# React 19 / Vite 8 and the dashboard is Tailwind 3 / React 18 / Vite 6, and
# two Tailwind majors cannot share one build.
#
# NOTE: the build context is the REPO ROOT, not ./frontend as before, because
# this image needs both directories. In Coolify the "Front-end Server" app's
# Base Directory must therefore be "/" (it was "/frontend").
##########################################################################

########################################
# 1) Landing page  ->  /
########################################
# Node 22: Vite 8 requires a newer Node than the dashboard's Vite 6 does.
FROM node:22-alpine AS landing-build
WORKDIR /landing

COPY landing/package.json landing/package-lock.json ./
RUN npm ci

COPY landing/ ./
RUN npm run build

########################################
# 2) Dashboard  ->  /app/
########################################
FROM node:20-alpine AS dashboard-build
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./

# Vite bakes import.meta.env.VITE_* in at build time, not runtime, so this has
# to be a build arg and must be marked "Available at Buildtime" in Coolify.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

########################################
# 3) Runtime
########################################
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=landing-build   /landing/dist  /usr/share/nginx/html
COPY --from=dashboard-build /app/dist      /usr/share/nginx/html/app

EXPOSE 80
