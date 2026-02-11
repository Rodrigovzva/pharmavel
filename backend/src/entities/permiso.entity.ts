import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Rol } from './rol.entity';

@Entity('permisos')
export class Permiso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  nombre: string;

  @Column({ length: 100 })
  recurso: string;

  @Column({ length: 50 })
  accion: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @ManyToMany(() => Rol, (rol) => rol.permisos)
  roles: Rol[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
