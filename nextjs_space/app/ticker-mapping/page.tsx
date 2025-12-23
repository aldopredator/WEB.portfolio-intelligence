'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Save, RefreshCw } from 'lucide-react';

interface Stock {
  id: string;
  ticker: string;
  company: string;
  alternativeTickers: string[];
}

export default function TickerMappingPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTickers, setEditingTickers] = useState<string[]>([]);
  const [newAltTicker, setNewAltTicker] = useState('');

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await fetch('/api/stocks/all');
      if (response.ok) {
        const data = await response.json();
        setStocks(data);
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (stock: Stock) => {
    setEditingId(stock.id);
    setEditingTickers([...stock.alternativeTickers]);
    setNewAltTicker('');
  };

  const handleAddAltTicker = () => {
    if (newAltTicker.trim() && !editingTickers.includes(newAltTicker.trim())) {
      setEditingTickers([...editingTickers, newAltTicker.trim()]);
      setNewAltTicker('');
    }
  };

  const handleRemoveAltTicker = (ticker: string) => {
    setEditingTickers(editingTickers.filter(t => t !== ticker));
  };

  const handleSave = async (stockId: string) => {
    try {
      const response = await fetch('/api/stocks/update-alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockId, alternativeTickers: editingTickers })
      });

      if (response.ok) {
        setStocks(stocks.map(s => 
          s.id === stockId ? { ...s, alternativeTickers: editingTickers } : s
        ));
        setEditingId(null);
        alert('Alternative tickers updated successfully!');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingTickers([]);
    setNewAltTicker('');
  };

  const handleBulkUpdate = async () => {
    if (!confirm('This will update alternative tickers for all stocks based on the predefined mappings. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/update-stock-sectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Empty body = update all stocks
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully updated ${result.updated} stocks with alternative tickers!`);
        await fetchStocks(); // Refresh the list
      } else {
        alert('Failed to update stocks');
      }
    } catch (error) {
      console.error('Error updating stocks:', error);
      alert('Error updating stocks');
    } finally {
      setLoading(false);
    }
  };

  const filteredStocks = stocks.filter(stock => 
    stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.alternativeTickers.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Ticker Mapping Manager</h1>
            <p className="text-slate-400">Manage alternative ticker symbols for bank statement matching</p>
          </div>
          <button
            onClick={handleBulkUpdate}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg text-white font-semibold transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Update All from Mappings
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ticker, company, or alternative ticker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Stocks Table */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700">
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase">Ticker</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase">Company</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase">Alternative Tickers</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">Loading...</td>
                  </tr>
                ) : filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">No stocks found</td>
                  </tr>
                ) : (
                  filteredStocks.map((stock) => (
                    <tr key={stock.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                      <td className="px-6 py-4">
                        <span className="font-mono font-semibold text-white">{stock.ticker}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{stock.company}</td>
                      <td className="px-6 py-4">
                        {editingId === stock.id ? (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {editingTickers.map((ticker) => (
                                <span
                                  key={ticker}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm"
                                >
                                  {ticker}
                                  <button
                                    onClick={() => handleRemoveAltTicker(ticker)}
                                    className="hover:text-red-400"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Add alternative ticker..."
                                value={newAltTicker}
                                onChange={(e) => setNewAltTicker(e.target.value.toUpperCase())}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddAltTicker()}
                                className="flex-1 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                onClick={handleAddAltTicker}
                                className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-blue-300 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {stock.alternativeTickers.length > 0 ? (
                              stock.alternativeTickers.map((ticker) => (
                                <span
                                  key={ticker}
                                  className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded text-sm font-mono"
                                >
                                  {ticker}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-500 text-sm italic">No alternatives</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {editingId === stock.id ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleSave(stock.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded text-emerald-300 transition-colors text-sm"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={handleCancel}
                              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(stock)}
                            className="px-4 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-blue-300 transition-colors text-sm"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-300 mb-2">💡 How it works</h3>
          <p className="text-sm text-slate-300">
            Add alternative ticker symbols to map different formats from your bank statements. 
            For example, if your bank uses "BRK/B" but your database has "BRK.B", add "BRK/B" as an alternative ticker.
          </p>
        </div>
      </div>
    </div>
  );
}
