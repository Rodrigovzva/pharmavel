import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('parametros')
export class Parametro {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  clave: string;

  @Column({ type: 'text' })
  valor: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ length: 50, default: 'TEXTO' })
  tipo: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
