import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from '../components/ui/toast';
import { Coins, Shield, Zap, Star } from 'lucide-react';

const PACKAGES = [
  { usd: 5, ranks: 50, popular: false },
  { usd: 10, ranks: 100, popular: true },
  { usd: 25, ranks: 250, popular: false },
  { usd: 50, ranks: 500, popular: false },
  { usd: 100, ranks: 1000, popular: false },
];

export default function BuyRanks() {
  const { user, refreshUser } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const checkoutMutation = useMutation({
    mutationFn: (amountUsd: number) =>
      apiClient.post<{ url: string }>('/payments/create-checkout', { amountUsd }),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const handlePackageSelect = (pkg: typeof PACKAGES[0]) => {
    setSelectedPackage(pkg.usd);
    setCustomAmount('');
    checkoutMutation.mutate(pkg.usd);
  };

  const handleCustomPurchase = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < 5) {
      toast({ title: 'Minimum purchase is $5', variant: 'destructive' });
      return;
    }
    setSelectedPackage(amount);
    checkoutMutation.mutate(amount);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Buy Ranks</h1>
        <p className="text-gray-500 mt-2">Purchase Ranks to vote and create rankings</p>
        <div className="inline-flex items-center gap-2 mt-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm">
          <Coins className="w-4 h-4" />
          Your Balance: {user?.ranksBalance?.toFixed(2) || '0.00'} R
        </div>
      </div>

      <div className="text-center mb-8">
        <p className="text-lg text-gray-600">1 R = <strong>$0.10 USD</strong></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {PACKAGES.map((pkg) => (
          <Card
            key={pkg.usd}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              pkg.popular ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handlePackageSelect(pkg)}
          >
            <CardContent className="p-6 text-center relative">
              {pkg.popular && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-3 py-0.5 rounded-full">
                  Best Value
                </div>
              )}
              <Coins className={`w-10 h-10 mx-auto mb-3 ${pkg.popular ? 'text-primary' : 'text-gray-400'}`} />
              <p className="text-3xl font-bold text-gray-900">${pkg.usd}</p>
              <p className="text-lg font-semibold text-gray-600 mt-1">{pkg.ranks} R</p>
              <Button
                className="mt-4 w-full"
                variant={pkg.popular ? 'default' : 'outline'}
                disabled={checkoutMutation.isPending && selectedPackage === pkg.usd}
              >
                {checkoutMutation.isPending && selectedPackage === pkg.usd ? 'Loading...' : 'Buy'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Custom Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                min={5}
                step={1}
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setSelectedPackage(null); }}
                placeholder="Min $5"
                className="pl-7"
              />
            </div>
            <Button
              onClick={handleCustomPurchase}
              disabled={!customAmount || checkoutMutation.isPending}
            >
              Buy {customAmount ? `${Math.floor(parseFloat(customAmount) * 10)} R` : ''}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Minimum purchase: $5 (50 Ranks)</p>
        </CardContent>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="text-center p-4">
          <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900">Secure Payment</h3>
          <p className="text-sm text-gray-500">Processed securely through Stripe</p>
        </div>
        <div className="text-center p-4">
          <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900">Instant Credit</h3>
          <p className="text-sm text-gray-500">Ranks added to your balance immediately</p>
        </div>
        <div className="text-center p-4">
          <Star className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900">Use Anywhere</h3>
          <p className="text-sm text-gray-500">Spend Ranks on voting and creating rankings</p>
        </div>
      </div>
    </div>
  );
}
