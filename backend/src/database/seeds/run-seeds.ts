import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../entities/usuario.entity';
import { Rol } from '../../entities/rol.entity';
import { Permiso } from '../../entities/permiso.entity';
import { Parametro } from '../../entities/parametro.entity';

config();

async function runSeeds() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || '10.0.0.3',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'Rvel8080Ipv6**',
    database: process.env.DB_DATABASE || 'pharmavelbd',
    entities: [__dirname + '/../../entities/**/*.entity{.ts,.js}'],
    synchronize: false,
    logging: true,
  });

  await dataSource.initialize();

  console.log('🌱 Ejecutando seeds...');

  // Crear permisos
  const permisoRepo = dataSource.getRepository(Permiso);
  const permisos = [
    { nombre: 'clientes.ver', recurso: 'clientes', accion: 'ver', descripcion: 'Ver clientes' },
    { nombre: 'clientes.crear', recurso: 'clientes', accion: 'crear', descripcion: 'Crear clientes' },
    { nombre: 'clientes.editar', recurso: 'clientes', accion: 'editar', descripcion: 'Editar clientes' },
    { nombre: 'clientes.eliminar', recurso: 'clientes', accion: 'eliminar', descripcion: 'Eliminar clientes' },
    { nombre: 'productos.ver', recurso: 'productos', accion: 'ver', descripcion: 'Ver productos' },
    { nombre: 'productos.crear', recurso: 'productos', accion: 'crear', descripcion: 'Crear productos' },
    { nombre: 'productos.editar', recurso: 'productos', accion: 'editar', descripcion: 'Editar productos' },
    { nombre: 'productos.eliminar', recurso: 'productos', accion: 'eliminar', descripcion: 'Eliminar productos' },
    { nombre: 'ventas.ver', recurso: 'ventas', accion: 'ver', descripcion: 'Ver ventas' },
    { nombre: 'ventas.crear', recurso: 'ventas', accion: 'crear', descripcion: 'Crear ventas' },
    { nombre: 'ventas.anular', recurso: 'ventas', accion: 'anular', descripcion: 'Anular ventas' },
    { nombre: 'reportes.ver', recurso: 'reportes', accion: 'ver', descripcion: 'Ver reportes' },
    { nombre: 'administracion.ver', recurso: 'administracion', accion: 'ver', descripcion: 'Ver administración' },
  ];

  for (const permisoData of permisos) {
    let permiso = await permisoRepo.findOne({ where: { nombre: permisoData.nombre } });
    if (!permiso) {
      permiso = permisoRepo.create(permisoData);
      await permisoRepo.save(permiso);
      console.log(`✅ Permiso creado: ${permisoData.nombre}`);
    }
  }

  // Crear rol Administrador
  const rolRepo = dataSource.getRepository(Rol);
  let adminRol = await rolRepo.findOne({ where: { nombre: 'Administrador' } });
  if (!adminRol) {
    adminRol = rolRepo.create({
      nombre: 'Administrador',
      descripcion: 'Rol con todos los permisos del sistema',
      activo: true,
    });
    adminRol = await rolRepo.save(adminRol);
    console.log('✅ Rol Administrador creado');

    // Asignar todos los permisos al rol administrador
    const todosPermisos = await permisoRepo.find();
    adminRol.permisos = todosPermisos;
    await rolRepo.save(adminRol);
    console.log('✅ Permisos asignados al rol Administrador');
  }

  // Crear usuario administrador
  const usuarioRepo = dataSource.getRepository(Usuario);
  let adminUser = await usuarioRepo.findOne({ where: { username: 'Rvel' } });
  if (!adminUser) {
    const hashedPassword = await bcrypt.hash('8080Ipv6**', 10);
    adminUser = usuarioRepo.create({
      username: 'Rvel',
      password: hashedPassword,
      nombre: 'Administrador',
      apellido: 'Sistema',
      email: 'admin@pharmavel.com',
      activo: true,
      rol_id: adminRol.id,
    });
    await usuarioRepo.save(adminUser);
    console.log('✅ Usuario administrador creado: Rvel / 8080Ipv6**');
  } else {
    // Actualizar contraseña si existe
    const hashedPassword = await bcrypt.hash('8080Ipv6**', 10);
    adminUser.password = hashedPassword;
    adminUser.rol_id = adminRol.id;
    await usuarioRepo.save(adminUser);
    console.log('✅ Usuario administrador actualizado');
  }

  // Crear parámetros del sistema
  const parametroRepo = dataSource.getRepository(Parametro);
  const parametros = [
    { clave: 'EMPRESA_NOMBRE', valor: 'Pharmavel', descripcion: 'Nombre de la empresa', tipo: 'TEXTO' },
    { clave: 'EMPRESA_NIT', valor: '', descripcion: 'NIT de la empresa', tipo: 'TEXTO' },
    { clave: 'EMPRESA_DIRECCION', valor: '', descripcion: 'Dirección de la empresa', tipo: 'TEXTO' },
    { clave: 'EMPRESA_TELEFONO', valor: '', descripcion: 'Teléfono de la empresa', tipo: 'TEXTO' },
    { clave: 'IVA_PORCENTAJE', valor: '13', descripcion: 'Porcentaje de IVA', tipo: 'NUMERO' },
  ];

  for (const paramData of parametros) {
    let param = await parametroRepo.findOne({ where: { clave: paramData.clave } });
    if (!param) {
      param = parametroRepo.create(paramData);
      await parametroRepo.save(param);
      console.log(`✅ Parámetro creado: ${paramData.clave}`);
    }
  }

  await dataSource.destroy();
  console.log('✅ Seeds completados exitosamente');
}

runSeeds().catch((error) => {
  console.error('❌ Error ejecutando seeds:', error);
  process.exit(1);
});
