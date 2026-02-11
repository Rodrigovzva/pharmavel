import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, IsOptional, IsDate, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class IngresoDetalleDto {
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

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  fecha_vencimiento: Date;
}

export class CreateIngresoDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  proveedor_id: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  almacen_id: number;

  @ApiProperty({ required: false })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  fecha?: Date;

  @ApiProperty({ type: [IngresoDetalleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngresoDetalleDto)
  detalles: IngresoDetalleDto[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
