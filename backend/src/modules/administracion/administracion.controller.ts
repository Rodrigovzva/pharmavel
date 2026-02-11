import { Controller, Get, Post, Patch, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdministracionService } from './administracion.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateRolDto } from './dto/create-rol.dto';

@ApiTags('Administración')
@Controller('administracion')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdministracionController {
  constructor(private readonly administracionService: AdministracionService) {}

  @Get('usuarios')
  @ApiOperation({ summary: 'Listar usuarios' })
  findAllUsuarios() {
    return this.administracionService.findAllUsuarios();
  }

  @Get('roles')
  @ApiOperation({ summary: 'Listar roles' })
  findAllRoles() {
    return this.administracionService.findAllRoles();
  }

  @Post('roles')
  @ApiOperation({ summary: 'Crear rol' })
  createRol(@Body() createRolDto: CreateRolDto) {
    return this.administracionService.createRol(createRolDto);
  }

  @Get('permisos')
  @ApiOperation({ summary: 'Listar permisos' })
  findAllPermisos() {
    return this.administracionService.findAllPermisos();
  }

  @Get('auditoria')
  @ApiOperation({ summary: 'Consultar auditoría' })
  findAuditoria(@Query() filters: any) {
    return this.administracionService.findAuditoria(filters);
  }

  @Get('parametros')
  @ApiOperation({ summary: 'Listar parámetros del sistema' })
  findAllParametros() {
    return this.administracionService.findAllParametros();
  }

  @Patch('parametros/:id')
  @ApiOperation({ summary: 'Actualizar parámetro' })
  updateParametro(@Param('id') id: string, @Body('valor') valor: string) {
    return this.administracionService.updateParametro(+id, valor);
  }
}
