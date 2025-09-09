/**
 * @fileoverview Property listing card component
 */

import { cn } from '@/lib/utils';
import { NBCard } from './NBCard';
import { NBButton } from './NBButton';
import { MapPin, IndianRupee } from 'lucide-react';

/**
 * Property preview card component
 * @param {Object} props
 * @param {string} props.id - Property ID
 * @param {string} props.title - Property title
 * @param {string} props.city - Property city
 * @param {number} props.rentPerMonth - Monthly rent
 * @param {number} props.deposit - Security deposit
 * @param {string} props.coverImage - Cover image URL
 * @param {string[]} [props.badges] - Property badges/tags
 * @param {Function} props.onView - View handler function
 * @param {string} [props.className] - Additional CSS classes
 */
export function ListingCard({
  id,
  title,
  city,
  rentPerMonth,
  deposit,
  coverImage,
  badges = [],
  onView,
  className
}) {
  return (
    <NBCard className={cn('overflow-hidden hover:-translate-y-1', className)}>
      {/* Cover Image */}
      <div className="relative h-48 -m-5 mb-4 overflow-hidden">
        <img
          src={coverImage}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = '/mock-images/placeholder-property.jpg';
          }}
        />
        {badges.length > 0 && (
          <div className="absolute top-3 left-3 flex gap-2">
            {badges.map((badge, index) => (
              <span
                key={index}
                className="bg-nb-accent text-nb-ink text-xs font-medium px-2 py-1 rounded border border-nb-ink"
              >
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        <div>
          <h3 className="font-display font-bold text-lg text-nb-ink line-clamp-2">
            {title}
          </h3>
          <div className="flex items-center text-sm text-nb-ink/70 mt-1">
            <MapPin className="w-4 h-4 mr-1" />
            {city}
          </div>
        </div>

        {/* Pricing */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center text-xl font-display font-bold text-nb-ink">
              <IndianRupee className="w-5 h-5" />
              {rentPerMonth.toLocaleString()}
              <span className="text-sm font-body font-normal text-nb-ink/70 ml-1">
                /month
              </span>
            </div>
            <div className="flex items-center text-sm text-nb-ink/70">
              <IndianRupee className="w-3 h-3" />
              {deposit.toLocaleString()} deposit
            </div>
          </div>
        </div>

        {/* Action Button */}
        <NBButton
          onClick={() => onView(id)}
          className="w-full"
          data-testid="view-listing"
        >
          View Details
        </NBButton>
      </div>
    </NBCard>
  );
}
