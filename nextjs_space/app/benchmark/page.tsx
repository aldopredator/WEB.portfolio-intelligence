'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import { TrendingUp } from 'lucide-react';

export default function BenchmarkPage() {
  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, mx: 'auto', p: 3 }}>
      {/* Page Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <TrendingUp className="w-8 h-8 text-blue-400" />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Benchmark
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Compare portfolio performance against market benchmarks
          </Typography>
        </Box>
      </Stack>

      {/* Placeholder Content */}
      <Card>
        <CardContent>
          <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', py: 8 }}>
            Benchmark widgets and details coming soon...
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
