import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Reportes')
@Controller('reportes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('ventas')
  @ApiOperation({ summary: 'Generar reporte de ventas' })
  async reporteVentas(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Query('formato') formato: 'pdf' | 'excel' = 'pdf',
    @Res() res: Response,
  ) {
    const buffer = await this.reportesService.generarReporteVentas(
      new Date(fechaInicio),
      new Date(fechaFin),
      formato,
    );

    res.setHeader(
      'Content-Type',
      formato === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=reporte-ventas.${formato === 'pdf' ? 'pdf' : 'xlsx'}`,
    );
    res.send(buffer);
  }

  @Get('stock-bajo')
  @ApiOperation({ summary: 'Generar reporte de stock bajo' })
  async reporteStockBajo(
    @Query('formato') formato: 'pdf' | 'excel' = 'pdf',
    @Res() res: Response,
  ) {
    const buffer = await this.reportesService.generarReporteStockBajo(formato);

    res.setHeader(
      'Content-Type',
      formato === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=stock-bajo.${formato === 'pdf' ? 'pdf' : 'xlsx'}`,
    );
    res.send(buffer);
  }

  @Get('kardex/:productoId')
  @ApiOperation({ summary: 'Generar kardex de producto' })
  async reporteKardex(
    @Param('productoId') productoId: string,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Query('formato') formato: 'pdf' | 'excel' = 'pdf',
    @Res() res: Response,
  ) {
    const buffer = await this.reportesService.generarReporteKardex(
      +productoId,
      new Date(fechaInicio),
      new Date(fechaFin),
      formato,
    );

    res.setHeader(
      'Content-Type',
      formato === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=kardex.${formato === 'pdf' ? 'pdf' : 'xlsx'}`,
    );
    res.send(buffer);
  }

  @Get('cuentas-vencidas')
  @ApiOperation({ summary: 'Generar reporte de cuentas vencidas' })
  async reporteCuentasVencidas(
    @Query('formato') formato: 'pdf' | 'excel' = 'pdf',
    @Res() res: Response,
  ) {
    const buffer = await this.reportesService.generarReporteCuentasVencidas(formato);

    res.setHeader(
      'Content-Type',
      formato === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=cuentas-vencidas.${formato === 'pdf' ? 'pdf' : 'xlsx'}`,
    );
    res.send(buffer);
  }
}
