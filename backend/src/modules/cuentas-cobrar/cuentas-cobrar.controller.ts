import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CuentasCobrarService } from './cuentas-cobrar.service';
import { CreateCuentaCobrarDto } from './dto/create-cuenta-cobrar.dto';
import { UpdateCuentaCobrarDto } from './dto/update-cuenta-cobrar.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Cuentas por Cobrar')
@Controller('cuentas-cobrar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CuentasCobrarController {
  constructor(private readonly cuentasCobrarService: CuentasCobrarService) {}

  @Post()
  @ApiOperation({ summary: 'Crear cuenta por cobrar' })
  create(@Body() createDto: CreateCuentaCobrarDto) {
    return this.cuentasCobrarService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las cuentas por cobrar' })
  findAll() {
    return this.cuentasCobrarService.findAll();
  }

  @Get('vencidas')
  @ApiOperation({ summary: 'Listar cuentas vencidas' })
  findVencidas() {
    return this.cuentasCobrarService.findVencidas();
  }

  @Get('por-vencer')
  @ApiOperation({ summary: 'Listar cuentas por vencer en los próximos N días' })
  findPorVencer(@Query('dias') dias?: string) {
    const n = dias != null && dias !== '' ? parseInt(dias, 10) : 7;
    return this.cuentasCobrarService.findPorVencer(Number.isNaN(n) ? 7 : Math.min(365, Math.max(1, n)));
  }

  @Post('sincronizar')
  @ApiOperation({ summary: 'Crear cuentas por cobrar para ventas a crédito que no tienen' })
  sincronizar() {
    return this.cuentasCobrarService.sincronizarDesdeVentas();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cuenta por cobrar por ID' })
  findOne(@Param('id') id: string) {
    return this.cuentasCobrarService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cuenta por cobrar' })
  update(@Param('id') id: string, @Body() updateDto: UpdateCuentaCobrarDto) {
    return this.cuentasCobrarService.update(+id, updateDto);
  }

  @Post(':id/pago')
  @ApiOperation({ summary: 'Registrar pago' })
  registrarPago(@Param('id') id: string, @Body('monto') monto: number | string) {
    const montoNum = typeof monto === 'string' ? parseFloat(monto) : Number(monto);
    if (Number.isNaN(montoNum) || montoNum <= 0) {
      throw new BadRequestException('El monto debe ser un número mayor a 0');
    }
    return this.cuentasCobrarService.registrarPago(+id, montoNum);
  }
}
