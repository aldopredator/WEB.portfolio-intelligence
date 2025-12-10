'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Edit2, Trash2, Briefcase, TrendingUp, Package, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';

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
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  stocks: Stock[];
  _count: {
    stocks: number;
  };
}

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      const response = await fetch('/api/portfolios');
      const data = await response.json();
      
      if (data.success) {
        setPortfolios(data.portfolios);
      } else {
        toast.error('Failed to load portfolios');
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      toast.error('Failed to load portfolios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async () => {
    if (!formData.name.trim()) {
      toast.error('Portfolio name is required');
      return;
    }

    try {
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Portfolio "${formData.name}" created successfully`);
        setIsCreateDialogOpen(false);
        setFormData({ name: '', description: '' });
        fetchPortfolios();
      } else {
        toast.error(data.error || 'Failed to create portfolio');
      }
    } catch (error) {
      console.error('Error creating portfolio:', error);
      toast.error('Failed to create portfolio');
    }
  };

  const handleUpdatePortfolio = async () => {
    if (!selectedPortfolio || !formData.name.trim()) {
      toast.error('Portfolio name is required');
      return;
    }

    try {
      const response = await fetch(`/api/portfolios/${selectedPortfolio.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Portfolio "${formData.name}" updated successfully`);
        setIsEditDialogOpen(false);
        setSelectedPortfolio(null);
        setFormData({ name: '', description: '' });
        fetchPortfolios();
      } else {
        toast.error(data.error || 'Failed to update portfolio');
      }
    } catch (error) {
      console.error('Error updating portfolio:', error);
      toast.error('Failed to update portfolio');
    }
  };

  const handleDeletePortfolio = async () => {
    if (!selectedPortfolio) return;

    try {
      const response = await fetch(`/api/portfolios/${selectedPortfolio.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Portfolio "${selectedPortfolio.name}" deleted successfully`);
        setIsDeleteDialogOpen(false);
        setSelectedPortfolio(null);
        fetchPortfolios();
      } else {
        toast.error(data.error || 'Failed to delete portfolio');
      }
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      toast.error('Failed to delete portfolio');
    }
  };

  const handleToggleLock = async (portfolio: Portfolio) => {
    try {
      const response = await fetch(`/api/portfolios/${portfolio.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isLocked: !portfolio.isLocked 
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Portfolio "${portfolio.name}" ${portfolio.isLocked ? 'unlocked' : 'locked'} successfully`);
        fetchPortfolios();
      } else {
        toast.error(data.error || 'Failed to update portfolio lock status');
      }
    } catch (error) {
      console.error('Error toggling portfolio lock:', error);
      toast.error('Failed to update portfolio lock status');
    }
  };

  const openEditDialog = (portfolio: Portfolio) => {
    // Redirect to dedicated edit page
    window.location.href = `/portfolios/${portfolio.id}/edit`;
  };

  const openDeleteDialog = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio);
    setIsDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading portfolios...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Briefcase className="h-8 w-8" />
            Portfolio Management
          </h1>
          <p className="text-muted-foreground">
            Organize your stocks into different buckets
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <PlusCircle className="h-5 w-5" />
              New Portfolio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Portfolio</DialogTitle>
              <DialogDescription>
                Create a new portfolio to organize your stocks
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Portfolio Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., My Interactive Broker"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this portfolio..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePortfolio}>
                Create Portfolio
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty State */}
      {portfolios.length === 0 && (
        <Alert>
          <Briefcase className="h-4 w-4" />
          <AlertDescription>
            No portfolios found. Create your first portfolio to get started!
          </AlertDescription>
        </Alert>
      )}

      {/* Portfolios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolios.map((portfolio) => (
          <Card key={portfolio.id} className="hover:shadow-lg transition-shadow min-h-[280px]">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    {portfolio.name}
                    {portfolio.isLocked && (
                      <Badge variant="secondary" className="ml-2">
                        <Lock className="h-3 w-3 mr-1" />
                        Locked
                      </Badge>
                    )}
                  </CardTitle>
                  {portfolio.description && (
                    <CardDescription className="mt-2">
                      {portfolio.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleLock(portfolio)}
                    title={portfolio.isLocked ? 'Unlock portfolio' : 'Lock portfolio'}
                  >
                    {portfolio.isLocked ? (
                      <Lock className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Unlock className="h-4 w-4 text-green-500" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(portfolio)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDeleteDialog(portfolio)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Stocks</span>
                  <Badge variant="secondary" className="text-base">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {portfolio._count.stocks}
                  </Badge>
                </div>
                
                {portfolio.stocks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Recent Stocks:</p>
                    <div className="flex flex-wrap gap-2">
                      {portfolio.stocks.slice(0, 6).map((stock) => (
                        <Badge key={stock.id} variant="outline">
                          {stock.ticker}
                        </Badge>
                      ))}
                      {portfolio.stocks.length > 6 && (
                        <Badge variant="outline">+{portfolio.stocks.length - 6} more</Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {portfolio.stocks.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No stocks in this portfolio yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Portfolio</DialogTitle>
            <DialogDescription>
              Update portfolio name and description
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Portfolio Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., My Interactive Broker"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Brief description of this portfolio..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePortfolio}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Portfolio</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedPortfolio?.name}"?
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertDescription>
              This will remove {selectedPortfolio?._count.stocks || 0} stock(s) from this portfolio.
              The stocks will not be deleted, just removed from the portfolio.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePortfolio}>
              Delete Portfolio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
