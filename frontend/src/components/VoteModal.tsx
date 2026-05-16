import { useState, useEffect } from 'react';
import { AlertCircle, Plus, Trash2, Coins } from 'lucide-react';
import { Ranking, apiClient } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

interface VoteModalProps {
  ranking: Ranking;
  isOpen: boolean;
  onClose: () => void;
  onVoteComplete: () => void;
}

export default function VoteModal({ ranking, isOpen, onClose, onVoteComplete }: VoteModalProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [points, setPoints] = useState(1);
  const [motivation, setMotivation] = useState('');
  const [proofLinks, setProofLinks] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPoints(1);
      setMotivation('');
      setProofLinks(['']);
      setError('');
    }
  }, [isOpen]);

  const totalCost = points * ranking.pointsPerRank;
  const hasBalance = user ? user.ranksBalance >= totalCost : false;
  const isValidMotivation = motivation.trim().length >= 20;
  const isValid = points >= 1 && points <= 10 && isValidMotivation && hasBalance;

  const addProofLink = () => {
    setProofLinks([...proofLinks, '']);
  };

  const removeProofLink = (index: number) => {
    setProofLinks(proofLinks.filter((_, i) => i !== index));
  };

  const updateProofLink = (index: number, value: string) => {
    const updated = [...proofLinks];
    updated[index] = value;
    setProofLinks(updated);
  };

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      await apiClient.post(`/rankings/${ranking.id}/vote`, {
        pointsVoted: points,
        motivationText: motivation.trim(),
        proofLinks: proofLinks.filter((l) => l.trim() !== ''),
      });

      toast({
        title: 'Vote submitted!',
        description: `You voted with ${points} point${points > 1 ? 's' : ''} in "${ranking.title}"`,
        variant: 'success',
      });

      await refreshUser();
      onVoteComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to submit vote',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cast Your Vote</DialogTitle>
          <DialogDescription>
            Vote in &ldquo;{ranking.title}&rdquo;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Balance Info */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm font-medium">Your Balance</span>
            <span className="flex items-center gap-1 text-sm font-semibold">
              <Coins className="h-4 w-4 text-primary" />
              {user?.ranksBalance.toFixed(2) || '0.00'} R
            </span>
          </div>

          {/* Points */}
          <div className="space-y-2">
            <Label>Points (1-10)</Label>
            <div className="flex items-center gap-3">
              <Input
                type="range"
                min={1}
                max={10}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-lg font-bold text-primary min-w-[2rem] text-center">
                {points}
              </span>
            </div>
          </div>

          {/* Motivation */}
          <div className="space-y-2">
            <Label htmlFor="motivation">
              Motivation <span className="text-muted-foreground">(min 20 characters)</span>
            </Label>
            <Textarea
              id="motivation"
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder="Why does this entry deserve to win?"
              rows={3}
            />
            <div className="flex justify-end">
              <span
                className={`text-xs ${
                  motivation.length >= 20 ? 'text-green-600' : 'text-muted-foreground'
                }`}
              >
                {motivation.length}/20 min
              </span>
            </div>
          </div>

          {/* Proof Links */}
          <div className="space-y-2">
            <Label>Proof Links (YouTube/Vimeo URLs)</Label>
            {proofLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={link}
                  onChange={(e) => updateProofLink(index, e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1"
                />
                {proofLinks.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProofLink(index)}
                    className="h-10 w-10 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addProofLink}
              className="mt-1"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Link
            </Button>
          </div>

          {/* Cost Summary */}
          <div className="p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Points: {points} x {ranking.pointsPerRank} R each</span>
              <span className="font-semibold">{totalCost.toFixed(2)} R</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-sm font-medium">Total Cost</span>
              <span className={`text-lg font-bold ${hasBalance ? 'text-primary' : 'text-destructive'}`}>
                {totalCost.toFixed(2)} R
              </span>
            </div>
            {!hasBalance && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                <span>Insufficient balance. You need {totalCost.toFixed(2)} R but have {user?.ranksBalance.toFixed(2) || '0.00'} R.</span>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
            {isSubmitting ? 'Submitting...' : `Vote with ${totalCost.toFixed(2)} R`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
