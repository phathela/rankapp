import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, AlertCircle, Inbox } from 'lucide-react';
import { apiClient, Category } from '@/api/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RankingCard from '@/components/RankingCard';

const PAGE_SIZE = 12;

export default function Rankings() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const params = new URLSearchParams();
  if (debouncedSearch) params.append('search', debouncedSearch);
  if (categoryFilter !== 'all') params.append('categoryId', categoryFilter);
  if (statusFilter !== 'all') params.append('status', statusFilter);
  params.append('page', page.toString());
  params.append('limit', PAGE_SIZE.toString());

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['rankings', debouncedSearch, categoryFilter, statusFilter, page],
    queryFn: () => apiClient.get<any>(`/rankings?${params.toString()}`),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get<Category[]>('/categories'),
  });

  const responseData = data as { rankings?: any[]; pagination?: { totalCount: number; totalPages: number; page: number } } | undefined;
  const rankings = responseData?.rankings || [];
  const pagination = responseData?.pagination;
  const totalPages = pagination?.totalPages || 1;
  const total = pagination?.totalCount || 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Browse Rankings</h1>
        <p className="text-muted-foreground mt-1">
          Explore rankings created by the community
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rankings..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={categoryFilter} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Tabs */}
      <Tabs
        value={statusFilter}
        onValueChange={handleStatusChange}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading rankings...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <p className="text-lg font-medium mb-2">Failed to load rankings</p>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'Something went wrong'}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && rankings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Inbox className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-1">No rankings found</p>
          <p className="text-muted-foreground mb-4">
            {debouncedSearch || categoryFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No rankings have been created yet'}
          </p>
          <Button variant="outline" onClick={() => window.location.href = '/create-ranking'}>
            Create a Ranking
          </Button>
        </div>
      )}

      {/* Rankings Grid */}
      {!isLoading && !error && rankings.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rankings.map((ranking) => (
              <RankingCard key={ranking.id} ranking={ranking} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-muted-foreground">...</span>
                    )}
                    <Button
                      variant={page === p ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPage(p)}
                      className="min-w-[2rem]"
                    >
                      {p}
                    </Button>
                  </span>
                ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-4">
            Showing {rankings.length} of {total} rankings
          </p>
        </>
      )}
    </div>
  );
}
