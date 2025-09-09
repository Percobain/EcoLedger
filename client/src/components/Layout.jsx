import { Link, useLocation } from 'react-router-dom';
import { Leaf, TreePine, Building2, Vote, FileText, Users } from 'lucide-react';
import NBButton from './NBButton';

const Layout = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/ngo', label: 'NGO', icon: TreePine },
    { path: '/verification', label: 'Verification', icon: FileText },
    { path: '/csr', label: 'CSR', icon: Building2 },
    { path: '/dao', label: 'DAO', icon: Vote },
    { path: '/reporting', label: 'Reporting', icon: Users },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-nb-card nb-border border-b-2 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-display font-bold">
            <Leaf className="text-nb-accent" size={32} />
            <span>EcoLedger</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-4">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-4 py-2 rounded-nb transition-colors ${
                  location.pathname === path
                    ? 'bg-nb-accent text-nb-ink font-semibold'
                    : 'hover:bg-nb-accent hover:text-nb-ink'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>

          <NBButton variant="secondary" disabled>
            Connect Wallet
          </NBButton>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
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
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
