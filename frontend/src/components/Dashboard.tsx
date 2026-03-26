import { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Package, Lightbulb, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useSales } from '../hooks/api/useSales';
import { useProducts } from '../hooks/api/useProducts';
import { useExpenses } from '../hooks/api/useExpenses';
import { useInsights } from '../hooks/api/useInsights';
import { DashboardSkeleton } from './Skeletons';

interface UserData {
  id?: number;
  firstName: string;
  lastName: string;
  businessName: string;
  phone: string;
  businessType: string;
  yearsInBusiness: string;
  businessId?: number;
}

interface DashboardProps {
  userData?: UserData;
  businessId?: number;
}

export function Dashboard({ userData, businessId }: DashboardProps) {
  const [showGrowthTips, setShowGrowthTips] = useState(false);
  
  const { data: sales = [], isLoading: isLoadingSales } = useSales(businessId);
  const { data: products = [], isLoading: isLoadingProducts } = useProducts(businessId);
  const { data: expenses = [], isLoading: isLoadingExpenses } = useExpenses(businessId);
  const { data: insights, isLoading: isLoadingInsights } = useInsights(businessId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const todaysRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const lowStockCount = products.filter(p => p.stockQuantity <= 10).length;

  // Use user's first name or fallback to "there" if no user data
  const firstName = userData?.firstName || "there";

  if (isLoadingSales || isLoadingProducts || isLoadingExpenses || isLoadingInsights) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-4 space-y-4">
      {/* Welcome Message */}
      <div className="text-center py-2">
        <h2 className="text-xl font-bold">Good morning, {firstName}!</h2>
        <p className="text-muted-foreground text-sm">Here's your business overview</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Today's Sales</p>
                <p className="font-medium">{formatCurrency(todaysRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="font-medium">{formatCurrency(insights?.summary.revenue || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cash Out</p>
                <p className="font-medium">{formatCurrency(insights?.summary.expenses || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Inventory Alerts</p>
                <p className="font-medium">{lowStockCount} items</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Profit Snapshot */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <span>Overall Profit Snapshot</span>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
              AI Generated
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-xs text-muted-foreground">Net Profit</p>
              <p className={`text-xl font-bold ${((insights?.summary.profit || 0) >= 0) ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(insights?.summary.profit || 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Margin</p>
              <p className="text-sm font-medium">
                {insights?.summary.revenue ? Math.round((insights.summary.profit / insights.summary.revenue) * 100) : 0}%
              </p>
            </div>
          </div>
          <Progress value={insights?.summary.revenue ? (insights.summary.profit / insights.summary.revenue) * 100 : 0} className="h-1.5" />
          <p className="text-[11px] text-muted-foreground mt-2 italic">
             {insights?.insight || "Generating your business insight..."}
          </p>
        </CardContent>
      </Card>

      {/* Recently Sold Products */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4" />
            Recently Sold Products
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sales.slice(0, 5).map((sale, index) => (
            <div key={index} className="flex justify-between items-center">
              <div className="flex-1">
                <p className="text-sm font-medium">{sale.product?.name || 'Unknown Product'}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{sale.quantity} units sold</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-sm">{formatCurrency(sale.totalAmount)}</p>
              </div>
            </div>
          ))}
          {sales.length === 0 && <p className="text-xs text-center py-4 text-muted-foreground">No sales recorded yet</p>}
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-orange-600" />
            Low Stock Alert
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {products.filter(p => p.stockQuantity <= 10).map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <div className="flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {item.stockQuantity} left (min: 10)
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                  Low Stock
                </Badge>
              </div>
            </div>
          ))}
          {products.filter(p => p.stockQuantity <= 10).length === 0 && (
            <p className="text-xs text-center py-4 text-muted-foreground">All products are well stocked</p>
          )}
        </CardContent>
      </Card>

      {/* Business Growth Tips */}
      <Card className="border-green-100">
        <CardHeader
          className="pb-2 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setShowGrowthTips(!showGrowthTips)}
        >
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-green-600" />
              Business Growth Tips
            </div>
            {showGrowthTips ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </CardTitle>
        </CardHeader>
        {showGrowthTips && (
          <CardContent className="space-y-3">
            {insights?.tips.map((tip, index) => {
              return (
                <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">{tip.title}</h4>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1 h-4 ${
                          tip.impact === 'High'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : tip.impact === 'Medium'
                            ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                            : 'bg-blue-100 text-blue-700 border-blue-300'
                        }`}
                      >
                        {tip.impact} Impact
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{tip.tip}</p>
                  </div>
                </div>
              );
            })}
            {!insights?.tips && <p className="text-xs text-center py-2 text-muted-foreground">Generating tips...</p>}
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-[11px] text-green-800 text-center">
                💡 <strong>Pro Tip:</strong> Implement one recommendation at a time and track its impact on your sales.
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
