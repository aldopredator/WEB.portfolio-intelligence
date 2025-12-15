'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

interface CompanyDescriptionCardProps {
  ticker: string;
  companyName?: string;
  description?: string;
}

export default function CompanyDescriptionCard({
  ticker,
  companyName,
  description,
}: CompanyDescriptionCardProps) {
  if (!description) {
    return null;
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
          About {companyName || ticker}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary',
            lineHeight: 1.7,
            textAlign: 'justify'
          }}
        >
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}
