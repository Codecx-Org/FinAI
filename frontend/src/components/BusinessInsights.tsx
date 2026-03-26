import React, { useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Receipt, Plus, Trash2, DollarSign, Target, Lightbulb, Edit2, Save, X } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useExpenses, useCreateExpense, useDeleteExpense } from '../hooks/api/useExpenses';
import { useWeeklyOverview, useCategoryPerformance, useProfitAnalytics, useAIInsights, Timeframe } from '../hooks/api/useAnalytics';
import { toast } from 'sonner';
import { BusinessInsightsSkeleton } from './Skeletons';

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

const defaultGoals = [
  { id: 1, title: 'Monthly Feed Sales Target', current: 450000, target: 600000, unit: 'KES' },
  { id: 2, title: 'New Farmer Customers', current: 23, target: 30, unit: 'farmers' },
  { id: 3, title: 'Feed Inventory Turnover', current: 2.3, target: 3.0, unit: 'times' }
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F', '#FFBB28', '#FF8042'];

export function BusinessInsights({ businessId }: BusinessInsightsProps) {
  const { data: expenses = [], isLoading: isLoadingExpenses } = useExpenses(businessId);
  const { mutate: createExpense } = useCreateExpense();
  const { mutate: deleteExpense } = useDeleteExpense();

  // Analytics Hooks
  const { data: weeklyOverview = [], isLoading: isLoadingOverview } = useWeeklyOverview(businessId);
  const { data: categoryPerformance = { sales: [], expenses: [] }, isLoading: isLoadingCategories } = useCategoryPerformance(businessId);
  const [timeframe, setTimeframe] = useState<Timeframe>('week');
  const { data: profitData = [], isLoading: isLoadingProfit } = useProfitAnalytics(businessId, timeframe);
  const { data: aiInsights, isLoading: isLoadingAI } = useAIInsights(businessId);

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

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const formatXAxis = (val: string) => {
    if (!val) return '';
    // If it's yyyy-MM-dd, return MM-dd
    if (val.length === 10) return val.slice(5);
    // If it's yyyy-MM, return Month Name
    if (val.length === 7) {
      const month = parseInt(val.slice(5)) - 1;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months[month] || val;
    }
    return val;
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

  if (isLoadingExpenses || isLoadingOverview || isLoadingCategories || isLoadingProfit) {
    return <BusinessInsightsSkeleton />;
  }

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

        <TabsContent value="overview" className="space-y-3 pt-2">
          {/* Goals Progress - Compact */}
          <Card className="p-3">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-bold">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
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
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {goal.unit === 'KES' ? formatCurrency(goal.current) : `${goal.current} ${goal.unit}`} / {' '}
                        {goal.unit === 'KES' ? formatCurrency(goal.target) : `${goal.target} ${goal.unit}`}
                      </span>
                    </div>
                    <Progress value={Math.min(percentage, 100)} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground">
                      {percentage.toFixed(1)}% complete
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* AI Insights - Overview */}
          <Card className="p-3 border-blue-100 bg-blue-50/30">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-blue-900">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                AI Business Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              {aiInsights ? (
                <>
                  <div className="p-3 bg-white border border-blue-100 rounded-lg shadow-sm">
                    <p className="text-xs text-blue-800 italic leading-relaxed">"{aiInsights.summary}"</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {aiInsights.trends.slice(0, 2).map((trend, idx) => (
                      <div key={idx} className={`p-2 border rounded-lg flex items-start gap-2 ${
                        trend.sentiment === 'positive' ? 'bg-green-50 border-green-100' : 
                        trend.sentiment === 'negative' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'
                      }`}>
                         {trend.sentiment === 'positive' ? <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" /> :
                          trend.sentiment === 'negative' ? <TrendingDown className="w-4 h-4 text-red-600 mt-0.5" /> :
                          <BarChart3 className="w-4 h-4 text-gray-600 mt-0.5" />}
                        <div>
                          <h4 className={`font-bold text-[11px] ${
                            trend.sentiment === 'positive' ? 'text-green-800' : 
                            trend.sentiment === 'negative' ? 'text-red-800' : 'text-gray-800'
                          }`}>{trend.title}</h4>
                          <p className={`text-[10px] ${
                            trend.sentiment === 'positive' ? 'text-green-700' : 
                            trend.sentiment === 'negative' ? 'text-red-700' : 'text-gray-700'
                          }`}>{trend.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-center text-xs text-muted-foreground py-4 italic">
                  AI is analyzing your data...
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-3 pt-2">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-sm font-bold">Performance Trends</h3>
            <Select value={timeframe} onValueChange={(val: Timeframe) => setTimeframe(val)}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="p-3">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <TrendingUp className="w-4 h-4 text-primary" />
                Sales Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeframe === 'week' ? weeklyOverview : profitData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey={timeframe === 'week' ? "day" : "date"} 
                      tick={{fontSize: 10}} 
                      tickFormatter={timeframe === 'week' ? undefined : formatXAxis}
                    />
                    <YAxis 
                      tick={{fontSize: 10}} 
                      tickFormatter={formatYAxis}
                      width={40}
                    />
                    <Tooltip 
                      contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => [formatCurrency(value), 'Sales']}
                    />
                    <Line
                      type="monotone"
                      dataKey={timeframe === 'week' ? "sales" : "revenue"}
                      stroke="#8884d8"
                      strokeWidth={3}
                      dot={{ fill: '#8884d8', strokeWidth: 1, r: 3 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="p-3">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <DollarSign className="w-4 h-4 text-green-600" />
                Profit & Loss Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{fontSize: 10}} 
                      tickFormatter={formatXAxis}
                    />
                    <YAxis 
                      tick={{fontSize: 10}} 
                      tickFormatter={formatYAxis}
                      width={40}
                    />
                    <Tooltip 
                      contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    <Bar dataKey="revenue" name="Revenue" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#ff8042" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Profit" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-3">
            <Card className="p-3">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex flex-col items-center">
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryPerformance.sales.length > 0 ? categoryPerformance.sales : [{ name: 'No Data', value: 1 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryPerformance.sales.length > 0 ? (
                          categoryPerformance.sales.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))
                        ) : (
                          <Cell fill="#f0f0f0" />
                        )}
                      </Pie>
                      <Tooltip formatter={(value) => typeof value === 'number' ? formatCurrency(value) : value} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 w-full space-y-1.5 max-h-32 overflow-y-auto px-2">
                  {categoryPerformance.sales.map((category, index) => (
                    <div key={index} className="flex justify-between items-center text-[11px]">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="truncate max-w-[120px] font-medium">{category.name}</span>
                      </div>
                      <span className="text-muted-foreground">{formatCurrency(category.value)}</span>
                    </div>
                  ))}
                  {categoryPerformance.sales.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-2">No sales data recorded</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-3 pt-2">
          {/* Expenses Tracking - Compact */}
          <Card className="p-3">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-bold">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-red-600" />
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
              {expenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-xs italic">
                  No expenses recorded yet. Start tracking your costs!
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {expenses.slice(0, 10).map((expense) => (
                      <div key={expense.id} className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[11px] truncate">{expense.description}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(expense.createdAt).toLocaleDateString()} • {expense.type}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-red-600 text-[11px]">
                            -{formatCurrency(expense.amount)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="h-7 w-7 p-0 rounded-full hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {expenses.length > 10 && (
                    <p className="text-[10px] text-center text-muted-foreground py-1">
                      Showing latest 10 of {expenses.length} expenses
                    </p>
                  )}
                  <div className="pt-3 border-t mt-2">
                    <div className="flex justify-between items-center bg-red-50 p-2 rounded-lg">
                      <span className="text-xs font-bold text-red-800">Total Expenses:</span>
                      <span className="font-bold text-red-700 text-sm">
                        {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}
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