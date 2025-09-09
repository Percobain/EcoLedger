/**
 * @fileoverview Dashboard statistics pill component
 */

import { cn } from '../lib/utils';

/**
 * Dashboard mini stats component
 * @param {Object} props
 * @param {string} props.label - Stat label
 * @param {string|number} props.value - Stat value
 * @param {React.ReactNode} [props.icon] - Optional icon
 * @param {string} [props.className] - Additional CSS classes
 */
const StatPill = ({ label, value, icon, className }) => {
  return (
    <div className={cn(
      'bg-nb-card border-2 border-nb-ink shadow-nb-sm rounded-nb p-4',
      'flex items-center justify-between min-w-[140px]',
      className
    )}>
      <div className="flex flex-col">
        <span className="text-2xl font-display font-bold text-nb-ink">
          {value}
        </span>
        <span className="text-sm font-body text-nb-ink/70">
          {label}
        </span>
      </div>
      {icon && (
        <div className="text-nb-ink/60 ml-3">
          {icon}
        </div>
      )}
    </div>
  );
};

export default StatPill;
export { StatPill };
