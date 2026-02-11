import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VentasService } from './ventas.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Ventas')
@Controller('ventas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear venta' })
  async create(@Body() createVentaDto: CreateVentaDto, @Request() req: any) {
    const userId = req.user?.id;
    if (userId == null) {
      throw new BadRequestException('Usuario no autenticado');
    }
    try {
      return await this.ventasService.create(createVentaDto, userId);
    } catch (err: any) {
      const msg = err?.message || err?.response?.message || String(err);
      throw new BadRequestException(msg);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las ventas' })
  findAll() {
    return this.ventasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener venta por ID' })
  findOne(@Param('id') id: string) {
    return this.ventasService.findOne(+id);
  }

  @Patch(':id/anular')
  @ApiOperation({ summary: 'Anular venta' })
  anular(@Param('id') id: string, @Request() req: any) {
    return this.ventasService.anular(+id, req.user.id);
  }
}
