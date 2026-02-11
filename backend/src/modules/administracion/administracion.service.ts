import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Usuario } from '../../entities/usuario.entity';
import { Rol } from '../../entities/rol.entity';
import { Permiso } from '../../entities/permiso.entity';
import { Auditoria } from '../../entities/auditoria.entity';
import { Parametro } from '../../entities/parametro.entity';
import { CreateRolDto } from './dto/create-rol.dto';

@Injectable()
export class AdministracionService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Rol)
    private rolRepository: Repository<Rol>,
    @InjectRepository(Permiso)
    private permisoRepository: Repository<Permiso>,
    @InjectRepository(Auditoria)
    private auditoriaRepository: Repository<Auditoria>,
    @InjectRepository(Parametro)
    private parametroRepository: Repository<Parametro>,
  ) {}

  // Usuarios
  async findAllUsuarios() {
    return this.usuarioRepository.find({
      relations: ['rol'],
      order: { nombre: 'ASC' },
    });
  }

  // Roles
  async findAllRoles() {
    return this.rolRepository.find({
      relations: ['permisos'],
      order: { nombre: 'ASC' },
    });
  }

  async createRol(dto: CreateRolDto): Promise<Rol> {
    const existente = await this.rolRepository.findOne({ where: { nombre: dto.nombre.trim() } });
    if (existente) {
      throw new BadRequestException(`Ya existe un rol con el nombre "${dto.nombre}"`);
    }
    const rol = this.rolRepository.create({
      nombre: dto.nombre.trim(),
      descripcion: dto.descripcion?.trim() || null,
      activo: dto.activo ?? true,
    });
    if (dto.permiso_ids?.length) {
      rol.permisos = await this.permisoRepository.find({
        where: { id: In(dto.permiso_ids) },
      });
    }
    return this.rolRepository.save(rol);
  }

  // Permisos
  async findAllPermisos() {
    return this.permisoRepository.find({
      order: { recurso: 'ASC', accion: 'ASC' },
    });
  }

  // Auditoría
  async findAuditoria(filters?: any) {
    const query = this.auditoriaRepository.createQueryBuilder('auditoria')
      .leftJoinAndSelect('auditoria.usuario', 'usuario')
      .orderBy('auditoria.created_at', 'DESC')
      .limit(1000);

    if (filters?.usuario_id) {
      query.where('auditoria.usuario_id = :usuario_id', { usuario_id: filters.usuario_id });
    }

    if (filters?.modulo) {
      query.andWhere('auditoria.modulo = :modulo', { modulo: filters.modulo });
    }

    return query.getMany();
  }

  // Parámetros
  async findAllParametros() {
    return this.parametroRepository.find({
      order: { clave: 'ASC' },
    });
  }

  async updateParametro(id: number, valor: string) {
    const parametro = await this.parametroRepository.findOne({ where: { id } });
    if (parametro) {
      parametro.valor = valor;
      return this.parametroRepository.save(parametro);
    }
    return null;
  }
}
