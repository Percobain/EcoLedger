import { useState, useEffect } from "react";
import { TreePine, Leaf, CheckCircle, MapPin, Users, Star } from "lucide-react";
import NBCard from "./NBCard";
import {
  generateImpactMetrics,
  generateFallbackMetrics,
} from "../services/impactMetricsService";

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
        console.warn("Failed to generate AI metrics, using fallback:", error);
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
      key: "treesPlanted",
      icon: TreePine,
      iconColor: "text-nb-accent",
    },
    {
      key: "carbonSequestered",
      icon: Leaf,
      iconColor: "text-nb-accent",
    },
    {
      key: "survivalRate",
      icon: CheckCircle,
      iconColor: "text-nb-accent",
    },
    {
      key: "areaRestored",
      icon: MapPin,
      iconColor: "text-nb-accent",
    },
    {
      key: "communityBeneficiaries",
      icon: Users,
      iconColor: "text-nb-accent",
    },
    {
      key: "wildlifeSpecies",
      icon: Star,
      iconColor: "text-nb-accent",
    },
  ];

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <h3 className="text-xl font-display font-bold text-nb-ink mb-4">
          Environmental Impact Metrics
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[...Array(6)].map((_, index) => (
            <NBCard key={index} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded"></div>
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
            <p className="text-red-600 font-medium">
              Failed to load impact metrics
            </p>
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

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {metricCards.map(({ key, icon: Icon, iconColor }) => {
          const metric = metrics.metrics?.[key] || metrics[key];
          const value = metric?.value || metric || 0;
          const unit = metric?.unit || "";
          const label =
            metric?.label ||
            key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase());

          return (
            <NBCard
              key={key}
              className="bg-white border border-gray-200 shadow-none transition-all duration-200"
            >
              <div className="text-center p-3 h-full flex flex-col justify-center items-center">
                <div className="flex justify-center mb-2">
                  <Icon size={18} className={iconColor} />
                </div>

                <div className="text-lg font-semibold text-nb-ink mb-1">
                  {typeof value === "number" ? value.toLocaleString() : value}
                </div>

                <div className="text-xs font-medium text-nb-ink/60 leading-tight">
                  {label}
                </div>

                {/* {unit && <div className="text-xs text-nb-ink/40">{unit}</div>} */}
              </div>
            </NBCard>
          );
        })}
      </div>

      {/* Additional Info */}
      <NBCard className="bg-green-50 border-green-200 shadow-none">
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
