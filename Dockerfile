FROM node:12

RUN mkdir -p /warfish-bot
COPY index.js package.json yarn.lock lib /warfish-slack/
RUN yarn --cwd /warfish-bot

EXPOSE 80

CMD node /warfish-bot
