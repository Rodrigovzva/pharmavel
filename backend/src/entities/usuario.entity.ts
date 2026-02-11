import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Rol } from './rol.entity';
import { Auditoria } from './auditoria.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  username: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 100 })
  apellido: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ nullable: true })
  ultimo_acceso: Date;

  @Column({ nullable: true })
  refresh_token: string;

  @ManyToOne(() => Rol)
  @JoinColumn({ name: 'rol_id' })
  rol: Rol;

  @Column()
  rol_id: number;

  @OneToMany(() => Auditoria, (auditoria) => auditoria.usuario)
  auditorias: Auditoria[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
