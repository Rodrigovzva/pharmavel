import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { inventarioService, StockPorLote } from '../services/inventarioService';
import { almacenesService } from '../services/almacenesService';

const DIAS_POR_VENCER = 60;

function esPorVencer(fechaVenc: string | undefined): boolean {
  if (!fechaVenc) return false;
  const f = new Date(fechaVenc);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(hoy);
  limite.setDate(limite.getDate() + DIAS_POR_VENCER);
  return f >= hoy && f <= limite;
}

function yaVencido(fechaVenc: string | undefined): boolean {
  if (!fechaVenc) return false;
  const f = new Date(fechaVenc);
  f.setHours(0, 0, 0, 0);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return f < hoy;
}

export default function InventarioPage() {
  const [almacenId, setAlmacenId] = useState<number | ''>('');

  const { data: almacenes = [] } = useQuery({
    queryKey: ['almacenes'],
    queryFn: almacenesService.getAll,
  });

  const filtroAlmacenId = almacenId === '' ? undefined : Number(almacenId);
  const { data: stockPorLote = [], isLoading } = useQuery({
    queryKey: ['inventario-por-lote', filtroAlmacenId],
    queryFn: () => inventarioService.getStockPorLote(filtroAlmacenId),
  });

  const codigoDisplay = (codigo: string) =>
    /^\d+$/.test(String(codigo)) ? String(parseInt(String(codigo), 10)) : codigo;

  const formatearFecha = (f: string) =>
    f ? new Date(f).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Inventario por lote</Typography>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Filtrar por almacén</InputLabel>
          <Select
            label="Filtrar por almacén"
            value={almacenId}
            onChange={(e) => setAlmacenId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <MenuItem value="">
              <em>Todos los almacenes</em>
            </MenuItem>
            {almacenes.map((a: { id: number; nombre: string }) => (
              <MenuItem key={a.id} value={a.id}>
                {a.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Ordenado por fecha de vencimiento (los que vencen antes aparecen primero). Los lotes por vencer en {DIAS_POR_VENCER} días se marcan en amarillo; los vencidos en rojo.
      </Typography>

      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 280px)', overflowX: 'auto', '& .MuiTableCell-root': { py: 0.5 } }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Almacén</TableCell>
              <TableCell>Código</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell>Lote</TableCell>
              <TableCell align="right">Cantidad</TableCell>
              <TableCell>F. vencimiento</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : stockPorLote.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Box sx={{ maxWidth: 420, mx: 'auto' }}>
                    <Typography color="text.secondary" gutterBottom>
                      {filtroAlmacenId != null
                        ? 'No hay lotes con stock en el almacén seleccionado.'
                        : 'No hay inventario por lote con stock disponible.'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Los lotes aparecen cuando registra <strong>Ingresos</strong> (menú Ingresos) con lote y fecha de vencimiento. Si ya registró ingresos, pruebe con &quot;Todos los almacenes&quot; o confirme que el ingreso fue al almacén que eligió.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              stockPorLote.map((row: StockPorLote, index: number) => {
                const porVencer = esPorVencer(row.fecha_vencimiento);
                const vencido = yaVencido(row.fecha_vencimiento);
                return (
                  <TableRow
                    key={`${row.almacen_id}-${row.producto_id}-${row.lote}-${index}`}
                    sx={{
                      ...(porVencer && { bgcolor: 'warning.light' }),
                      ...(vencido && { bgcolor: 'error.light' }),
                    }}
                  >
                    <TableCell>{row.almacen_nombre}</TableCell>
                    <TableCell>{codigoDisplay(row.producto_codigo)}</TableCell>
                    <TableCell>{row.producto_nombre}</TableCell>
                    <TableCell>{row.lote || '-'}</TableCell>
                    <TableCell align="right">{row.cantidad}</TableCell>
                    <TableCell>{formatearFecha(row.fecha_vencimiento)}</TableCell>
                    <TableCell>
                      {vencido && (
                        <Chip label="Vencido" color="error" size="small" />
                      )}
                      {!vencido && porVencer && (
                        <Chip label="Por vencer" color="warning" size="small" />
                      )}
                      {!vencido && !porVencer && row.fecha_vencimiento && (
                        <Chip label="Vigente" color="success" size="small" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
