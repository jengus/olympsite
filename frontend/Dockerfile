FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install --force && npm cache clean --force
#RUN npm install
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
COPY . .

RUN chmod -R 755 /app
# Устанавливаем флаг CI на false для игнорирования предупреждений ESLint
RUN CI=false npm run build && echo "Build completed successfully" || echo "Bu>
RUN ls -la /app/build

# Устанавливаем serve для обслуживания статики
RUN npm install -g serve

# Устанавливаем команду для запуска serve
CMD ["npx", "serve", "-s", "build"]
#CMD ["npm", "start"]
