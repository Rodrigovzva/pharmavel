import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Proveedor } from './proveedor.entity';
import { Almacen } from './almacen.entity';
import { Usuario } from './usuario.entity';
import { IngresoDetalle } from './ingreso-detalle.entity';

@Entity('ingresos')
export class Ingreso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  numero_documento: string;

  @Column({ type: 'date' })
  fecha: Date;

  @ManyToOne(() => Proveedor)
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Proveedor;

  @Column()
  proveedor_id: number;

  @ManyToOne(() => Almacen)
  @JoinColumn({ name: 'almacen_id' })
  almacen: Almacen;

  @Column()
  almacen_id: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column()
  usuario_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ length: 50, default: 'COMPLETADO' })
  estado: string;

  @OneToMany(() => IngresoDetalle, (detalle) => detalle.ingreso, { cascade: true })
  detalles: IngresoDetalle[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
