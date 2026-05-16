import { Outlet } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { ToastProvider, ToastViewport } from '@/components/ui/toast';

export default function Layout() {
  return (
    <ToastProvider>
      <div className="relative flex min-h-screen flex-col bg-grid-pattern">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <footer className="border-t bg-background">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg font-bold gradient-text">RankApp</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Rank anything. Anywhere. Anytime. Spend Ranks to create rankings and vote. Earn rewards.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3">Quick Links</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <a href="/rankings" className="hover:text-foreground transition-colors">
                      Browse Rankings
                    </a>
                  </li>
                  <li>
                    <a href="/winners" className="hover:text-foreground transition-colors">
                      Winners Gallery
                    </a>
                  </li>
                  <li>
                    <a href="/buy-ranks" className="hover:text-foreground transition-colors">
                      Buy Ranks
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3">Support</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <a href="mailto:support@rankapp.com" className="hover:text-foreground transition-colors">
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <span className="text-muted-foreground">FAQ</span>
                  </li>
                  <li>
                    <span className="text-muted-foreground">Terms of Service</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} RankApp. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
      <ToastViewport />
    </ToastProvider>
  );
}
