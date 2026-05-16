import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import VoteModal from '../components/VoteModal';
import ShareButtons from '../components/ShareButtons';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { toast } from '../components/ui/toast';
import { ThumbsUp, Trophy, Clock, Users, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';

interface LeaderboardEntry {
  userId: string;
  username: string;
  pointsVoted: number;
  ranksSpent: number;
  motivationText: string;
  createdAt: string;
}

interface RankingComment {
  id: string;
  userId: string;
  username: string;
  commentText: string;
  createdAt: string;
  _count?: { likes: number };
}

export default function RankingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [expandedMotivations, setExpandedMotivations] = useState<Set<string>>(new Set());

  const { data: ranking, isLoading, error } = useQuery({
    queryKey: ['ranking', id],
    queryFn: () => apiClient.get<any>(`/rankings/${id}`),
    enabled: !!id,
  });

  const closeRankingMutation = useMutation({
    mutationFn: () => apiClient.post(`/rankings/${id}/close`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ranking', id] });
      toast({ title: 'Ranking closed!', description: 'Winner has been announced.', variant: 'success' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const commentMutation = useMutation({
    mutationFn: (text: string) => apiClient.post(`/rankings/${id}/comments`, { commentText: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ranking', id] });
      setCommentText('');
      toast({ title: 'Comment added!', variant: 'success' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const likeCommentMutation = useMutation({
    mutationFn: (commentId: string) => apiClient.post(`/comments/${commentId}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ranking', id] }),
  });

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await commentMutation.mutateAsync(commentText);
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || '';
    const variants: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      draft: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-gray-100 text-gray-800',
    };
    return variants[s] || 'bg-gray-100 text-gray-800';
  };

  const toggleMotivation = (key: string) => {
    setExpandedMotivations(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !ranking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Ranking not found</h2>
        <p className="mt-2 text-gray-600">This ranking doesn't exist or has been removed.</p>
        <Link to="/rankings" className="mt-4 inline-block text-primary hover:underline">Browse Rankings</Link>
      </div>
    );
  }

  const isInitiator = user?.id === ranking.initiatorId;
  const statusStr = ranking.status?.toLowerCase() || '';
  const canVote = statusStr === 'active' && !ranking.userVote;
  const leaderboard: LeaderboardEntry[] = ranking.leaderboard || [];
  const comments: RankingComment[] = (ranking.comments || []).map((c: any) => ({
    ...c,
    username: c.user?.username || 'Unknown',
    _count: c._count || { likes: 0 },
  }));
  const userVote = ranking.userVote;
  const hasVoted = !!userVote;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusBadge(ranking.status)}`}>
            {statusStr}
          </span>
          <Badge variant="outline">{ranking.subcategory?.name || ranking.subcategory?.category?.name || 'General'}</Badge>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{ranking.title}</h1>
        {ranking.description && (
          <p className="text-lg text-gray-600 mb-4">{ranking.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1"><Users className="w-4 h-4" /> by {ranking.initiator?.username || 'Anonymous'}</span>
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {ranking.periodStart && new Date(ranking.periodStart).toLocaleDateString()} - {ranking.periodEnd && new Date(ranking.periodEnd).toLocaleDateString()}</span>
          <span className="flex items-center gap-1"><BarChart3 className="w-4 h-4" /> {ranking.voteCount || leaderboard.length} votes</span>
          {ranking.winnerEntityName && (
            <span className="flex items-center gap-1 text-yellow-600"><Trophy className="w-4 h-4" /> Winner: {ranking.winnerEntityName}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Leaderboard */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No votes yet. Be the first to vote!</p>
              ) : (
                <div className="space-y-4">
                  {leaderboard.map((entry, index) => {
                    const key = entry.userId + '-' + index;
                    const isExpanded = expandedMotivations.has(key);
                    return (
                      <div key={key} className={`p-4 rounded-lg ${index === 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-400 text-yellow-900' : index === 1 ? 'bg-gray-300 text-gray-700' : index === 2 ? 'bg-orange-300 text-orange-800' : 'bg-gray-200 text-gray-600'}`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{entry.username}</p>
                              <p className="text-sm text-gray-500">{entry.pointsVoted} points</p>
                            </div>
                          </div>
                        </div>
                        {entry.motivationText && (
                          <div className="mt-2 ml-11">
                            <p className="text-gray-700 text-sm">
                              {isExpanded || entry.motivationText.length <= 100
                                ? entry.motivationText
                                : `${entry.motivationText.substring(0, 100)}...`}
                            </p>
                            {entry.motivationText.length > 100 && (
                              <button
                                onClick={() => toggleMotivation(key)}
                                className="text-primary text-xs flex items-center gap-1 mt-1 hover:underline"
                              >
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                {isExpanded ? 'Show less' : 'Read more'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Comments ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                {comments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No comments yet.</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                        {comment.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{comment.username}</span>
                          <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-700 mt-1">{comment.commentText}</p>
                        <button
                          onClick={() => likeCommentMutation.mutate(comment.id)}
                          className="flex items-center gap-1 text-gray-400 hover:text-primary text-xs mt-1"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          {comment._count?.likes || 0}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {hasVoted && (
                <form onSubmit={handleComment} className="border-t pt-4">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 h-20"
                  />
                  <div className="flex justify-end mt-2">
                    <Button type="submit" size="sm" disabled={!commentText.trim() || commentMutation.isPending}>
                      Post Comment
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              {canVote && (
                <Button className="w-full mb-3" onClick={() => setVoteModalOpen(true)}>
                  Vote Now
                </Button>
              )}
              {hasVoted && (
                <Badge className="w-full justify-center mb-3 py-2" variant="secondary">
                  You voted ({userVote.pointsVoted} points)
                </Badge>
              )}
              {isInitiator && statusStr === 'active' && (
                <Button
                  variant="outline"
                  className="w-full mb-3"
                  onClick={() => {
                    if (window.confirm('Close this ranking? This will calculate the winner and cannot be undone.')) {
                      closeRankingMutation.mutate();
                    }
                  }}
                  disabled={closeRankingMutation.isPending}
                >
                  Close Ranking
                </Button>
              )}
              <Separator className="my-3" />
              <p className="text-sm text-gray-500 mb-2">Share this ranking</p>
              <ShareButtons url={window.location.href} title={`Vote on "${ranking.title}" on RankApp!`} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ranking Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Points per rank</span>
                <span className="font-medium">{ranking.pointsPerRank} R</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total votes</span>
                <span className="font-medium">{leaderboard.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`font-medium capitalize ${getStatusBadge(ranking.status)} px-2 py-0.5 rounded`}>
                  {statusStr}
                </span>
              </div>
              {ranking.winnerEntityName && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Winner</span>
                  <span className="font-medium text-yellow-600">{ranking.winnerEntityName}</span>
                </div>
              )}
              {ranking.winnerCertificateUrl && (
                <div className="pt-2">
                  <a
                    href={ranking.winnerCertificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-xs hover:underline"
                  >
                    Download Certificate
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {leaderboard.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top Voters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {leaderboard.slice(0, 5).map((entry, i) => (
                  <div key={entry.userId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-primary/10 text-primary' : 'text-gray-400'}`}>
                        {i + 1}
                      </span>
                      <span className="text-gray-700">{entry.username}</span>
                    </div>
                    <span className="font-medium">{entry.pointsVoted} pts</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <VoteModal
        ranking={{ ...ranking, pointsPerRank: ranking.pointsPerRank || 20 }}
        isOpen={voteModalOpen}
        onClose={() => setVoteModalOpen(false)}
        onVoteComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['ranking', id] });
        }}
      />
    </div>
  );
}
