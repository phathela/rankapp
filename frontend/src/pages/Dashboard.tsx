import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Coins, TrendingUp, Trophy, Clock, BarChart3, PlusCircle } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  const { data: rankingsData, isLoading: rankingsLoading } = useQuery({
    queryKey: ['my-rankings', user?.id],
    queryFn: () => apiClient.get<any>(`/rankings?initiatorId=${user?.id}`),
    enabled: !!user?.id,
  });

  const { data: transactionsData, isLoading: txLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => apiClient.get<any>('/payments/transactions'),
  });

  const listResponse = rankingsData as { rankings?: any[] } | undefined;
  const myRankings = listResponse?.rankings || [];
  const txResponse = transactionsData as { data?: any[] } | { transactions?: any[] } | undefined;
  const transactions = (txResponse as any)?.data || (txResponse as any)?.transactions || [];

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.username}</p>
        </div>
        <Link to="/buy-ranks">
          <Button className="flex items-center gap-2">
            <Coins className="w-4 h-4" />
            Buy Ranks
          </Button>
        </Link>
      </div>

      {/* Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <p className="text-indigo-100 text-sm">Your Balance</p>
            <p className="text-4xl font-bold mt-2">{user?.ranksBalance?.toFixed(2) || '0.00'} <span className="text-xl">R</span></p>
            <p className="text-indigo-100 text-xs mt-1">1 R = $0.10 USD</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">My Rankings</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{myRankings.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Trophy className="w-4 h-4" />
              <span className="text-sm">Active Rankings</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {myRankings.filter((r: any) => r.status?.toLowerCase() === 'active').length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rankings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rankings">
            <BarChart3 className="w-4 h-4 mr-2" />
            My Rankings
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <Clock className="w-4 h-4 mr-2" />
            Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rankings">
          {rankingsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : myRankings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <PlusCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No rankings yet</h3>
                <p className="text-gray-500 mb-4">Create your first ranking to get started.</p>
                <Link to="/create-ranking">
                  <Button>Create Ranking</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myRankings.map((ranking: any) => (
                <Link key={ranking.id} to={`/ranking/${ranking.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{ranking.title}</h3>
                          <Badge className={getStatusBadge(ranking.status)}>{ranking.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {ranking._count?.votes || 0} votes ·
                          {ranking.subcategory?.name || 'General'} ·
                          Created {new Date(ranking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium text-gray-900">{ranking.totalVotesCollected || 0} R</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="transactions">
          {txLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions</h3>
                <p className="text-gray-500">Your transaction history will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx: any) => (
                <Card key={tx.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{tx.description || tx.type || 'Transaction'}</p>
                      <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`font-semibold ${tx.amountRanks > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amountRanks > 0 ? '+' : ''}{tx.amountRanks} R
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
