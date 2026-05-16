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
} from 'lucide-react';
import { apiClient, Ranking, Category } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RankingCard from '@/components/RankingCard';

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
      {/* Hero Section */}
      <section className="gradient-hero text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-yellow-300" />
              <span className="text-sm font-medium text-white/80">The Ultimate Ranking Platform</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Rank Anything.
              <br />
              <span className="text-yellow-300">Anywhere. Anytime.</span>
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-xl">
              Spend Ranks to create rankings and vote. Earn rewards when your rankings
              generate engagement. The more votes, the more you earn.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link to="/rankings">
                <Button size="lg" variant="secondary" className="text-base">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Start Ranking
                </Button>
              </Link>
              <Link to="/create-ranking">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base border-white/30 text-white hover:bg-white/10"
                >
                  Create Ranking
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Rankings */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Trending Rankings</h2>
              <p className="text-muted-foreground mt-1">Most active rankings right now</p>
            </div>
            <Link to="/rankings">
              <Button variant="ghost" className="gap-1">
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
            <Card className="p-8 text-center">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-muted-foreground">Failed to load trending rankings</p>
            </Card>
          ) : trending && trending.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {trending.slice(0, 4).map((ranking) => (
                <RankingCard key={ranking.id} ranking={ranking} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No trending rankings yet</p>
              <Link to="/create-ranking">
                <Button variant="outline" className="mt-4">
                  Be the first to create one
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </section>

      {/* Recent Winners */}
      {recentWinners && recentWinners.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">Recent Winners</h2>
                <p className="text-muted-foreground mt-1">Recently completed rankings</p>
              </div>
              <Link to="/winners">
                <Button variant="ghost" className="gap-1">
                  View all
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentWinners.slice(0, 4).map((ranking) => (
                <RankingCard key={ranking.id} ranking={ranking} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Browse by Category</h2>
            <p className="text-muted-foreground mt-1">Find rankings in your area of interest</p>
          </div>

          {categoriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {categories.map((category) => (
                <Link key={category.id} to={`/rankings?category=${category.id}`}>
                  <Card className="group hover:border-primary/50 transition-all hover:shadow-md cursor-pointer">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="text-primary mb-3 group-hover:scale-110 transition-transform">
                        {getCategoryIcon(category)}
                      </div>
                      <h3 className="font-medium text-sm">{category.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {category.subcategories?.length || 0} topics
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <LayoutGrid className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No categories available yet</p>
            </Card>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="gradient-hero text-white border-0">
            <CardContent className="flex flex-col items-center text-center p-12">
              <Trophy className="h-12 w-12 text-yellow-300 mb-4" />
              <h2 className="text-3xl font-bold mb-4">Ready to Start Ranking?</h2>
              <p className="text-white/80 max-w-lg mb-8">
                Create your first ranking, invite voters, and earn rewards. The best
                rankings rise to the top.
              </p>
              <div className="flex gap-4">
                <Link to="/create-ranking">
                  <Button size="lg" variant="secondary">
                    Create a Ranking
                  </Button>
                </Link>
                <Link to="/buy-ranks">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    Buy Ranks
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
