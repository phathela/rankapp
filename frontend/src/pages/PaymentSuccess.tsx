import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle, Coins, ArrowRight } from 'lucide-react';

export default function PaymentSuccess() {
  const { refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      refreshUser();
    }
  }, [sessionId, refreshUser]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Payment Successful!</CardTitle>
          <p className="text-gray-500 mt-2">
            Ranks have been added to your account.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-lg">
            <Coins className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold">Check your balance in the dashboard</span>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <Link to="/dashboard">
              <Button className="w-full">
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/rankings">
              <Button variant="outline" className="w-full">
                Browse Rankings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
