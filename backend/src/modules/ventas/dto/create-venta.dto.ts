import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, IsOptional, IsDate, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class VentaDetalleDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  producto_id: number;

  @ApiProperty()
  @IsString()
  lote: string;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  cantidad: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  precio_unitario: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  descuento?: number;
}

export class CreateVentaDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  cliente_id: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  almacen_id: number;

  @ApiProperty({ required: false })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  fecha?: Date;

  @ApiProperty({ type: [VentaDetalleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VentaDetalleDto)
  detalles: VentaDetalleDto[];

  @ApiProperty({ required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  descuento?: number;

  @ApiProperty({ required: false, default: 'CONTADO' })
  @IsString()
  @IsOptional()
  tipo_pago?: string;

  /** Fecha límite de pago (solo para ventas a crédito). Formato YYYY-MM-DD. Si no se envía, se usa fecha + 30 días. */
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fecha_limite_pago?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
