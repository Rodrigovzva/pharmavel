import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventarioService } from './inventario.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Inventario')
@Controller('inventario')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Get()
  @ApiOperation({ summary: 'Stock por producto y almacén' })
  getStockPorAlmacen(@Query('almacen_id') almacenId?: string) {
    const parsed = almacenId != null && almacenId !== '' ? parseInt(almacenId, 10) : NaN;
    const id = Number.isFinite(parsed) ? parsed : undefined;
    return this.inventarioService.getStockPorAlmacen(id);
  }

  @Get('por-lote')
  @ApiOperation({ summary: 'Stock por lote con fecha de vencimiento' })
  getStockPorLote(@Query('almacen_id') almacenId?: string) {
    const parsed = almacenId != null && almacenId !== '' ? parseInt(almacenId, 10) : NaN;
    const id = Number.isFinite(parsed) ? parsed : undefined;
    return this.inventarioService.getStockPorLote(id);
  }
}
