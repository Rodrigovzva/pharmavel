import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AlmacenesService } from './almacenes.service';
import { CreateAlmacenDto } from './dto/create-almacen.dto';
import { UpdateAlmacenDto } from './dto/update-almacen.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Almacenes')
@Controller('almacenes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlmacenesController {
  constructor(private readonly almacenesService: AlmacenesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear almacén' })
  create(@Body() createAlmacenDto: CreateAlmacenDto) {
    return this.almacenesService.create(createAlmacenDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los almacenes' })
  findAll() {
    return this.almacenesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener almacén por ID' })
  findOne(@Param('id') id: string) {
    return this.almacenesService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar almacén' })
  update(@Param('id') id: string, @Body() updateAlmacenDto: UpdateAlmacenDto) {
    return this.almacenesService.update(+id, updateAlmacenDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar almacén (soft delete)' })
  remove(@Param('id') id: string) {
    return this.almacenesService.remove(+id);
  }
}
