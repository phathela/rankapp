import { Link } from 'react-router-dom';
import { Clock, Users, Trophy, Coins, User as UserIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RankingCardData {
  id: string;
  title: string;
  description?: string;
  status: string;
  initiator?: { id: string; username: string };
  subcategory?: { id: string; name: string; slug: string; category?: { id: string; name: string; slug: string } };
  _count?: { votes: number; comments: number };
  pointsPerRank?: number;
  createdAt: string;
  totalVotesCollected?: number;
  winnerEntityName?: string;
  rankingDurationDays?: number;
}

interface RankingCardProps {
  ranking: RankingCardData;
}

function formatTimeAgo(createdAt: string, durationDays?: number): string {
  if (!createdAt) return '';
  const now = new Date();
  const start = new Date(createdAt);
  if (durationDays) {
    const end = new Date(start);
    end.setDate(end.getDate() + durationDays);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  }
  return '';
}

export default function RankingCard({ ranking }: RankingCardProps) {
  const statusStr = ranking.status?.toLowerCase() || '';
  const isCompleted = statusStr === 'completed';
  const isActive = statusStr === 'active';
  const votes = ranking._count?.votes || 0;
  const categoryName = ranking.subcategory?.category?.name || ranking.subcategory?.name || '';
  const subcategoryName = ranking.subcategory?.name || '';
  const timeLeft = formatTimeAgo(ranking.createdAt, ranking.rankingDurationDays);

  return (
    <Link to={`/ranking/${ranking.id}`}>
      <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/30 group">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {ranking.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1.5">
                {categoryName && <Badge variant="secondary" className="text-xs">{categoryName}</Badge>}
                {subcategoryName && <Badge variant="outline" className="text-xs">{subcategoryName}</Badge>}
              </div>
            </div>
            <Badge variant={isActive ? 'default' : isCompleted ? 'secondary' : 'outline'}>
              {isActive ? 'Active' : isCompleted ? 'Completed' : ranking.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {ranking.description || 'No description provided.'}
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>{votes} votes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{timeLeft || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5" />
              <span>{ranking.pointsPerRank || 20} pts/rank</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5" />
              <span>{ranking.totalVotesCollected || 0} total R</span>
            </div>
          </div>
          {isCompleted && ranking.winnerEntityName && (
            <div className="mt-3 pt-3 border-t flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-600">
                Winner: {ranking.winnerEntityName}
              </span>
            </div>
          )}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserIcon className="h-3 w-3" />
            <span>by {ranking.initiator?.username || 'Unknown'}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
