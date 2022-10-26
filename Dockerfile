FROM node:10 as builder
ENV NODE_ENV=production
RUN mkdir -p /app
WORKDIR /app
ADD package.json /app/
ADD package-lock.json /app/
RUN npm install
ADD . /app

FROM node:10
ENV NODE_ENV=production
RUN mkdir -p /app
WORKDIR /app
COPY --from=builder /app .
ARG PORT=80
ENV PORT $PORT
EXPOSE $PORT
CMD ["npm", "start"]