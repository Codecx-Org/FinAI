import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Users, Calendar, Target, Lightbulb, Edit2, Save, X, Plus, Receipt, Trash2, Download, DollarSign } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useExpenses, useCreateExpense, useDeleteExpense } from '../hooks/api/useExpenses';
import { toast } from 'sonner';

interface Goal {
  id: number;
  title: string;
  current: number;
  target: number;
  unit: string;
}

interface BusinessInsightsProps {
  businessId?: number;
}

const productCategories = [
  { name: 'Dairy Feed', value: 35, color: '#8884d8' },
  { name: 'Poultry Feed', value: 25, color: '#82ca9d' },
  { name: 'Swine Feed', value: 20, color: '#ffc658' },
  { name: 'Aquaculture', value: 12, color: '#ff7300' },
  { name: 'Others', value: 8, color: '#0088fe' }
];

const customerSegments = [
  { segment: 'Regular Farmers', count: 156, growth: 12, color: 'text-green-600' },
  { segment: 'New Farmers', count: 23, growth: 8, color: 'text-blue-600' },
  { segment: 'Large-Scale Farms', count: 67, growth: -3, color: 'text-orange-600' }
];

const defaultGoals = [
  { id: 1, title: 'Monthly Feed Sales Target', current: 450000, target: 600000, unit: 'KES' },
  { id: 2, title: 'New Farmer Customers', current: 23, target: 30, unit: 'farmers' },
  { id: 3, title: 'Feed Inventory Turnover', current: 2.3, target: 3.0, unit: 'times' }
];

const salesData = [
  { day: 'Mon', sales: 25000 },
  { day: 'Tue', sales: 18000 },
  { day: 'Wed', sales: 22000 },
  { day: 'Thu', sales: 28000 },
  { day: 'Fri', sales: 32000 },
  { day: 'Sat', sales: 45000 },
  { day: 'Sun', sales: 15000 }
];

export function BusinessInsights({ businessId }: BusinessInsightsProps) {
  const { data: expenses = [], isLoading: isLoadingExpenses } = useExpenses(businessId);
  const { mutate: createExpense, isPending: isCreatingExpense } = useCreateExpense();
  const { mutate: deleteExpense } = useDeleteExpense();

  const [goals, setGoals] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('numeraai_goals');
      return saved ? JSON.parse(saved) : defaultGoals;
    }
    return defaultGoals;
  });

  const [editingGoal, setEditingGoal] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({ target: 0, current: 0 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    current: 0,
    target: 0,
    unit: 'KES'
  });
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: 0,
    category: 'Supplies'
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleEditGoal = (goalId: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      setEditingGoal(goalId);
      setEditValues({ target: goal.target, current: goal.current });
      setIsDialogOpen(true);
    }
  };

  const handleSaveGoal = () => {
    if (editingGoal) {
      setGoals(prev => prev.map(goal =>
        goal.id === editingGoal
          ? { ...goal, current: editValues.current, target: editValues.target }
          : goal
      ));
      setEditingGoal(null);
      setIsDialogOpen(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingGoal(null);
    setIsDialogOpen(false);
  };

  const handleAddGoal = () => {
    if (newGoal.title && newGoal.target > 0) {
      const goal: Goal = {
        id: Date.now(),
        title: newGoal.title,
        current: newGoal.current,
        target: newGoal.target,
        unit: newGoal.unit
      };
      setGoals(prev => [...prev, goal]);
      setNewGoal({ title: '', current: 0, target: 0, unit: 'KES' });
      setIsGoalDialogOpen(false);
    }
  };

  const handleCancelAddGoal = () => {
    setNewGoal({ title: '', current: 0, target: 0, unit: 'KES' });
    setIsGoalDialogOpen(false);
  };

  const handleAddExpense = () => {
    if (newExpense.description && newExpense.amount > 0 && businessId) {
      createExpense({
        type: newExpense.category,
        description: newExpense.description,
        amount: newExpense.amount,
        businessId: businessId,
        isRecurring: false
      }, {
        onSuccess: () => {
          toast.success('Expense recorded');
          setNewExpense({ description: '', amount: 0, category: 'Supplies' });
          setIsExpenseDialogOpen(false);
        },
        onError: () => {
          toast.error('Failed to record expense');
        }
      });
    }
  };

  const handleDeleteExpense = (expenseId: number) => {
    if (businessId) {
      deleteExpense({ id: expenseId, businessId });
    }
  };

  const downloadFinancialReport = () => {
    console.log('Downloading financial report...');
  };

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="text-center pb-2">
        <h2 className="text-lg font-semibold">Business Insights</h2>
        <p className="text-xs text-muted-foreground">
          Analytics & performance insights
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3">
          {/* Goals Progress - Compact */}
          <Card className="p-3">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Monthly Goals
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-7 px-2 text-xs">
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add New Goal</DialogTitle>
                        <DialogDescription>
                          Create a custom monthly goal to track your progress.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="goalTitle" className="text-sm">Goal Title</Label>
                          <Input
                            id="goalTitle"
                            placeholder="e.g., Daily Sales Target"
                            value={newGoal.title}
                            onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                            className="h-8"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor="goalCurrent" className="text-sm">Current Value</Label>
                            <Input
                              id="goalCurrent"
                              type="number"
                              placeholder="0"
                              value={newGoal.current || ''}
                              onChange={(e) => setNewGoal(prev => ({ ...prev, current: parseFloat(e.target.value) || 0 }))}
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="goalTarget" className="text-sm">Target Value</Label>
                            <Input
                              id="goalTarget"
                              type="number"
                              placeholder="0"
                              value={newGoal.target || ''}
                              onChange={(e) => setNewGoal(prev => ({ ...prev, target: parseFloat(e.target.value) || 0 }))}
                              className="h-8"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="goalUnit" className="text-sm">Unit</Label>
                          <Select value={newGoal.unit} onValueChange={(value) => setNewGoal(prev => ({ ...prev, unit: value }))}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="KES">KES (Currency)</SelectItem>
                              <SelectItem value="customers">Customers</SelectItem>
                              <SelectItem value="farmers">Farmers</SelectItem>
                              <SelectItem value="times">Times</SelectItem>
                              <SelectItem value="kg">Kilograms</SelectItem>
                              <SelectItem value="bags">Bags</SelectItem>
                              <SelectItem value="units">Units</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button onClick={handleAddGoal} className="flex-1 h-8 text-sm">
                            <Plus className="w-3 h-3 mr-1" />
                            Add Goal
                          </Button>
                          <Button variant="outline" onClick={handleCancelAddGoal} className="h-8 text-sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <button className="flex items-center justify-center h-6 w-6 p-0 rounded-md border border-transparent bg-transparent hover:bg-accent hover:text-accent-foreground">
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit Goal</DialogTitle>
                        <DialogDescription>
                          Update your monthly goal targets and current progress.
                        </DialogDescription>
                      </DialogHeader>
                      {editingGoal && (
                        <div className="space-y-3">
                          {(() => {
                            const goal = goals.find(g => g.id === editingGoal);
                            return goal ? (
                              <>
                                <div>
                                  <h4 className="font-medium mb-2 text-sm">{goal.title}</h4>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Current Value</label>
                                  <Input
                                    type="number"
                                    value={editValues.current}
                                    onChange={(e) => setEditValues(prev => ({ 
                                      ...prev, 
                                      current: parseFloat(e.target.value) || 0 
                                    }))}
                                    placeholder={`Current ${goal.unit}`}
                                    className="h-8"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Target Value</label>
                                  <Input
                                    type="number"
                                    value={editValues.target}
                                    onChange={(e) => setEditValues(prev => ({ 
                                      ...prev, 
                                      target: parseFloat(e.target.value) || 0 
                                    }))}
                                    placeholder={`Target ${goal.unit}`}
                                    className="h-8"
                                  />
                                </div>
                                <div className="flex gap-2 pt-2">
                                  <button 
                                    onClick={handleSaveGoal} 
                                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 py-1 rounded-md inline-flex items-center justify-center text-sm"
                                  >
                                    <Save className="w-3 h-3 mr-1" />
                                    Save
                                  </button>
                                  <button 
                                    onClick={handleCancelEdit} 
                                    className="flex-1 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 py-1 rounded-md inline-flex items-center justify-center text-sm"
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    Cancel
                                  </button>
                                </div>
                              </>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              {goals.map((goal) => {
                const percentage = (goal.current / goal.target) * 100;
                return (
                  <div key={goal.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{goal.title}</span>
                        <button
                          className="h-5 w-5 p-0 opacity-60 hover:opacity-100 flex items-center justify-center rounded-sm hover:bg-accent"
                          onClick={() => handleEditGoal(goal.id)}
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {goal.unit === 'KES' ? formatCurrency(goal.current) : `${goal.current} ${goal.unit}`} / {' '}
                        {goal.unit === 'KES' ? formatCurrency(goal.target) : `${goal.target} ${goal.unit}`}
                      </span>
                    </div>
                    <Progress value={Math.min(percentage, 100)} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">
                      {percentage.toFixed(1)}% complete
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* AI Recommendations - Overview */}
          <Card className="p-3">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Lightbulb className="w-4 h-4" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-200">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <div className="text-center">
                        <h3 className="font-medium text-blue-700 text-sm">Demand Prediction</h3>
                        <p className="text-xs text-muted-foreground">Forecast demand for each product</p>
                      </div>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Demand Predictions
                      </DialogTitle>
                      <DialogDescription>
                        AI-powered demand forecasting for your animal feed products
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      <div className="grid gap-3">
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <h4 className="font-medium text-sm text-green-700">Chick Mash 50kg</h4>
                          </div>
                          <p className="text-xs text-green-600 mb-1">
                            🔼 High demand expected next week (+35% increase)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Based on seasonal trends and new poultry farmers in your area
                          </p>
                        </div>

                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <h4 className="font-medium text-sm text-blue-700">Layers Mash 50kg</h4>
                          </div>
                          <p className="text-xs text-blue-600 mb-1">
                            ➡️ Stable demand expected (±8% variation)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Consistent demand from regular poultry farmers
                          </p>
                        </div>

                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <h4 className="font-medium text-sm text-yellow-700">Growers Mash 50kg</h4>
                          </div>
                          <p className="text-xs text-yellow-600 mb-1">
                            📈 Growing demand trend (+15% this month)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Increasing poultry farming activity in your area
                          </p>
                        </div>

                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <h4 className="font-medium text-sm text-purple-700">Dairy Meal 50kg</h4>
                          </div>
                          <p className="text-xs text-purple-600 mb-1">
                            🔽 Seasonal dip expected (-12% next 2 weeks)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Post-holiday reduction in dairy farming
                          </p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-200">
                      <DollarSign className="w-5 h-5 text-purple-600" />
                      <div className="text-center">
                        <h3 className="font-medium text-purple-700 text-sm">Pricing Suggestions</h3>
                        <p className="text-xs text-muted-foreground">Optimize prices for maximum profit</p>
                      </div>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                        Pricing Recommendations
                      </DialogTitle>
                      <DialogDescription>
                        AI-powered pricing suggestions based on market analysis
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      <div className="grid gap-3">
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <h4 className="font-medium text-sm text-green-700">Chick Mash 50kg</h4>
                          </div>
                          <p className="text-xs text-green-600 mb-1">
                            💰 Current: KES 2,800 → Suggested: KES 2,950 (+5.4%)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            High demand for chick feed supports price increase
                          </p>
                        </div>

                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <h4 className="font-medium text-sm text-blue-700">Layers Mash 50kg</h4>
                          </div>
                          <p className="text-xs text-blue-600 mb-1">
                            ⚖️ Current: KES 2,200 → Suggested: KES 2,300 (+4.5%)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Optimal pricing for steady egg production demand
                          </p>
                        </div>

                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <h4 className="font-medium text-sm text-yellow-700">Growers Mash 50kg</h4>
                          </div>
                          <p className="text-xs text-yellow-600 mb-1">
                            📈 Current: KES 2,400 → Suggested: KES 2,520 (+5%)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Growing market supports moderate price increase
                          </p>
                        </div>

                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <h4 className="font-medium text-sm text-orange-700">Pig Finisher 50kg</h4>
                          </div>
                          <p className="text-xs text-orange-600 mb-1">
                            📈 Current: KES 2,800 → Suggested: KES 2,900 (+3.5%)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Growing demand supports moderate price increase
                          </p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700 text-center">
                  💡 Click on Demand Prediction or Pricing Suggestions to get detailed AI-powered recommendations for each product
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Performance Summary - Compact */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 p-3">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  This Week's Performance
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadFinancialReport}
                  className="h-7 px-2 text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="text-base font-medium text-green-600">
                    {formatCurrency(159000)}
                  </p>
                  <p className="text-xs text-green-600">+18.5% vs last week</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                  <p className="text-base font-medium text-blue-600">438</p>
                  <p className="text-xs text-blue-600">+12.3% vs last week</p>
                </div>
              </div>
              <div className="mt-3 p-2 bg-white/50 rounded-lg">
                <p className="text-xs text-center">
                  🎉 Great job! You're on track to exceed your monthly target by 15%
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-3">
          {/* Sales Trend & Product Performance - Combined Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card className="p-3">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  Weekly Sales Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                      <XAxis dataKey="day" tick={{fontSize: 10}} />
                      <YAxis tick={{fontSize: 10}} />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ fill: '#8884d8', strokeWidth: 1, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Best Day</p>
                    <p className="text-sm font-medium">Sat - {formatCurrency(32000)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Growth</p>
                    <p className="text-sm font-medium text-green-600">+18.5%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-3">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BarChart3 className="w-4 h-4" />
                  Product Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={50}
                        dataKey="value"
                      >
                        {productCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-1">
                  {productCategories.map((category, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="truncate">{category.name}</span>
                      </div>
                      <span className="font-medium">{category.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Segments - Compact */}
          <Card className="p-3">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                Customer Segments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-2">
              {customerSegments.map((segment, index) => (
                <div key={index} className="flex justify-between items-center py-1">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{segment.segment}</p>
                    <p className="text-xs text-muted-foreground">{segment.count} customers</p>
                  </div>
                  <div className={`flex items-center gap-1 ${segment.color}`}>
                    {segment.growth > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="text-xs font-medium">
                      {segment.growth > 0 ? '+' : ''}{segment.growth}%
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-3">
          {/* Expenses Tracking - Compact */}
          <Card className="p-3">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Business Expenses
                </div>
                <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-7 px-2 text-xs">
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Expense</DialogTitle>
                      <DialogDescription>
                        Record a business expense to track your costs.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="expenseDescription" className="text-sm">Description</Label>
                        <Input
                          id="expenseDescription"
                          placeholder="e.g., Office supplies, Rent, Fuel"
                          value={newExpense.description}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expenseAmount" className="text-sm">Amount (KES)</Label>
                        <Input
                          id="expenseAmount"
                          type="number"
                          placeholder="0"
                          value={newExpense.amount || ''}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expenseCategory" className="text-sm">Category</Label>
                        <Select value={newExpense.category} onValueChange={(value) => setNewExpense(prev => ({ ...prev, category: value }))}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Supplies">Supplies</SelectItem>
                            <SelectItem value="Rent">Rent</SelectItem>
                            <SelectItem value="Utilities">Utilities</SelectItem>
                            <SelectItem value="Transportation">Transportation</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                            <SelectItem value="Food & Drinks">Food & Drinks</SelectItem>
                            <SelectItem value="Equipment">Equipment</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleAddExpense} className="flex-1 h-8 text-sm">
                          <Plus className="w-3 h-3 mr-1" />
                          Add Expense
                        </Button>
                        <Button variant="outline" onClick={() => setIsExpenseDialogOpen(false)} className="h-8 text-sm">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingExpenses ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : expenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-3 text-sm">
                  No expenses recorded yet
                </p>
              ) : (
                <div className="space-y-2">
                  {expenses.slice(0, 5).map((expense) => (
                    <div key={expense.id} className="flex justify-between items-center py-2 px-2 bg-muted/30 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(expense.createdAt).toLocaleDateString()} • {expense.type}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-red-600 text-sm">
                          -{formatCurrency(expense.amount)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {expenses.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground py-1">
                      And {expenses.length - 5} more expenses...
                    </p>
                  )}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Monthly:</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}