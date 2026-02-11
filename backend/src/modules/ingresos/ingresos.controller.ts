import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IngresosService } from './ingresos.service';
import { CreateIngresoDto } from './dto/create-ingreso.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Ingresos')
@Controller('ingresos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IngresosController {
  constructor(private readonly service: IngresosService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar ingreso de productos a almacén' })
  async create(@Body() dto: CreateIngresoDto, @Request() req: any) {
    const userId = req.user?.id;
    if (userId == null) throw new Error('Usuario no autenticado');
    return this.service.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ingresos' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener ingreso por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }
}
