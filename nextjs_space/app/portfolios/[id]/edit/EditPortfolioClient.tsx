'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, GripVertical, Upload, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { TickerSearch } from '@/app/components/TickerSearch';

interface Stock {
  id: string;
  ticker: string;
  company: string;
  type: string | null;
}

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  stocks: Stock[];
}

export default function EditPortfolioClient({ portfolioId }: { portfolioId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchPortfolio();
  }, [portfolioId]);

  const fetchPortfolio = async () => {
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}`);
      const data = await response.json();
      
      if (data.success) {
        setPortfolio(data.portfolio);
        setFormData({
          name: data.portfolio.name,
          description: data.portfolio.description || '',
        });
      } else {
        toast.error('Failed to load portfolio');
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast.error('Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInfo = async () => {
    if (!formData.name.trim()) {
      toast.error('Portfolio name is required');
      return;
    }

    try {
      const response = await fetch(`/api/portfolios/${portfolioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Portfolio updated successfully');
        fetchPortfolio();
      } else {
        toast.error(data.error || 'Failed to update portfolio');
      }
    } catch (error) {
      console.error('Error updating portfolio:', error);
      toast.error('Failed to update portfolio');
    }
  };

  const handleAddTicker = async (result: { symbol: string; name: string; exchange: string; type: string }) => {
    try {
      const response = await fetch('/api/add-ticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: result.symbol,
          name: result.name,
          type: result.type,
          exchange: result.exchange,
          portfolioId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`${result.symbol} added to portfolio`);
        fetchPortfolio();
      } else {
        toast.error(data.error || 'Failed to add ticker');
      }
    } catch (error) {
      console.error('Error adding ticker:', error);
      toast.error('Failed to add ticker');
    }
  };

  const handleRemoveTicker = async (stockId: string, ticker: string) => {
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/stocks/${stockId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${ticker} removed from portfolio`);
        fetchPortfolio();
      } else {
        toast.error(data.error || 'Failed to remove ticker');
      }
    } catch (error) {
      console.error('Error removing ticker:', error);
      toast.error('Failed to remove ticker');
    }
  };

  const parseTickersFromText = (text: string): string[] => {
    // Split by common delimiters: comma, semicolon, newline, tab, pipe
    const tickers = text
      .split(/[,;\n\t|]/)
      .map(t => t.trim().toUpperCase())
      .filter(t => t.length > 0 && /^[A-Z0-9.-]+$/.test(t)); // Only valid ticker symbols
    
    return [...new Set(tickers)]; // Remove duplicates
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportText(content);
    };

    if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      toast.error('Please upload a CSV or TXT file');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBulkImport = async () => {
    if (!importText.trim()) {
      toast.error('Please enter or upload ticker symbols');
      return;
    }

    const tickers = parseTickersFromText(importText);
    
    if (tickers.length === 0) {
      toast.error('No valid ticker symbols found');
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;

    toast.loading(`Importing ${tickers.length} tickers...`);

    for (const ticker of tickers) {
      try {
        const response = await fetch('/api/add-ticker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticker,
            name: ticker, // Will be updated by the API
            portfolioId,
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    setIsImporting(false);
    toast.dismiss();
    
    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} ticker(s)`);
      fetchPortfolio();
    }
    
    if (failCount > 0) {
      toast.error(`Failed to import ${failCount} ticker(s)`);
    }

    setIsImportDialogOpen(false);
    setImportText('');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading portfolio...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Portfolio not found</p>
          <Button onClick={() => router.push('/portfolios')} className="mt-4">
            Back to Portfolios
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/portfolios')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Portfolio</h1>
          <p className="text-muted-foreground">Manage portfolio details and stocks</p>
        </div>
      </div>

      {/* Portfolio Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Portfolio Information</CardTitle>
          <CardDescription>Update portfolio name and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Portfolio Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., My Barclays Portfolio"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this portfolio..."
              rows={3}
            />
          </div>
          <Button onClick={handleUpdateInfo}>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Stocks Management Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Stocks in Portfolio ({portfolio.stocks.length})</CardTitle>
              <CardDescription>Add or remove stocks from this portfolio</CardDescription>
            </div>
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Bulk Import
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Import Tickers from File</DialogTitle>
                  <DialogDescription>
                    Upload a CSV or text file with ticker symbols, or paste them below (comma, semicolon, or newline separated)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Upload File</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FileUp className="h-4 w-4" />
                        Choose File (CSV, TXT)
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="import-text">Or Paste Tickers</Label>
                    <Textarea
                      id="import-text"
                      placeholder="AAPL, MSFT, GOOGL&#10;TSLA; NVDA; AMD&#10;META&#10;AMZN"
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Supported separators: comma (,), semicolon (;), newline, tab, pipe (|)
                    </p>
                  </div>
                  {importText && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium mb-1">Preview:</p>
                      <p className="text-sm text-muted-foreground">
                        {parseTickersFromText(importText).length} ticker(s) detected: {parseTickersFromText(importText).slice(0, 10).join(', ')}
                        {parseTickersFromText(importText).length > 10 && '...'}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} disabled={isImporting}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkImport} disabled={isImporting || !importText.trim()}>
                    {isImporting ? 'Importing...' : 'Import Tickers'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Ticker Search */}
          <div className="mb-6">
            <Label className="mb-2 block">Add Stock</Label>
            <TickerSearch onTickerSelect={handleAddTicker} />
          </div>

          {/* Stocks List */}
          <div className="space-y-2">
            {portfolio.stocks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No stocks in this portfolio yet. Add some above!
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2">
                {[...portfolio.stocks].sort((a, b) => a.ticker.localeCompare(b.ticker)).map((stock) => (
                  <div
                    key={stock.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      <div>
                        <div className="font-semibold">{stock.ticker}</div>
                        <div className="text-sm text-muted-foreground">{stock.company}</div>
                      </div>
                      {stock.type && (
                        <Badge variant="outline" className="text-xs">
                          {stock.type}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveTicker(stock.id, stock.ticker)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
