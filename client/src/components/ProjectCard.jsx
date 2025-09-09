import { MapPin, DollarSign, TreePine, Calendar, User } from 'lucide-react';
import NBCard from './NBCard';
import NBButton from './NBButton';

const ProjectCard = ({ 
  id, 
  title, 
  location, 
  estimatedBudget, 
  targetPlants,
  status, 
  photos, 
  coverImage = 0, 
  onView,
  onFund,
  ownerId,
  speciesPlanted,
  createdAt,
  className = "" 
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-nb-ok text-white';
      case 'funded': return 'bg-nb-accent-2 text-white';
      case 'pending': return 'bg-nb-warn text-white';
      case 'reporting': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'verified': return 'Verified';
      case 'funded': return 'Funded';
      case 'pending': return 'Under Review';
      case 'reporting': return 'In Progress';
      default: return status;
    }
  };

  const formatBudget = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <NBCard className={`overflow-hidden ${className}`}>
      {/* Cover Image */}
      <div className="h-48 bg-gradient-to-br from-nb-accent/20 to-nb-accent-2/20 rounded-nb mb-4 overflow-hidden border border-nb-ink">
        {photos && photos[coverImage] ? (
          <img 
            src={photos[coverImage]} 
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TreePine size={64} className="text-nb-accent" />
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(status)}`}>
          {getStatusLabel(status)}
        </span>
        {createdAt && (
          <span className="text-sm text-nb-ink/60 flex items-center gap-1">
            <Calendar size={14} />
            {formatDate(createdAt)}
          </span>
        )}
      </div>

      {/* Project Info */}
      <div className="space-y-3">
        <h3 className="text-xl font-display font-bold text-nb-ink line-clamp-2">
          {title}
        </h3>
        
        <div className="flex items-center gap-2 text-nb-ink/70">
          <MapPin size={16} />
          <span className="text-sm">{location}</span>
        </div>

        {speciesPlanted && (
          <div className="flex items-center gap-2 text-nb-ink/70">
            <TreePine size={16} />
            <span className="text-sm">{speciesPlanted}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <div className="flex items-center gap-1 text-nb-ink/60 text-sm">
              <DollarSign size={14} />
              <span>Budget</span>
            </div>
            <div className="font-semibold text-nb-ink">
              {formatBudget(estimatedBudget)}
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-1 text-nb-ink/60 text-sm">
              <TreePine size={14} />
              <span>Target Plants</span>
            </div>
            <div className="font-semibold text-nb-ink">
              {targetPlants?.toLocaleString() || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 pt-4 border-t border-nb-ink/20 flex gap-2">
        {onView && (
          <NBButton 
            variant="ghost" 
            size="sm" 
            onClick={() => onView(id)}
            className="flex-1"
          >
            View Details
          </NBButton>
        )}
        
        {onFund && status === 'verified' && (
          <NBButton 
            variant="primary" 
            size="sm" 
            onClick={() => onFund(id)}
            className="flex-1"
          >
            Fund Project
          </NBButton>
        )}
      </div>
    </NBCard>
  );
};

export default ProjectCard;
