import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { administracionService } from '../../services/administracionService';

export default function TabAuditoria() {
  const { data: auditoria = [], isLoading, error } = useQuery({
    queryKey: ['administracion', 'auditoria'],
    queryFn: () => administracionService.getAuditoria(),
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        No se pudo cargar la auditoría. Verifique que el backend esté disponible.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Auditoría del sistema
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Últimos registros de actividad (máx. 1000)
      </Typography>
      <TableContainer sx={{ maxHeight: 400, overflow: 'auto', '& .MuiTableCell-root': { py: 0.5 } }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell>Módulo</TableCell>
              <TableCell>Acción</TableCell>
              <TableCell>Descripción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {auditoria.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No hay registros de auditoría
                </TableCell>
              </TableRow>
            ) : (
              auditoria.map((a) => (
                <TableRow key={a.id}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {a.created_at ? new Date(a.created_at).toLocaleString() : '-'}
                  </TableCell>
                  <TableCell>
                    {a.usuario ? `${a.usuario.nombre || ''} (${a.usuario.username || a.usuario_id})` : a.usuario_id}
                  </TableCell>
                  <TableCell>{a.modulo}</TableCell>
                  <TableCell>{a.accion}</TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} title={a.descripcion || ''}>
                    {a.descripcion || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
