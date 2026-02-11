import { Box, Typography, Grid, Card, CardContent, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import { useState } from 'react';

export default function ReportesPage() {
  const [formato, setFormato] = useState<'pdf' | 'excel'>('pdf');

  const reportes = [
    { nombre: 'Ventas', endpoint: '/reportes/ventas' },
    { nombre: 'Stock Bajo', endpoint: '/reportes/stock-bajo' },
    { nombre: 'Kardex', endpoint: '/reportes/kardex' },
    { nombre: 'Cuentas por Cobrar', endpoint: '/reportes/cuentas-cobrar' },
    { nombre: 'Cuentas Vencidas', endpoint: '/reportes/cuentas-vencidas' },
  ];

  const handleGenerar = (endpoint: string) => {
    // Implementar generación de reporte
    window.open(`${import.meta.env.VITE_API_URL}${endpoint}?formato=${formato}`, '_blank');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Reportes</Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Formato</InputLabel>
          <Select
            value={formato}
            label="Formato"
            onChange={(e) => setFormato(e.target.value as 'pdf' | 'excel')}
          >
            <MenuItem value="pdf">PDF</MenuItem>
            <MenuItem value="excel">Excel</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {reportes.map((reporte) => (
          <Grid item xs={12} sm={6} md={4} key={reporte.nombre}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {reporte.nombre}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={formato === 'pdf' ? <PictureAsPdfIcon /> : <TableChartIcon />}
                  onClick={() => handleGenerar(reporte.endpoint)}
                  sx={{ mt: 2 }}
                >
                  Generar {formato.toUpperCase()}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
