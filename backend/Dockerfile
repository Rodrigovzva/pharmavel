FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (incluyendo dev para build)
RUN npm install

# Copiar código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Verificar que dist existe
RUN ls -la dist/ || echo "Dist no existe"

# Mantener ts-node para ejecutar seeds
RUN npm install -g ts-node typescript

# Exponer puerto
EXPOSE 3000

# Comando para iniciar - usar start:prod que busca dist/main
CMD npm run start:prod
