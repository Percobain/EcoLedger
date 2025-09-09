import { Link, useLocation } from 'react-router-dom';
import { Leaf, TreePine, Building2, Vote, FileText, Users, Menu, X, Wallet, LogOut } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import NBButton from './NBButton';
import React from 'react';
import { cn } from '../lib/utils';

const Layout = ({ children }) => {
  const location = useLocation();
  const { account, isConnected, isConnecting, connect, disconnect } = useWeb3();
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  const navItems = [
    { path: '/ngo', label: 'NGO', icon: TreePine },
    { path: '/verification', label: 'Verification', icon: FileText },
    { path: '/csr', label: 'CSR', icon: Building2 },
    { path: '/reporting', label: 'Reporting', icon: Users },
    { path: '/dao', label: 'DAO', icon: Vote },
  ];

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleWalletAction = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
    setMenuState(false); // Close mobile menu after action
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header>
        <nav
          data-state={menuState && 'active'}
          className="fixed z-20 w-full px-2"
        >
          <div className={cn(
            'mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12',
            isScrolled && 'max-w-4xl rounded-2xl lg:px-5 backdrop-blur-2xl supports-[backdrop-filter]:saturate-150 bg-white/40 dark:bg-white/10 ring-1 ring-white/60 dark:ring-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
          )}>
            <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
              <div className="flex w-full justify-between lg:w-auto">
                <Link
                  to="/"
                  className="flex items-center gap-2 text-xl font-display font-bold hover:opacity-80 transition-opacity"
                >
                  <img
                    src="/peakcock.png"
                    alt="EcoLedger Logo"
                    className="h-7 w-7"
                    onError={(e) => {
                      // Fallback to Leaf icon if image fails to load
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <Leaf className="text-nb-accent h-7 w-7" style={{ display: 'none' }} />
                  <span className="text-nb-ink">EcoLedger</span>
                </Link>

                <button
                  onClick={() => setMenuState(!menuState)}
                  aria-label={menuState ? 'Close Menu' : 'Open Menu'}
                  className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
                >
                  <Menu className={cn(
                    "m-auto size-6 duration-200 transition-all",
                    menuState && "rotate-180 scale-0 opacity-0"
                  )} />
                  <X className={cn(
                    "absolute inset-0 m-auto size-6 duration-200 transition-all",
                    menuState ? "rotate-0 scale-100 opacity-100" : "-rotate-180 scale-0 opacity-0"
                  )} />
                </button>
              </div>

              <div className={cn(
                "mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl p-6 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:p-0",
                // Glass morphism on mobile dropdown, and subtle on desktop when scrolled
                menuState
                  ? "bg-white/55 dark:bg-white/10 backdrop-blur-xl supports-[backdrop-filter]:saturate-150 ring-1 ring-white/60 dark:ring-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
                  : "lg:bg-transparent lg:ring-0",
                menuState && "block lg:flex"
              )}>
                {/* Navigation Items */}
                <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit lg:mr-6">
                  {navItems.map(({ path, label, icon: Icon }) => (
                    <Link
                      key={path}
                      to={path}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-nb transition-all duration-200 text-sm font-medium',
                        location.pathname === path
                          ? 'bg-nb-accent text-nb-ink font-semibold shadow-nb-sm'
                          : 'hover:bg-nb-accent hover:text-nb-ink hover:shadow-nb-sm hover:-translate-y-0.5'
                      )}
                      onClick={() => setMenuState(false)}
                    >
                      <Icon size={16} />
                      {label}
                    </Link>
                  ))}
                </div>

                {/* Wallet Connection Section */}
                <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit lg:items-center">
                  {/* Connected Account Display (Desktop only when scrolled) */}
                  {isConnected && (
                    <div className={cn(
                      "hidden items-center gap-2 px-3 py-2 bg-nb-accent/10 rounded-nb text-sm",
                      isScrolled ? "lg:flex" : "lg:hidden"
                    )}>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-nb-ink/80">{formatAddress(account)}</span>
                    </div>
                  )}

                  {/* Connected Account Display (Mobile and non-scrolled desktop) */}
                  {isConnected && (
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-2 bg-nb-accent/10 rounded-nb text-sm",
                      isScrolled && "lg:hidden"
                    )}>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-nb-ink/80">{formatAddress(account)}</span>
                    </div>
                  )}

                  {/* Wallet Button (Non-scrolled) */}
                  <NBButton 
                    variant={isConnected ? "secondary" : "primary"}
                    size="sm"
                    className={cn(isScrolled && "lg:hidden")}
                    onClick={handleWalletAction}
                    disabled={isConnecting}
                    icon={isConnecting ? null : isConnected ? <LogOut size={16} /> : <Wallet size={16} />}
                  >
                    {isConnecting 
                      ? 'Connecting...' 
                      : isConnected 
                        ? 'Disconnect' 
                        : 'Login'
                    }
                  </NBButton>

                  {/* Wallet Button (Scrolled - Compact) */}
                  <NBButton 
                    variant={isConnected ? "secondary" : "primary"}
                    size="sm"
                    className={cn(isScrolled ? "lg:inline-flex" : "hidden")}
                    onClick={handleWalletAction}
                    disabled={isConnecting}
                    icon={isConnecting ? null : isConnected ? <LogOut size={16} /> : <Wallet size={16} />}
                  >
                    {isConnecting 
                      ? 'Connecting...' 
                      : isConnected 
                        ? 'Disconnect' 
                        : 'Login'
                    }
                  </NBButton>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Connection Status Banner (Optional - shows when connecting) */}
      {isConnecting && (
        <div className="fixed top-20 left-0 right-0 z-10 bg-nb-accent/20 backdrop-blur-sm border-b border-nb-accent/30">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-center gap-2 text-sm text-nb-ink">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-nb-accent"></div>
              <span>Connecting...</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-nb-card nb-border border-t-2 p-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            © 2024 NCCR Demo - Blue Carbon MRV Platform
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="#" className="hover:text-nb-accent">Documentation</Link>
            <Link to="#" className="hover:text-nb-accent">Support</Link>
            <span className="text-gray-400">v1.0.0</span>
            {isConnected && (
              <span className="flex items-center gap-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Connected
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
