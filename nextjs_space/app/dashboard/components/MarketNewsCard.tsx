'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface NewsArticle {
  headline: string;
  source: string;
  url: string;
  datetime?: number;
  summary?: string;
}

interface MarketNewsCardProps {
  ticker: string;
  articles?: NewsArticle[];
}

export default function MarketNewsCard({ ticker, articles = [] }: MarketNewsCardProps) {
  // Show only the 3 most recent articles
  const recentArticles = articles.slice(0, 3);

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <NewspaperIcon sx={{ color: 'primary.main' }} />
          <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
            Market News
          </Typography>
        </Stack>

        {recentArticles.length > 0 ? (
          <Stack spacing={2}>
            {recentArticles.map((article, index) => (
              <Box
                key={index}
                sx={{
                  pb: index < recentArticles.length - 1 ? 2 : 0,
                  borderBottom: index < recentArticles.length - 1 ? 1 : 0,
                  borderColor: 'divider',
                }}
              >
                <Link
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  sx={{
                    color: 'text.primary',
                    display: 'block',
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box flex={1}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, lineHeight: 1.4 }}>
                        {article.headline}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {article.source}
                        {article.datetime && ` • ${new Date(article.datetime * 1000).toLocaleDateString()}`}
                      </Typography>
                    </Box>
                    <OpenInNewIcon sx={{ fontSize: '1rem', color: 'text.secondary', flexShrink: 0 }} />
                  </Stack>
                </Link>
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No recent news available for {ticker}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
