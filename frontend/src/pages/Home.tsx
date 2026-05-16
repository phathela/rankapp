import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Trophy,
  ArrowRight,
  Sparkles,
  LayoutGrid,
  Music,
  Gamepad2,
  BookOpen,
  Film,
  Utensils,
  Briefcase,
  Palette,
  ChevronRight,
  Loader2,
  AlertCircle,
  Coins,
  Users,
  Clock,
  Flame,
  Star,
} from 'lucide-react';
import { apiClient, Ranking, Category } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RankingCard from '@/components/RankingCard';
import VoteDialog from '@/components/VoteDialog';

const categoryIcons: Record<string, React.ReactNode> = {
  music: <Music className="h-6 w-6" />,
  gaming: <Gamepad2 className="h-6 w-6" />,
  education: <BookOpen className="h-6 w-6" />,
  entertainment: <Film className="h-6 w-6" />,
  food: <Utensils className="h-6 w-6" />,
  business: <Briefcase className="h-6 w-6" />,
  art: <Palette className="h-6 w-6" />,
  other: <LayoutGrid className="h-6 w-6" />,
};

function getCategoryIcon(category: Category) {
  if (category.icon && categoryIcons[category.icon]) {
    return categoryIcons[category.icon];
  }
  return <LayoutGrid className="h-6 w-6" />;
}

interface FeaturedRanking {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  totalEarnedUsd: number;
  totalVotes: number;
  winner: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
}

const FEATURED_RANKINGS: FeaturedRanking[] = [
  {
    id: 'featured-song',
    title: 'Global Song of the Year',
    category: 'Music',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=500&fit=crop',
    totalEarnedUsd: 12450,
    totalVotes: 2847,
    winner: 'Blinding Lights — The Weeknd',
    description: 'The biggest music ranking of the year with thousands of votes cast worldwide.',
    gradientFrom: 'from-purple-600',
    gradientTo: 'to-pink-600',
  },
  {
    id: 'featured-car',
    title: 'Global Car of the Year',
    category: 'Cars',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=500&fit=crop',
    totalEarnedUsd: 8920,
    totalVotes: 1956,
    winner: 'Tesla Cybertruck',
    description: 'Automotive enthusiasts voted for the most innovative and stylish car of the year.',
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-cyan-600',
  },
  {
    id: 'featured-football',
    title: 'World Footballer of the Year',
    category: 'Sports',
    imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=500&fit=crop',
    totalEarnedUsd: 15300,
    totalVotes: 3412,
    winner: 'Erling Haaland',
    description: 'The world\'s best footballer crowned by fan votes from across the globe.',
    gradientFrom: 'from-emerald-600',
    gradientTo: 'to-teal-600',
  },
];

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Home() {
  const {
    data: trending,
    isLoading: trendingLoading,
    error: trendingError,
  } = useQuery({
    queryKey: ['rankings', 'trending'],
    queryFn: () => apiClient.get<Ranking[]>('/rankings/trending'),
  });

  const {
    data: activeRankingsRaw,
    isLoading: activeLoading,
  } = useQuery({
    queryKey: ['rankings', 'active'],
    queryFn: () => apiClient.get<any>('/rankings?status=Active&limit=5'),
  });
  const activeRankings: Ranking[] = activeRankingsRaw?.rankings || (Array.isArray(activeRankingsRaw) ? activeRankingsRaw : []);

  const {
    data: recentWinnersRaw,
    isLoading: winnersLoading,
  } = useQuery({
    queryKey: ['rankings', 'recent-winners'],
    queryFn: () => apiClient.get<any>('/rankings?status=Completed&limit=4'),
  });
  const recentWinners = recentWinnersRaw?.rankings || (Array.isArray(recentWinnersRaw) ? recentWinnersRaw : []);

  const {
    data: categories,
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get<Category[]>('/categories'),
  });

  return (
    <div>
      {/* ─── Dark Hero Section ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Glow orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-700 bg-slate-800/50 mb-6">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">The Ultimate Ranking Platform</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-slate-100">
              Rank Anything.
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-400 bg-clip-text text-transparent">
                Anywhere. Anytime.
              </span>
            </h1>
            <p className="mt-6 text-lg text-slate-400 max-w-2xl">
              Spend Ranks to create rankings and vote. Earn rewards when your rankings
              generate engagement. The more votes, the more you earn.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link to="/rankings">
                <Button size="lg" className="text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/20 px-8">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Start Ranking
                </Button>
              </Link>
              <Link to="/create-ranking">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white px-8"
                >
                  Create Ranking
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Stats row */}
            <div className="mt-16 grid grid-cols-3 gap-8 sm:gap-16">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-slate-100">8</div>
                <div className="text-xs sm:text-sm text-slate-500 mt-1">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-slate-100">30+</div>
                <div className="text-xs sm:text-sm text-slate-500 mt-1">Topics</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-slate-100">$0.10</div>
                <div className="text-xs sm:text-sm text-slate-500 mt-1">Per Rank</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
      </section>

      {/* ─── Featured Rankings: Hall of Fame ─── */}
      <section className="py-20 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-medium mb-4">
              <Trophy className="h-4 w-4" />
              Hall of Fame
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-100">Top Earning Rankings</h2>
            <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
              These rankings generated the most revenue through community votes. The more engagement, the higher the rewards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {FEATURED_RANKINGS.map((featured) => (
              <div
                key={featured.id}
                className="group relative rounded-2xl overflow-hidden border border-slate-800 hover:border-slate-700 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5"
              >
                {/* Background image */}
                <div className="relative h-72 sm:h-80 overflow-hidden">
                  <img
                    src={featured.imageUrl}
                    alt={featured.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

                  {/* Category badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-slate-900/80 text-slate-200 border-slate-700 backdrop-blur-sm">
                      {featured.category}
                    </Badge>
                  </div>

                  {/* Earnings badge */}
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-sm">
                      <Coins className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-400">{formatUsd(featured.totalEarnedUsd)}</span>
                    </div>
                  </div>

                  {/* Bottom content (on image) */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-xl font-bold text-white mb-1">{featured.title}</h3>
                    <p className="text-sm text-slate-300 line-clamp-1">{featured.description}</p>
                  </div>
                </div>

                {/* Stats bar below image */}
                <div className="p-4 bg-slate-900/80 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {featured.totalVotes.toLocaleString()} votes
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                      {featured.winner}
                    </span>
                  </div>
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${featured.gradientFrom} ${featured.gradientTo}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Live Rankings ─── */}
      <section className="py-20 bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live Now
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-100">Active Rankings</h2>
            <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
              What do you think of these rankings? Vote or Initiate your own Ranking.
            </p>
          </div>

          {activeLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activeRankings && activeRankings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {activeRankings.map((ranking) => (
                <div
                  key={ranking.id}
                  className="relative group bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5"
                >
                  {/* Top accent bar */}
                  <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                          <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Live</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                          {ranking.title}
                        </h3>
                        {ranking.description && (
                          <p className="text-sm text-slate-400 mt-1 line-clamp-2">{ranking.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-5 text-sm">
                      <div className="text-center p-2 rounded-lg bg-slate-800/80">
                        <div className="flex items-center justify-center gap-1 text-slate-300 font-semibold">
                          <Users className="h-3.5 w-3.5 text-blue-400" />
                          {ranking._count?.votes || 0}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">Votes</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-800/80">
                        <div className="flex items-center justify-center gap-1 text-slate-300 font-semibold">
                          <Coins className="h-3.5 w-3.5 text-yellow-500" />
                          {ranking.totalVotesCollected?.toFixed(0) || '0'} R
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">Pool</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-800/80">
                        <div className="flex items-center justify-center gap-1 text-slate-300 font-semibold">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {ranking.rankingDurationDays || '—'}d
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">Duration</div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Link to={`/ranking/${ranking.id}`} className="flex-1">
                        <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                          View Details
                        </Button>
                      </Link>
                      <VoteDialog
                        rankingId={ranking.id}
                        rankingTitle={ranking.title}
                        pointsPerRank={ranking.pointsPerRank || 20}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <Card className="p-10 text-center bg-slate-800/50 border-slate-700">
                <Flame className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">No Active Rankings Yet</h3>
                <p className="text-slate-400 mb-6">Be the first to create a ranking and start the competition!</p>
                <Link to="/create-ranking">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white">
                    <Star className="mr-2 h-4 w-4" />
                    Create a Ranking
                  </Button>
                </Link>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* ─── Trending Rankings ─── */}
      <section className="py-20 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Trending Rankings</h2>
              <p className="text-slate-400 mt-1">Most active rankings right now</p>
            </div>
            <Link to="/rankings">
              <Button variant="ghost" className="gap-1 text-slate-400 hover:text-slate-200">
                View all
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {trendingLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : trendingError ? (
            <Card className="p-8 text-center bg-slate-900 border-slate-800">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-slate-400">Failed to load trending rankings</p>
            </Card>
          ) : trending && trending.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {trending.slice(0, 4).map((ranking: Ranking) => (
                <RankingCard key={ranking.id} ranking={ranking} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center bg-slate-900 border-slate-800">
              <TrendingUp className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400">No trending rankings yet</p>
              <Link to="/create-ranking">
                <Button variant="outline" className="mt-4 border-slate-700 text-slate-300 hover:bg-slate-800">
                  Be the first to create one
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </section>

      {/* ─── Recent Winners ─── */}
      {recentWinners && recentWinners.length > 0 && (
        <section className="py-20 bg-slate-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">Recent Winners</h2>
                <p className="text-slate-400 mt-1">Recently completed rankings</p>
              </div>
              <Link to="/winners">
                <Button variant="ghost" className="gap-1 text-slate-400 hover:text-slate-200">
                  View all
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentWinners.slice(0, 4).map((ranking: Ranking) => (
                <RankingCard key={ranking.id} ranking={ranking} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Categories ─── */}
      <section className="py-20 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-100">Browse by Category</h2>
            <p className="text-slate-400 mt-1">Find rankings in your area of interest</p>
          </div>

          {categoriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {categories.map((category) => (
                <Link key={category.id} to={`/rankings?category=${category.id}`}>
                  <Card className="group hover:border-primary/50 transition-all hover:shadow-md hover:shadow-blue-500/5 cursor-pointer bg-slate-900 border-slate-800">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="text-primary mb-3 group-hover:scale-110 transition-transform">
                        {getCategoryIcon(category)}
                      </div>
                      <h3 className="font-medium text-sm text-slate-200">{category.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {category.subcategories?.length || 0} topics
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center bg-slate-900 border-slate-800">
              <LayoutGrid className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400">No categories available yet</p>
            </Card>
          )}
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-slate-800/50 p-12 text-center">
            {/* Glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />

            <div className="relative">
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-slate-100 mb-4">Ready to Start Ranking?</h2>
              <p className="text-slate-400 max-w-lg mx-auto mb-8">
                Create your first ranking, invite voters, and earn rewards. The best
                rankings rise to the top.
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/create-ranking">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/20"
                  >
                    Create a Ranking
                  </Button>
                </Link>
                <Link to="/buy-ranks">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <Coins className="mr-2 h-4 w-4" />
                    Buy Ranks
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
