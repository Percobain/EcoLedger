/**
 * @fileoverview Image gallery carousel component
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NBButton } from './NBButton';

/**
 * Static image carousel component
 * @param {Object} props
 * @param {string[]} props.images - Array of image URLs
 * @param {number} [props.coverIndex=0] - Index of cover image to start with
 * @param {string} [props.className] - Additional CSS classes
 */
export function Gallery({ images = [], coverIndex = 0, className }) {
  const [currentIndex, setCurrentIndex] = useState(coverIndex);

  if (!images.length) {
    return (
      <div className={cn(
        'w-full h-96 bg-nb-bg border-2 border-nb-ink rounded-nb flex items-center justify-center',
        className
      )}>
        <span className="text-nb-ink/50 font-body">No images available</span>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div className={cn('relative w-full', className)}>
      {/* Main Image */}
      <div className="relative h-96 overflow-hidden rounded-nb border-2 border-nb-ink">
        <img
          src={images[currentIndex]}
          alt={`Gallery image ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300"
          onError={(e) => {
            e.target.src = '/mock-images/placeholder-property.jpg';
          }}
        />
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <NBButton
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-nb-card/80 hover:bg-nb-card"
            >
              <ChevronLeft className="w-4 h-4" />
            </NBButton>
            
            <NBButton
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-nb-card/80 hover:bg-nb-card"
            >
              <ChevronRight className="w-4 h-4" />
            </NBButton>
          </>
        )}
        
        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-nb-ink/80 text-nb-card px-2 py-1 rounded text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'flex-shrink-0 w-20 h-16 rounded border-2 overflow-hidden transition-all duration-200',
                index === currentIndex 
                  ? 'border-nb-accent shadow-nb-sm' 
                  : 'border-nb-ink/30 hover:border-nb-ink opacity-70 hover:opacity-100'
              )}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/mock-images/placeholder-property.jpg';
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
