import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCuentaCobrarDto {
  @ApiProperty()
  @IsNumber()
  cliente_id: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  venta_id?: number;

  @ApiProperty()
  @IsString()
  numero_documento: string;

  @ApiProperty()
  @IsNumber()
  monto_total: number;

  @ApiProperty({ required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  monto_pagado?: number;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  fecha_emision: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  fecha_vencimiento: Date;

  @ApiProperty({ required: false, default: 'PENDIENTE' })
  @IsString()
  @IsOptional()
  estado?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
