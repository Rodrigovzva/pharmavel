import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdministracionController } from './administracion.controller';
import { AdministracionService } from './administracion.service';
import { Usuario } from '../../entities/usuario.entity';
import { Rol } from '../../entities/rol.entity';
import { Permiso } from '../../entities/permiso.entity';
import { Auditoria } from '../../entities/auditoria.entity';
import { Parametro } from '../../entities/parametro.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Rol, Permiso, Auditoria, Parametro]),
  ],
  controllers: [AdministracionController],
  providers: [AdministracionService],
  exports: [AdministracionService],
})
export class AdministracionModule {}
