import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, TreePine, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { useProjectStore } from '../stores/useProjectStore';
import NBButton from '../components/NBButton';
import StatPill from '../components/StatPill';
import ProjectCard from '../components/ProjectCard';

const NGODashboard = () => {
  const { 
    projects, 
    loading, 
    error, 
    fetchProjects, 
    getProjectStats 
  } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const stats = getProjectStats();
  
  // Filter projects for current NGO (demo: show all)
  const ngoProjects = projects;

  const handleViewProject = (id) => {
    console.log('View project:', id);
    // In a real app, this would navigate to project details
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-nb-accent mx-auto mb-4"></div>
          <p className="text-lg text-nb-ink/70">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-nb-error mb-4">Error loading projects: {error}</p>
          <NBButton onClick={() => fetchProjects()}>
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold text-nb-ink mb-2">
              NGO Dashboard
            </h1>
            <p className="text-lg text-nb-ink/70">
              Manage your blue carbon restoration projects
            </p>
          </div>
          
          <Link to="/ngo/new">
            <NBButton variant="primary" size="lg" icon={<Plus size={20} />}>
              Add New Project
            </NBButton>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatPill 
            label="Total Projects" 
            value={stats.total} 
            icon={<TreePine size={24} />}
          />
          <StatPill 
            label="Verified" 
            value={stats.verified} 
            icon={<CheckCircle size={24} />}
          />
          <StatPill 
            label="Under Review" 
            value={stats.pending} 
            icon={<Clock size={24} />}
          />
          <StatPill 
            label="Funded" 
            value={stats.funded} 
            icon={<DollarSign size={24} />}
          />
        </div>

        {/* Projects Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold text-nb-ink">
              Your Projects
            </h2>
            <div className="flex gap-2">
              <select className="px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent">
                <option value="">All Status</option>
                <option value="pending">Under Review</option>
                <option value="verified">Verified</option>
                <option value="funded">Funded</option>
                <option value="reporting">In Progress</option>
              </select>
            </div>
          </div>

          {ngoProjects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ngoProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  {...project}
                  onView={handleViewProject}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TreePine size={64} className="text-nb-ink/30 mx-auto mb-4" />
              <h3 className="text-xl font-display font-bold text-nb-ink mb-2">
                No Projects Yet
              </h3>
              <p className="text-nb-ink/70 mb-6">
                Start your first blue carbon restoration project to make an impact.
              </p>
              <Link to="/ngo/new">
                <NBButton variant="primary" icon={<Plus size={20} />}>
                  Create Your First Project
                </NBButton>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-nb-card rounded-nb border-2 border-nb-ink p-6">
          <h3 className="text-xl font-display font-bold text-nb-ink mb-4">
            Quick Actions
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/ngo/new">
              <NBButton variant="ghost" className="w-full justify-start">
                <Plus size={16} className="mr-2" />
                Submit New Project
              </NBButton>
            </Link>
            <Link to="/reporting">
              <NBButton variant="ghost" className="w-full justify-start">
                <TreePine size={16} className="mr-2" />
                Upload Progress Report
              </NBButton>
            </Link>
            <Link to="/verification">
              <NBButton variant="ghost" className="w-full justify-start">
                <CheckCircle size={16} className="mr-2" />
                Check Verification Status
              </NBButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NGODashboard;
