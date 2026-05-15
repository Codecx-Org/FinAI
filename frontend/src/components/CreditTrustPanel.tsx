import React from 'react';
import { Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import type { CreditTrustPreview } from '../hooks/api/useCreditTrustPreview';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

type Props = {
  data: CreditTrustPreview | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

export function CreditTrustPanel({ data, isLoading, isError, onRetry }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">Loading trust preview…</CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4 flex flex-col gap-2">
          <p className="text-sm text-red-800">Could not load trust preview.</p>
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4" />
            Trust score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">{data.disclaimer}</p>
          <p className="text-sm font-semibold">{data.strings.headline}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{data.strings.summary}</p>
          <div className="text-center py-2">
            <p className={`text-4xl font-bold ${scoreColor(data.trustScore)}`}>{data.trustScore}</p>
            <p className="text-sm text-muted-foreground">{data.ratingLabel}</p>
          </div>
          <div className="space-y-3">
            {data.components.map((c) => (
              <div key={c.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className="font-semibold">{c.score}</span>
                </div>
                <Progress value={c.score} className="h-2" />
                <p className="text-[10px] text-muted-foreground mt-0.5">{c.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How weights work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.weightsExplained.map((w) => (
            <div key={w.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
              <p className="text-xs font-medium">{w.label}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{w.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Suggested next steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.actionableInsights.map((a, i) => (
            <div key={i} className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs">
              <p className="font-semibold text-blue-900">{a.title}</p>
              <p className="text-blue-800 mt-1 leading-snug">{a.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-base text-green-900">Illustrative loan ceiling</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-green-800 mb-3">
            Not a lender offer — derived from recent on-platform sales only.
          </p>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg bg-white/80 p-2">
              <p className="text-[10px] text-muted-foreground">Ceiling</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(data.illustrativeLoanCeiling)}</p>
            </div>
            <div className="rounded-lg bg-white/80 p-2">
              <p className="text-[10px] text-muted-foreground">Sales (90d)</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(data.signals.totalSales90d)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
