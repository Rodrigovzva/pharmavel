import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Almacen } from '../../entities/almacen.entity';
import { CreateAlmacenDto } from './dto/create-almacen.dto';
import { UpdateAlmacenDto } from './dto/update-almacen.dto';

@Injectable()
export class AlmacenesService {
  constructor(
    @InjectRepository(Almacen)
    private almacenRepository: Repository<Almacen>,
  ) {}

  async create(createAlmacenDto: CreateAlmacenDto): Promise<Almacen> {
    const almacen = this.almacenRepository.create(createAlmacenDto);
    return this.almacenRepository.save(almacen);
  }

  async findAll(): Promise<Almacen[]> {
    return this.almacenRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Almacen> {
    const almacen = await this.almacenRepository.findOne({ where: { id } });
    if (!almacen) {
      throw new NotFoundException(`Almacén con ID ${id} no encontrado`);
    }
    return almacen;
  }

  async update(id: number, updateAlmacenDto: UpdateAlmacenDto): Promise<Almacen> {
    const almacen = await this.findOne(id);
    Object.assign(almacen, updateAlmacenDto);
    return this.almacenRepository.save(almacen);
  }

  async remove(id: number): Promise<void> {
    const almacen = await this.findOne(id);
    almacen.activo = false;
    await this.almacenRepository.save(almacen);
  }
}
