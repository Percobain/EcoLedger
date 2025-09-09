/**
 * @fileoverview Tenant property filters component
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { NBCard } from './NBCard';
import { NBButton } from './NBButton';
import { Search, Filter, X } from 'lucide-react';

/**
 * Property filters component that syncs with URL search params
 * @param {Object} props
 * @param {string} props.query - Current search query
 * @param {Function} props.onChange - Filter change handler
 * @param {string[]} [props.cities] - Available cities for filter
 * @param {string[]} [props.propertyTypes] - Available property types
 * @param {string} [props.className] - Additional CSS classes
 */
export function FilterBar({ 
  query = '', 
  onChange, 
  cities = [], 
  propertyTypes = [],
  className 
}) {
  const [filters, setFilters] = useState({
    query: query || '',
    city: 'all',
    propertyType: 'all',
    minPrice: '',
    maxPrice: '',
    minDuration: ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sync with URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const newFilters = {
      query: urlParams.get('query') || '',
      city: urlParams.get('city') || 'all',
      propertyType: urlParams.get('propertyType') || 'all',
      minPrice: urlParams.get('minPrice') || '',
      maxPrice: urlParams.get('maxPrice') || '',
      minDuration: urlParams.get('minDuration') || ''
    };
    setFilters(newFilters);
  }, []);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const urlParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v && v !== 'all' && v !== '') {
        urlParams.set(k, v);
      }
    });
    
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
    
    // Call onChange with clean filters (remove empty values)
    const cleanFilters = Object.fromEntries(
      Object.entries(newFilters).filter(([_, v]) => v && v !== 'all' && v !== '')
    );
    onChange(cleanFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      query: '',
      city: 'all',
      propertyType: 'all',
      minPrice: '',
      maxPrice: '',
      minDuration: ''
    };
    setFilters(clearedFilters);
    window.history.replaceState({}, '', window.location.pathname);
    onChange({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v && v !== 'all' && v !== '');

  return (
    <NBCard className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nb-ink/50 w-4 h-4" />
        <input
          type="text"
          placeholder="Search properties..."
          value={filters.query}
          onChange={(e) => handleFilterChange('query', e.target.value)}
          className="w-full pl-10 pr-4 py-3 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink placeholder-nb-ink/50 focus:outline-none focus:ring-4 focus:ring-nb-accent"
          data-testid="search-input"
        />
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={filters.city}
          onChange={(e) => handleFilterChange('city', e.target.value)}
          className="px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
          data-testid="filter-city"
        >
          <option value="all">All Cities</option>
          {cities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <select
          value={filters.propertyType}
          onChange={(e) => handleFilterChange('propertyType', e.target.value)}
          className="px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
          data-testid="filter-property-type"
        >
          <option value="all">All Types</option>
          {propertyTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <NBButton
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          icon={<Filter className="w-4 h-4" />}
        >
          {showAdvanced ? 'Less' : 'More'} Filters
        </NBButton>

        {hasActiveFilters && (
          <NBButton
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            icon={<X className="w-4 h-4" />}
          >
            Clear
          </NBButton>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t-2 border-nb-ink/20">
          <div>
            <label className="block text-sm font-medium text-nb-ink mb-1">
              Min Price (₹)
            </label>
            <input
              type="number"
              placeholder="10000"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink placeholder-nb-ink/50 focus:outline-none focus:ring-4 focus:ring-nb-accent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-nb-ink mb-1">
              Max Price (₹)
            </label>
            <input
              type="number"
              placeholder="50000"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink placeholder-nb-ink/50 focus:outline-none focus:ring-4 focus:ring-nb-accent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-nb-ink mb-1">
              Min Duration (months)
            </label>
            <input
              type="number"
              placeholder="3"
              value={filters.minDuration}
              onChange={(e) => handleFilterChange('minDuration', e.target.value)}
              className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink placeholder-nb-ink/50 focus:outline-none focus:ring-4 focus:ring-nb-accent"
            />
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (!value || value === 'all' || value === '') return null;
            
            const displayValue = key === 'query' ? `"${value}"` : 
                               key === 'minPrice' ? `₹${value}+` :
                               key === 'maxPrice' ? `₹${value}-` :
                               key === 'minDuration' ? `${value}+ months` :
                               value;
            
            return (
              <span
                key={key}
                className="inline-flex items-center px-2 py-1 bg-nb-accent text-nb-ink text-xs rounded border border-nb-ink"
              >
                {displayValue}
                <button
                  onClick={() => handleFilterChange(key, key === 'city' || key === 'propertyType' ? 'all' : '')}
                  className="ml-1 hover:text-nb-error"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </NBCard>
  );
}
