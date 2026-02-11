import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { trazabilidadService, TrazabilidadProducto, TrazabilidadLote } from '../services/trazabilidadService';
import { formatCurrency } from '../utils/currency';

export default function TrazabilidadPage() {
  const [productoId, setProductoId] = useState('');
  const [lote, setLote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultadoProducto, setResultadoProducto] = useState<TrazabilidadProducto | null>(null);
  const [resultadoLote, setResultadoLote] = useState<TrazabilidadLote | null>(null);

  const handleBuscar = async () => {
    const id = productoId.trim();
    const l = lote.trim();
    if (!id && !l) {
      setError('Ingrese ID de producto o lote');
      return;
    }
    setError(null);
    setResultadoProducto(null);
    setResultadoLote(null);
    setLoading(true);
    try {
      if (id) {
        const numId = Number(id);
        if (Number.isNaN(numId)) {
          setError('ID de producto debe ser un número');
          return;
        }
        const data = await trazabilidadService.trazarProducto(numId, l || undefined);
        setResultadoProducto(data ?? null);
        if (!data) setError('Producto no encontrado');
      } else {
        const data = await trazabilidadService.trazarLote(l);
        setResultadoLote(data);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Error al buscar');
    } finally {
      setLoading(false);
    }
  };

  const mostrarPorProducto = resultadoProducto != null;
  const mostrarPorLote = resultadoLote != null && !mostrarPorProducto;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Trazabilidad
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="ID de Producto"
            value={productoId}
            onChange={(e) => setProductoId(e.target.value)}
            type="number"
            size="small"
            placeholder="Ej: 1"
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Lote"
            value={lote}
            onChange={(e) => setLote(e.target.value)}
            size="small"
            placeholder="Ej: LOTE-1"
          />
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
            onClick={handleBuscar}
            disabled={loading}
          >
            Buscar
          </Button>
        </Box>

        <Typography color="text.secondary" variant="body2">
          Ingrese el ID del producto (ej: 1) o el número de lote para ver su trazabilidad
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {mostrarPorProducto && resultadoProducto && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Producto: {resultadoProducto.producto?.codigo} - {resultadoProducto.producto?.nombre}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              ID: {resultadoProducto.producto?.id}
            </Typography>

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Movimientos de inventario</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, '& .MuiTableCell-root': { py: 0.5 } }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Almacén</TableCell>
                    <TableCell>Lote</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Stock actual</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(resultadoProducto.trazabilidad?.movimientos ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">Sin movimientos</TableCell>
                    </TableRow>
                  ) : (
                    (resultadoProducto.trazabilidad?.movimientos ?? []).map((m: any) => (
                      <TableRow key={m.id}>
                        <TableCell>{m.created_at ? new Date(m.created_at).toLocaleString() : '-'}</TableCell>
                        <TableCell><Chip label={m.tipo} size="small" color={m.tipo === 'ENTRADA' ? 'success' : 'default'} /></TableCell>
                        <TableCell>{m.almacen?.nombre ?? '-'}</TableCell>
                        <TableCell>{m.lote ?? '-'}</TableCell>
                        <TableCell align="right">{m.cantidad}</TableCell>
                        <TableCell align="right">{m.stock_actual ?? '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Ingresos</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, '& .MuiTableCell-root': { py: 0.5 } }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Documento</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Lote</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">P. unit.</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(resultadoProducto.trazabilidad?.ingresos ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">Sin ingresos</TableCell>
                    </TableRow>
                  ) : (
                    (resultadoProducto.trazabilidad?.ingresos ?? []).map((d: any) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.ingreso?.numero_documento ?? '-'}</TableCell>
                        <TableCell>{d.ingreso?.fecha ? new Date(d.ingreso.fecha).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{d.lote ?? '-'}</TableCell>
                        <TableCell align="right">{d.cantidad}</TableCell>
                        <TableCell align="right">{formatCurrency(Number(d.precio_unitario ?? 0))}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Ventas</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ '& .MuiTableCell-root': { py: 0.5 } }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Factura</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Lote</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">P. unit.</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(resultadoProducto.trazabilidad?.ventas ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">Sin ventas</TableCell>
                    </TableRow>
                  ) : (
                    (resultadoProducto.trazabilidad?.ventas ?? []).map((d: any) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.venta?.numero_factura ?? '-'}</TableCell>
                        <TableCell>{d.venta?.fecha ? new Date(d.venta.fecha).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{d.venta?.cliente?.nombre ?? '-'}</TableCell>
                        <TableCell>{d.lote ?? '-'}</TableCell>
                        <TableCell align="right">{d.cantidad}</TableCell>
                        <TableCell align="right">{formatCurrency(Number(d.precio_unitario ?? 0))}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {mostrarPorLote && resultadoLote && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Lote: {resultadoLote.lote}
            </Typography>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Movimientos</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, '& .MuiTableCell-root': { py: 0.5 } }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Almacén</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(resultadoLote.movimientos ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">Sin movimientos</TableCell>
                    </TableRow>
                  ) : (
                    (resultadoLote.movimientos ?? []).map((m: any) => (
                      <TableRow key={m.id}>
                        <TableCell>{m.created_at ? new Date(m.created_at).toLocaleString() : '-'}</TableCell>
                        <TableCell>{m.producto?.nombre ?? '-'}</TableCell>
                        <TableCell><Chip label={m.tipo} size="small" color={m.tipo === 'ENTRADA' ? 'success' : 'default'} /></TableCell>
                        <TableCell>{m.almacen?.nombre ?? '-'}</TableCell>
                        <TableCell align="right">{m.cantidad}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Ingresos</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, '& .MuiTableCell-root': { py: 0.5 } }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Documento</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(resultadoLote.ingresos ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">Sin ingresos</TableCell>
                    </TableRow>
                  ) : (
                    (resultadoLote.ingresos ?? []).map((d: any) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.ingreso?.numero_documento ?? '-'}</TableCell>
                        <TableCell>{d.producto?.nombre ?? '-'}</TableCell>
                        <TableCell align="right">{d.cantidad}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Ventas</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ '& .MuiTableCell-root': { py: 0.5 } }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Factura</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(resultadoLote.ventas ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">Sin ventas</TableCell>
                    </TableRow>
                  ) : (
                    (resultadoLote.ventas ?? []).map((d: any) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.venta?.numero_factura ?? '-'}</TableCell>
                        <TableCell>{d.producto?.nombre ?? '-'}</TableCell>
                        <TableCell align="right">{d.cantidad}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
