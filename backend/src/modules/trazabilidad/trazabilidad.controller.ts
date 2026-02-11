import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TrazabilidadService } from './trazabilidad.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Trazabilidad')
@Controller('trazabilidad')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TrazabilidadController {
  constructor(private readonly trazabilidadService: TrazabilidadService) {}

  @Get('producto/:id')
  @ApiOperation({ summary: 'Trazar producto por ID' })
  trazarProducto(@Param('id') id: string, @Query('lote') lote?: string) {
    return this.trazabilidadService.trazarProducto(+id, lote);
  }

  @Get('lote/:lote')
  @ApiOperation({ summary: 'Trazar lote específico' })
  trazarLote(@Param('lote') lote: string) {
    return this.trazabilidadService.trazarLote(lote);
  }
}
