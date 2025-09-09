import { useEffect, useState } from 'react';
import { Search, Filter, MapPin, DollarSign, TreePine } from 'lucide-react';
import { toast } from 'sonner';
import { useProjectStore } from '../stores/useProjectStore';
import NBCard from '../components/NBCard';
import NBButton from '../components/NBButton';
import ProjectCard from '../components/ProjectCard';

const CSRMarketplace = () => {
  const { projects, loading, error, fetchProjects } = useProjectStore();
  const [filters, setFilters] = useState({
    location: '',
    minBudget: '',
    maxBudget: '',
    searchTerm: ''
  });

  useEffect(() => {
    fetchProjects({ status: 'verified' });
  }, [fetchProjects]);

  // Filter verified projects based on current filters
  const filteredProjects = projects.filter(project => {
    if (project.status !== 'verified') return false;
    
    if (filters.searchTerm && 
        !project.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
        !project.location.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }
    
    if (filters.location && 
        !project.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    
    if (filters.minBudget && project.estimatedBudget < parseInt(filters.minBudget)) {
      return false;
    }
    
    if (filters.maxBudget && project.estimatedBudget > parseInt(filters.maxBudget)) {
      return false;
    }
    
    return true;
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleFundProject = (projectId) => {
    // Mock funding action
    toast.success('Funding committed successfully! Project owner will be notified.');
    console.log('Fund project:', projectId);
    
    // In a real app, this would update the project status and handle payment
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      minBudget: '',
      maxBudget: '',
      searchTerm: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-nb-accent mx-auto mb-4"></div>
          <p className="text-lg text-nb-ink/70">Loading verified projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-nb-error mb-4">Error loading projects: {error}</p>
          <NBButton onClick={() => fetchProjects({ status: 'verified' })}>
            Try Again
          </NBButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-nb-ink mb-2">
            CSR Marketplace
          </h1>
          <p className="text-lg text-nb-ink/70">
            Fund verified blue carbon restoration projects and make a positive environmental impact
          </p>
        </div>

        {/* Filters */}
        <NBCard className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-nb-accent" />
            <h3 className="text-lg font-display font-bold">Filter Projects</h3>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Search
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nb-ink/50" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nb-ink/50" />
                <input
                  type="text"
                  placeholder="Enter location"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Min Budget (₹)
              </label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nb-ink/50" />
                <input
                  type="number"
                  placeholder="Min amount"
                  value={filters.minBudget}
                  onChange={(e) => handleFilterChange('minBudget', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Max Budget (₹)
              </label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nb-ink/50" />
                <input
                  type="number"
                  placeholder="Max amount"
                  value={filters.maxBudget}
                  onChange={(e) => handleFilterChange('maxBudget', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                />
              </div>
            </div>
          </div>
          
          {Object.values(filters).some(value => value !== '') && (
            <div className="mt-4 pt-4 border-t border-nb-ink/20">
              <NBButton variant="ghost" onClick={clearFilters}>
                Clear All Filters
              </NBButton>
            </div>
          )}
        </NBCard>

        {/* Results */}
        <div className="mb-6">
          <p className="text-lg text-nb-ink/70">
            Showing {filteredProjects.length} verified project{filteredProjects.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                {...project}
                onFund={handleFundProject}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <TreePine size={64} className="text-nb-ink/30 mx-auto mb-4" />
            <h3 className="text-xl font-display font-bold text-nb-ink mb-2">
              No Projects Found
            </h3>
            <p className="text-nb-ink/70 mb-6">
              {Object.values(filters).some(value => value !== '') 
                ? 'Try adjusting your filters to find more projects.'
                : 'No verified projects are currently available for funding.'
              }
            </p>
            {Object.values(filters).some(value => value !== '') && (
              <NBButton variant="primary" onClick={clearFilters}>
                Clear Filters
              </NBButton>
            )}
          </div>
        )}

        {/* Info Banner */}
        <NBCard className="mt-12 bg-gradient-to-r from-nb-accent/10 to-nb-accent-2/10">
          <div className="text-center">
            <h3 className="text-xl font-display font-bold text-nb-ink mb-2">
              Impact Through Funding
            </h3>
            <p className="text-nb-ink/70 mb-4">
              Every project you fund helps restore coastal ecosystems, sequester carbon, and support local communities.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-nb-accent">500k+</div>
                <div className="text-sm text-nb-ink/60">Trees Planted</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-nb-accent-2">50+</div>
                <div className="text-sm text-nb-ink/60">Projects Funded</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-nb-ok">1000+</div>
                <div className="text-sm text-nb-ink/60">Tons CO₂ Sequestered</div>
              </div>
            </div>
          </div>
        </NBCard>
      </div>
    </div>
  );
};

export default CSRMarketplace;
