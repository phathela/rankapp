import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient, Category } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from '../components/ui/toast';
import { ChevronLeft, ChevronRight, Coins, Check } from 'lucide-react';

const STEPS = ['Category', 'Details', 'Period', 'Duration', 'Points', 'Preview'];

export default function CreateRanking() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [periodType, setPeriodType] = useState('Month');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [pointsPerRank, setPointsPerRank] = useState(20);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get<Category[]>('/categories'),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/rankings', {
        title,
        subcategoryId,
        periodType,
        periodStart,
        periodEnd,
        rankingDurationDays: durationDays,
        pointsPerRank,
      }),
    onSuccess: (data: any) => {
      toast({ title: 'Ranking created!', description: '10 Ranks have been deducted.', variant: 'success' });
      const rankingId = data.ranking?.id || data.id;
      navigate(`/ranking/${rankingId}`);
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const categories = categoriesData || [];
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const subcategories = selectedCategory?.subcategories || [];
  const canProceed = () => {
    switch (step) {
      case 0: return !!categoryId && !!subcategoryId;
      case 1: return title.trim().length >= 5;
      case 2: return !!periodStart && !!periodEnd;
      case 3: return durationDays >= 1;
      case 4: return pointsPerRank >= 1;
      case 5: return true;
      default: return false;
    }
  };

  const nextStep = () => {
    if (canProceed()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = () => {
    createMutation.mutate();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create a Ranking</h1>
        <p className="text-gray-500 mt-1">Cost: 10 Ranks to create a ranking</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              i <= step ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i <= step ? 'text-primary font-medium' : 'text-gray-400'}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-primary' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Step 0: Category Selection */}
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Select Category</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setCategoryId(cat.id); setSubcategoryId(''); }}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      categoryId === cat.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-sm">{cat.name}</p>
                  </button>
                ))}
              </div>

              {selectedCategory && (
                <div>
                  <h3 className="font-medium mb-3">Select Subcategory</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {subcategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setSubcategoryId(sub.id)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          subcategoryId === sub.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="text-sm font-medium">{sub.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Title & Description */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Ranking Details</h2>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Best Soccer Player in Premier League 2025"
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">Min 5 characters</p>
              </div>
              <div>
                <Label htmlFor="desc">Description (optional)</Label>
                <textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this ranking is about..."
                  className="w-full mt-1 px-3 py-2 border rounded-lg resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          )}

          {/* Step 2: Period */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Period of Being Best</h2>
              <p className="text-sm text-gray-500">What time period does this ranking cover?</p>
              <div className="flex gap-2">
                {['Month', 'Year', 'BetweenMonths', 'BetweenYears'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setPeriodType(type)}
                    className={`px-4 py-2 rounded-lg border text-sm ${
                      periodType === type ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200'
                    }`}
                  >
                    {type.replace(/([A-Z])/g, ' $1').trim()}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="mt-1" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Duration */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Ranking Duration</h2>
              <p className="text-sm text-gray-500">How long will voting be open?</p>
              <div>
                <Label>Duration (days)</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {[1, 7, 14, 30, 60, 90, 365].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDurationDays(d)}
                    className={`px-3 py-1.5 rounded-lg border text-sm ${
                      durationDays === d ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200'
                    }`}
                  >
                    {d === 1 ? '1 Day' : d === 7 ? '1 Week' : d === 30 ? '1 Month' : d === 365 ? '1 Year' : `${d} Days`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Points */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Points & Ranks</h2>
              <p className="text-sm text-gray-500">Set how many Ranks equal 1 point</p>
              <div>
                <Label>Points per Rank (Ranks per point)</Label>
                <Input
                  type="number"
                  min={1}
                  value={pointsPerRank}
                  onChange={(e) => setPointsPerRank(Number(e.target.value))}
                  className="mt-1"
                />
                <p className="text-sm text-gray-400 mt-2">
                  1 point = {pointsPerRank} Ranks · Max 10 points per voter = {pointsPerRank * 10} Ranks max per voter
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Preview */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Preview & Confirm</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between"><span className="text-gray-500">Title:</span><span className="font-medium">{title}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Category:</span><span>{selectedCategory?.name} &gt; {subcategories.find(s => s.id === subcategoryId)?.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Period:</span><span>{periodStart} to {periodEnd}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Duration:</span><span>{durationDays} days</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Points/Rank:</span><span>{pointsPerRank} R</span></div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold">Creation Cost:</span>
                  <span className="font-bold text-primary">10 R</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Your Balance:</span>
                  <span className={`font-medium ${(user?.ranksBalance || 0) >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                    {user?.ranksBalance?.toFixed(2) || '0.00'} R
                  </span>
                </div>
              </div>
              {(user?.ranksBalance || 0) < 10 && (
                <p className="text-sm text-red-600">Insufficient balance. Please buy more Ranks first.</p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-4 border-t">
            <Button variant="outline" onClick={prevStep} disabled={step === 0}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={nextStep} disabled={!canProceed()}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || (user?.ranksBalance || 0) < 10}
                className="flex items-center gap-2"
              >
                <Coins className="w-4 h-4" />
                {createMutation.isPending ? 'Creating...' : 'Pay 10 R & Create'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
