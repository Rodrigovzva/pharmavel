# Debug de Login - Pharmavel

## Pasos para diagnosticar el problema de login

1. **Abre la consola del navegador** (F12 o clic derecho > Inspeccionar > Consola)

2. **Intenta hacer login** y revisa los mensajes en la consola. Deberías ver:
   - "API URL configurada: http://10.0.0.3:3100"
   - "Intentando login con: Rvel"
   - Cualquier error que ocurra

3. **Revisa la pestaña Network** en las herramientas de desarrollador:
   - Busca la petición a `/auth/login`
   - Verifica la URL completa de la petición
   - Revisa el código de estado HTTP
   - Revisa la respuesta del servidor

4. **Verifica la configuración**:
   - La URL del frontend debe ser: `http://10.0.0.3:5173`
   - La URL de la API debe ser: `http://10.0.0.3:3100`

## Prueba directa del backend

Ejecuta este comando para verificar que el backend funciona:

```bash
curl -X POST http://10.0.0.3:3100/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://10.0.0.3:5173" \
  -d '{"username":"Rvel","password":"8080Ipv6**"}'
```

Deberías recibir un JSON con `access_token` y `refresh_token`.

## Posibles problemas y soluciones

### Error de CORS
Si ves un error de CORS en la consola:
- El backend ya está configurado para aceptar peticiones desde `http://10.0.0.3:5173`
- Verifica que el backend esté corriendo: `docker compose ps`

### Error 401 Unauthorized
- Verifica que las credenciales sean exactamente: `Rvel` y `8080Ipv6**`
- Verifica que el usuario exista en la base de datos ejecutando los seeds:
  ```bash
  docker compose exec backend npm run seed:run
  ```

### Error de conexión
- Verifica que ambos contenedores estén corriendo: `docker compose ps`
- Verifica que los puertos estén abiertos: `netstat -tuln | grep -E "3100|5173"`

### La URL de la API es incorrecta
- Verifica la variable de entorno: `docker exec pharmavel-frontend printenv | grep VITE`
- Debería mostrar: `VITE_API_URL=http://10.0.0.3:3100`
- Si no es así, reinicia el frontend: `docker compose restart frontend`
