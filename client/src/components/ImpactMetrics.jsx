import { useState, useEffect } from 'react';
import { TreePine, Leaf, CheckCircle, MapPin, Users, Star } from 'lucide-react';
import NBCard from './NBCard';
import { generateImpactMetrics, generateFallbackMetrics } from '../services/impactMetricsService';

const ImpactMetrics = ({ projectData, className = "" }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!projectData) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Try to generate metrics using Gemini AI
        const generatedMetrics = await generateImpactMetrics(projectData);
        setMetrics(generatedMetrics);
      } catch (error) {
        console.warn('Failed to generate AI metrics, using fallback:', error);
        // Fallback to calculated metrics
        const fallbackMetrics = generateFallbackMetrics(projectData);
        setMetrics(fallbackMetrics);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [projectData]);

  const metricCards = [
    {
      key: 'treesPlanted',
      icon: TreePine,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      key: 'carbonSequestered',
      icon: Leaf,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      key: 'survivalRate',
      icon: CheckCircle,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    },
    {
      key: 'areaRestored',
      icon: MapPin,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200'
    },
    {
      key: 'communityBeneficiaries',
      icon: Users,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200'
    },
    {
      key: 'wildlifeSpecies',
      icon: Star,
      bgColor: 'bg-teal-50',
      iconColor: 'text-teal-600',
      borderColor: 'border-teal-200'
    }
  ];

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <h3 className="text-xl font-display font-bold text-nb-ink mb-4">
          Environmental Impact Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <NBCard key={index} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded"></div>
            </NBCard>
          ))}
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className={`space-y-6 ${className}`}>
        <h3 className="text-xl font-display font-bold text-nb-ink mb-4">
          Environmental Impact Metrics
        </h3>
        <NBCard className="bg-red-50 border-red-200">
          <div className="text-center py-8">
            <p className="text-red-600 font-medium">Failed to load impact metrics</p>
            <p className="text-red-500 text-sm mt-1">Please try again later</p>
          </div>
        </NBCard>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <h3 className="text-xl font-display font-bold text-nb-ink mb-4">
        Environmental Impact Metrics
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metricCards.map(({ key, icon: Icon, bgColor, iconColor, borderColor }) => {
          const metric = metrics.metrics?.[key] || metrics[key];
          const value = metric?.value || metric || 0;
          const unit = metric?.unit || '';
          const label = metric?.label || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

          return (
            <NBCard 
              key={key} 
              className={`${bgColor} ${borderColor} border-2 hover:shadow-lg transition-all duration-200`}
            >
              <div className="text-center p-4">
                <div className="flex justify-center mb-3">
                  <div className={`p-3 rounded-full ${bgColor} ${borderColor} border-2`}>
                    <Icon size={24} className={iconColor} />
                  </div>
                </div>
                
                <div className="text-2xl font-bold text-nb-ink mb-1">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
                
                <div className="text-sm font-medium text-nb-ink/70">
                  {label}
                </div>
                
                {unit && (
                  <div className="text-xs text-nb-ink/50 mt-1">
                    {unit}
                  </div>
                )}
              </div>
            </NBCard>
          );
        })}
      </div>

      {/* Additional Info */}
      <NBCard className="bg-nb-accent/5 border-nb-accent/20">
        <div className="text-center py-4">
          <p className="text-sm text-nb-ink/70">
            Metrics generated using AI analysis of project data
          </p>
          <p className="text-xs text-nb-ink/50 mt-1">
            Based on scientific models and project specifications
          </p>
        </div>
      </NBCard>
    </div>
  );
};

export default ImpactMetrics;
