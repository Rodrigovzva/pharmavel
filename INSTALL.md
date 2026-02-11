# Guía de Instalación - Pharmavel

## Requisitos Previos

- Docker y Docker Compose instalados
- Acceso a la base de datos MySQL en `10.0.0.3:3306`
- Base de datos `pharmavelbd` creada (o se creará automáticamente si TypeORM tiene permisos)

## Instalación

### 1. Clonar o navegar al directorio del proyecto

```bash
cd /home/rvel/proyectos/pharmavel
```

### 2. Verificar configuración de base de datos

Asegúrese de que la base de datos MySQL esté accesible en `10.0.0.3:3306` y que las credenciales en `docker-compose.yml` sean correctas:

- Host: `10.0.0.3`
- Puerto: `3306`
- Base de datos: `pharmavelbd`
- Usuario: `root`
- Contraseña: `Rvel8080Ipv6**`

### 3. Construir e iniciar los contenedores

```bash
docker-compose up -d --build
```

### 4. Verificar que los servicios estén corriendo

```bash
docker-compose ps
```

Debería ver:
- `pharmavel-backend` corriendo en puerto 3100
- `pharmavel-frontend` corriendo en puerto 5173

### 5. Ver logs (opcional)

```bash
# Ver todos los logs
docker-compose logs -f

# Ver solo backend
docker-compose logs -f backend

# Ver solo frontend
docker-compose logs -f frontend
```

### 6. Acceder al sistema

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3100
- **Documentación API (Swagger)**: http://localhost:3100/api

### 7. Credenciales de acceso

**Usuario Administrador:**
- Usuario: `Rvel`
- Contraseña: `8080Ipv6**`

El usuario administrador se crea automáticamente al iniciar el backend mediante el script de seeds.

## Solución de Problemas

### El backend no se conecta a la base de datos

1. Verifique que la base de datos MySQL esté accesible desde el contenedor:
   ```bash
   docker exec -it pharmavel-backend ping 10.0.0.3
   ```

2. Verifique las credenciales en `docker-compose.yml`

3. Verifique que la base de datos `pharmavelbd` exista

### Los seeds no se ejecutan

Los seeds se ejecutan automáticamente al iniciar el backend. Si hay errores, revise los logs:

```bash
docker-compose logs backend | grep -i seed
```

Si los seeds fallan porque el usuario ya existe, es normal y puede ignorarse.

### El frontend no se conecta al backend

1. Verifique que `VITE_API_URL` en `docker-compose.yml` apunte al backend correcto
2. Verifique que ambos contenedores estén en la misma red Docker
3. Revise los logs del frontend para ver errores de conexión

## Comandos Útiles

```bash
# Detener los contenedores
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Reconstruir sin caché
docker-compose build --no-cache

# Reiniciar un servicio específico
docker-compose restart backend

# Ejecutar comandos dentro del contenedor
docker exec -it pharmavel-backend bash
docker exec -it pharmavel-frontend sh
```

## Desarrollo Local (sin Docker)

### Backend

```bash
cd backend
npm install
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Estructura del Proyecto

```
pharmavel/
├── backend/          # API NestJS
│   ├── src/
│   │   ├── entities/     # Entidades de base de datos
│   │   ├── modules/       # Módulos del sistema
│   │   ├── database/      # Migraciones y seeds
│   │   └── ...
│   └── Dockerfile
├── frontend/         # React + Vite
│   ├── src/
│   │   ├── pages/        # Páginas del sistema
│   │   ├── components/   # Componentes reutilizables
│   │   ├── services/     # Servicios API
│   │   └── ...
│   └── Dockerfile
└── docker-compose.yml
```

## Notas Importantes

- Los puertos configurados son: Backend (3100) y Frontend (5173)
- El sistema usa TypeORM con `synchronize: true` en desarrollo, lo que crea las tablas automáticamente
- En producción, se recomienda usar migraciones en lugar de `synchronize`
- Las contraseñas se almacenan con bcrypt (10 rounds)
- Los tokens JWT expiran en 1 hora (access) y 7 días (refresh)
