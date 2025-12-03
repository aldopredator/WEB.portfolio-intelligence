'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, Loader2 } from 'lucide-react';
import { Box, Typography, TextField, Paper, List, ListItem, ListItemButton, ListItemText, IconButton, InputAdornment, CircularProgress, Chip } from '@mui/material';

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  region?: string;
  currency?: string;
}

interface TickerSearchProps {
  onTickerSelect?: (ticker: SearchResult) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function TickerSearch({ onTickerSelect, placeholder = "Search by ticker or function", autoFocus = false }: TickerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for tickers
  useEffect(() => {
    const searchTickers = async () => {
      if (query.length < 1) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        // Call our API route to search for tickers
        const response = await fetch(`/api/search-ticker?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Error searching tickers:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchTickers, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (result: SearchResult) => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    if (onTickerSelect) {
      onTickerSelect(result);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getExchangeColor = (exchange: string): string => {
    if (exchange.includes('NASDAQ')) return '#0088ff';
    if (exchange.includes('NYSE')) return '#00c896';
    if (exchange.includes('LSE') || exchange.includes('LON')) return '#f23645';
    if (exchange.includes('PAR') || exchange.includes('EPA')) return '#4a90e2';
    return '#666';
  };

  return (
    <Box ref={searchRef} sx={{ position: 'relative', width: '100%', maxWidth: 600 }}>
      <TextField
        inputRef={inputRef}
        fullWidth
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => query.length > 0 && results.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={20} color="#fff" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {isLoading ? (
                <CircularProgress size={20} sx={{ color: '#888' }} />
              ) : query.length > 0 ? (
                <IconButton size="small" onClick={handleClear} sx={{ color: '#888' }}>
                  <X size={18} />
                </IconButton>
              ) : null}
            </InputAdornment>
          ),
          sx: {
            bgcolor: '#1a1a1a',
            borderRadius: 2,
            '& input': {
              color: '#fff',
              fontSize: '0.95rem',
            },
            '& fieldset': {
              borderColor: '#333',
            },
            '&:hover fieldset': {
              borderColor: '#555 !important',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0088ff !important',
            },
          },
        }}
      />

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            bgcolor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 2,
            maxHeight: 400,
            overflowY: 'auto',
            zIndex: 1000,
            '&::-webkit-scrollbar': {
              width: 8,
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: '#0a0a0a',
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: '#333',
              borderRadius: 4,
              '&:hover': {
                bgcolor: '#444',
              },
            },
          }}
        >
          <List sx={{ p: 0 }}>
            {results.map((result, index) => (
              <ListItem
                key={`${result.symbol}-${result.exchange}`}
                disablePadding
                sx={{
                  borderBottom: index < results.length - 1 ? '1px solid #222' : 'none',
                }}
              >
                <ListItemButton
                  selected={index === selectedIndex}
                  onClick={() => handleSelect(result)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&:hover': {
                      bgcolor: '#252525',
                    },
                    '&.Mui-selected': {
                      bgcolor: '#2a2a2a',
                      '&:hover': {
                        bgcolor: '#2f2f2f',
                      },
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1,
                        bgcolor: '#252525',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #333',
                      }}
                    >
                      <TrendingUp size={20} color="#0088ff" />
                    </Box>
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography
                          variant="body1"
                          sx={{
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                          }}
                        >
                          {result.symbol}
                        </Typography>
                        
                        <Chip
                          label={result.exchange}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            bgcolor: `${getExchangeColor(result.exchange)}20`,
                            color: getExchangeColor(result.exchange),
                            border: `1px solid ${getExchangeColor(result.exchange)}40`,
                            '& .MuiChip-label': {
                              px: 1,
                            },
                          }}
                        />

                        {result.type && (
                          <Chip
                            label={result.type}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: '#333',
                              color: '#999',
                              '& .MuiChip-label': {
                                px: 1,
                              },
                            }}
                          />
                        )}
                      </Box>
                      
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#999',
                          fontSize: '0.85rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {result.name}
                      </Typography>
                    </Box>

                    {result.region && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#666',
                          fontSize: '0.75rem',
                        }}
                      >
                        {result.region}
                      </Typography>
                    )}
                  </Box>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* No Results */}
      {isOpen && !isLoading && query.length > 0 && results.length === 0 && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            bgcolor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 2,
            p: 3,
            zIndex: 1000,
          }}
        >
          <Typography sx={{ color: '#999', textAlign: 'center', fontSize: '0.9rem' }}>
            No results found for "{query}"
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
