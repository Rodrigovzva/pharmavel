#!/bin/bash

echo "🚀 Iniciando Pharmavel Backend..."

# Esperar a que la base de datos esté lista
echo "⏳ Esperando conexión a la base de datos..."
sleep 5

# Ejecutar seeds
echo "🌱 Ejecutando seeds de base de datos..."
npm run seed:run || echo "⚠️  Error ejecutando seeds (puede que ya existan)"

# Iniciar la aplicación
echo "▶️  Iniciando aplicación..."
npm run start:prod
