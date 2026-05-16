import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, getAuthToken } from '@/api/client';
import { Coins, LogIn, AlertCircle, CheckCircle2, Youtube, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoteDialogProps {
  rankingId: string;
  rankingTitle: string;
  pointsPerRank: number;
  variant?: 'default' | 'outline';
  className?: string;
  onVoteSuccess?: () => void;
}

export default function VoteDialog({
  rankingId,
  rankingTitle,
  pointsPerRank,
  variant = 'default',
  className,
  onVoteSuccess,
}: VoteDialogProps) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'check' | 'form' | 'success'>('check');

  // Form state
  const [pointsVoted, setPointsVoted] = useState(5);
  const [motivationText, setMotivationText] = useState('');
  const [proofLinks, setProofLinks] = useState<string[]>(['']);
  const [error, setError] = useState('');

  const hasEnoughCredits = user && user.ranksBalance >= pointsVoted * pointsPerRank;
  const ranksCost = pointsVoted * pointsPerRank;

  const voteMutation = useMutation({
    mutationFn: async () => {
      const validLinks = proofLinks.filter((l) => l.trim());
      return apiClient.post(`/rankings/${rankingId}/vote`, {
        pointsVoted,
        motivationText,
        proofLinks: validLinks,
      });
    },
    onSuccess: () => {
      setStep('success');
      queryClient.invalidateQueries({ queryKey: ['ranking', rankingId] });
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      onVoteSuccess?.();
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to submit vote');
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setTimeout(() => {
        setStep(isAuthenticated ? 'form' : 'check');
        setPointsVoted(5);
        setMotivationText('');
        setProofLinks(['']);
        setError('');
      }, 200);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    if (!isAuthenticated) {
      setStep('check');
    } else if (!hasEnoughCredits) {
      setStep('check');
    } else {
      setStep('form');
    }
  };

  const addProofLink = () => {
    if (proofLinks.length < 5) {
      setProofLinks([...proofLinks, '']);
    }
  };

  const updateProofLink = (index: number, value: string) => {
    const updated = [...proofLinks];
    updated[index] = value;
    setProofLinks(updated);
  };

  const removeProofLink = (index: number) => {
    if (proofLinks.length > 1) {
      setProofLinks(proofLinks.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!motivationText || motivationText.length < 20) {
      setError('Motivation text must be at least 20 characters');
      return;
    }

    const validLinks = proofLinks.filter((l) => l.trim());
    if (validLinks.length === 0) {
      setError('Please provide at least one proof link (YouTube or Vimeo)');
      return;
    }

    voteMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size="lg"
          className={cn(
            variant === 'default'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20'
              : '',
            className
          )}
          onClick={handleOpen}
        >
          Vote Now
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg border-slate-800 bg-slate-900 text-slate-100">
        {step === 'check' && !isAuthenticated && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-100">
                <LogIn className="h-5 w-5 text-primary" />
                Login Required
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                You need to be logged in to vote on rankings.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-slate-600 mx-auto" />
              <p className="text-slate-300">Please log in or create an account to vote on "{rankingTitle}"</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => { setOpen(false); navigate('/login'); }}>
                  Log In
                </Button>
                <Button onClick={() => { setOpen(false); navigate('/register'); }}>
                  Register
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'check' && isAuthenticated && !hasEnoughCredits && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-100">
                <Coins className="h-5 w-5 text-yellow-500" />
                Insufficient Ranks
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                You don't have enough Ranks to cast this vote.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-2xl font-bold text-slate-300">
                <Coins className="h-6 w-6 text-yellow-500" />
                {user?.ranksBalance.toFixed(0)} R
              </div>
              <p className="text-slate-400">
                Voting costs <span className="text-emerald-400 font-semibold">{ranksCost} Ranks</span> but you only have{' '}
                <span className="text-slate-300 font-semibold">{user?.ranksBalance.toFixed(0)} Ranks</span>.
              </p>
              <p className="text-sm text-slate-500">
                Buy more Ranks to participate in rankings and earn rewards.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => { setOpen(false); navigate('/buy-ranks'); }}>
                  <Coins className="mr-2 h-4 w-4" />
                  Buy Ranks
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'form' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-slate-100">Cast Your Vote</DialogTitle>
              <DialogDescription className="text-slate-400">
                Vote on "{rankingTitle}"
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-slate-300">Your Balance</Label>
                <div className="flex items-center gap-2 mt-1 p-2 bg-slate-800/50 rounded-md border border-slate-700">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span className="text-slate-200 font-semibold">{user?.ranksBalance.toFixed(0)} R</span>
                  <span className="text-slate-500 mx-2">|</span>
                  <span className="text-sm text-slate-400">Cost: <span className="text-emerald-400 font-semibold">{ranksCost} R</span></span>
                </div>
              </div>

              <div>
                <Label htmlFor="points" className="text-slate-300">Points (1-10)</Label>
                <Input
                  id="points"
                  type="number"
                  min={1}
                  max={10}
                  value={pointsVoted}
                  onChange={(e) => setPointsVoted(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="bg-slate-800 border-slate-700 text-slate-200 mt-1"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Each point costs {pointsPerRank} Ranks. Total: {ranksCost} Ranks
                </p>
              </div>

              <div>
                <Label htmlFor="motivation" className="text-slate-300">
                  Why do you think this should win? <span className="text-slate-500">(min 20 chars)</span>
                </Label>
                <Textarea
                  id="motivation"
                  value={motivationText}
                  onChange={(e) => setMotivationText(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-200 mt-1 min-h-[80px]"
                  placeholder="Explain why you're voting for this..."
                  required
                />
              </div>

              <div>
                <Label className="text-slate-300">Proof Links</Label>
                <p className="text-xs text-slate-500 mb-2">Add YouTube or Vimeo URLs as proof</p>
                {proofLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-2 mt-1">
                    <Youtube className="h-4 w-4 text-red-500 shrink-0" />
                    <Input
                      value={link}
                      onChange={(e) => updateProofLink(index, e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="bg-slate-800 border-slate-700 text-slate-200 flex-1"
                    />
                    {proofLinks.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProofLink(index)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        &times;
                      </Button>
                    )}
                  </div>
                ))}
                {proofLinks.length < 5 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addProofLink}
                    className="mt-2 text-slate-400 hover:text-slate-300"
                  >
                    + Add another link
                  </Button>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-800 rounded-md text-red-300 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={voteMutation.isPending}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
              >
                {voteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Vote...
                  </>
                ) : (
                  <>
                    <Coins className="mr-2 h-4 w-4" />
                    Vote — {ranksCost} Ranks
                  </>
                )}
              </Button>
            </form>
          </>
        )}

        {step === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                Vote Submitted!
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Your vote has been recorded successfully.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
              <p className="text-slate-300">
                You spent <span className="text-emerald-400 font-semibold">{ranksCost} Ranks</span> on your vote.
              </p>
              <Button
                onClick={() => setOpen(false)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
              >
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
