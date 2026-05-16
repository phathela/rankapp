import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient, Category } from '../api/client';
import { Card, CardContent } from '../components/ui/card';
import { Trophy, Download, ExternalLink, Search } from 'lucide-react';

export default function Winners() {
  const [categoryId, setCategoryId] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get<Category[]>('/categories'),
  });

  const { data: winners, isLoading } = useQuery({
    queryKey: ['winners', categoryId, year, month],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryId) params.append('categoryId', categoryId);
      if (year) params.append('year', year);
      if (month) params.append('month', month);
      return apiClient.get<any[]>(`/winners?${params.toString()}`);
    },
  });

  const categories = categoriesData || [];
  const winnerList = winners || [];

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
    { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
    { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Winners
        </h1>
        <p className="text-gray-500 mt-1">Browse past ranking winners and download certificates</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8 p-4 bg-white rounded-lg border">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Months</option>
          {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      {/* Winners Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : winnerList.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Trophy className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No winners found</h3>
            <p className="text-gray-500">Try adjusting your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {winnerList.map((winner: any) => (
            <Card key={winner.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-yellow-500 mb-3">
                  <Trophy className="w-5 h-5" />
                  <span className="text-sm font-medium text-gray-500">Winner</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{winner.title || 'Ranking'}</h3>
                <p className="text-2xl font-bold text-gray-900 mb-2">{winner.winnerEntityName}</p>
                <p className="text-sm text-gray-500 mb-4">
                  {winner.closedAt ? new Date(winner.closedAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  }) : ''}
                </p>
                <div className="flex flex-wrap gap-3">
                  {winner.winnerCertificateUrl && (
                    <a
                      href={`/api/winners/${winner.id}/certificate`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Download className="w-4 h-4" /> Certificate
                    </a>
                  )}
                  <Link
                    to={`/ranking/${winner.id}`}
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <ExternalLink className="w-4 h-4" /> View Ranking
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
