import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proveedor } from '../../entities/proveedor.entity';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(Proveedor)
    private proveedorRepository: Repository<Proveedor>,
  ) {}

  async create(dto: CreateProveedorDto): Promise<Proveedor> {
    const proveedor = this.proveedorRepository.create(dto);
    return this.proveedorRepository.save(proveedor);
  }

  async findAll(): Promise<Proveedor[]> {
    return this.proveedorRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Proveedor> {
    const p = await this.proveedorRepository.findOne({ where: { id } });
    if (!p) throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
    return p;
  }

  async update(id: number, dto: UpdateProveedorDto): Promise<Proveedor> {
    const p = await this.findOne(id);
    Object.assign(p, dto);
    return this.proveedorRepository.save(p);
  }

  async remove(id: number): Promise<void> {
    const p = await this.findOne(id);
    p.activo = false;
    await this.proveedorRepository.save(p);
  }
}
