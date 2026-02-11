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
import { Cliente } from './cliente.entity';
import { Usuario } from './usuario.entity';
import { Almacen } from './almacen.entity';
import { VentaDetalle } from './venta-detalle.entity';
import { CuentaCobrar } from './cuenta-cobrar.entity';

@Entity('ventas')
export class Venta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  numero_factura: string;

  @Column({ type: 'date' })
  fecha: Date;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column()
  cliente_id: number;

  @ManyToOne(() => Almacen, { nullable: true })
  @JoinColumn({ name: 'almacen_id' })
  almacen: Almacen;

  @Column({ nullable: true })
  almacen_id: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column()
  usuario_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ length: 50, default: 'CONTADO' })
  tipo_pago: string;

  /** Fecha límite de pago para ventas a crédito (se usa en CuentaCobrar.fecha_vencimiento) */
  @Column({ type: 'date', nullable: true })
  fecha_limite_pago: Date;

  @Column({ length: 50, default: 'COMPLETADO' })
  estado: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @OneToMany(() => VentaDetalle, (detalle) => detalle.venta, { cascade: true })
  detalles: VentaDetalle[];

  @OneToMany(() => CuentaCobrar, (cuenta) => cuenta.venta)
  cuentas_cobrar: CuentaCobrar[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
