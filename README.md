# Pharmavel - Sistema de Distribución de Insumos Médicos

Sistema completo para la gestión y distribución de insumos médicos con trazabilidad completa.

## 🚀 Inicio Rápido

### Requisitos Previos
- Docker y Docker Compose instalados
- Acceso a la base de datos MySQL en `10.0.0.3:3306`

### Instalación y Ejecución

```bash
# Clonar o navegar al directorio del proyecto
cd /home/rvel/proyectos/pharmavel

# Construir e iniciar los contenedores
docker-compose up -d --build

# Ver logs
docker-compose logs -f
```

### Acceso al Sistema

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3100
- **Documentación API**: http://localhost:3100/api

### Credenciales de Acceso

**Usuario Administrador:**
- Usuario: `Rvel`
- Contraseña: `8080Ipv6**`

## 📋 Características

- ✅ Autenticación JWT segura (access + refresh tokens)
- ✅ Control de acceso basado en roles (RBAC)
- ✅ Trazabilidad completa de productos
- ✅ Gestión de clientes, productos y almacenes
- ✅ Sistema de ventas y cuentas por cobrar
- ✅ Reportes en PDF y Excel
- ✅ Interfaz responsive (mobile-first)
- ✅ Auditoría de accesos y acciones

## 🏗️ Arquitectura

```
pharmavel/
├── backend/          # API NestJS
├── frontend/         # React + Vite
├── docker/           # Configuraciones Docker
└── docker-compose.yml
```

## 🔧 Configuración

Las variables de entorno se configuran en `docker-compose.yml`:

- `DB_HOST`: Host de la base de datos (10.0.0.3)
- `DB_PORT`: Puerto MySQL (3306)
- `DB_DATABASE`: Nombre de la base (pharmavelbd)
- `DB_USERNAME`: Usuario de BD
- `DB_PASSWORD`: Contraseña de BD

## 📦 Módulos del Sistema

1. **Clientes** - Gestión de clientes
2. **Productos** - Catálogo de productos médicos
3. **Almacenes** - Gestión de almacenes
4. **Ventas** - Proceso de ventas
5. **Cuentas por Cobrar** - Gestión de créditos
6. **Administración** - Usuarios, roles, auditoría
7. **Trazabilidad** - Seguimiento completo de productos

## 📊 Reportes Disponibles

- Ventas
- Stock bajo
- Kardex
- Cuentas por cobrar
- Cuentas vencidas
- Ranking de productos
- Movimientos de inventario
- Trazabilidad
- Compras vs ventas
- Utilidad por producto

## 🔒 Seguridad

- Contraseñas cifradas con bcrypt
- Protección contra fuerza bruta
- Protección CSRF
- Protección XSS
- Validación de entrada contra inyecciones SQL
- Control de sesiones seguro
- Auditoría de accesos

## 📱 Responsive Design

El sistema está optimizado para:
- 📱 Móviles (mobile-first)
- 📱 Tablets
- 💻 Desktop

## 🛠️ Desarrollo

### Backend (NestJS)
```bash
cd backend
npm install
npm run start:dev
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

## 📝 Licencia

Propietario - Pharmavel
