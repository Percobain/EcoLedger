/**
 * @fileoverview Neo-Brutalist card component
 */

import { cn } from '../lib/utils';
import { forwardRef } from 'react';

/**
 * Neo-Brutalist card wrapper component
 * @param {Object} props
 * @param {React.ElementType} [props.as='div'] - Element type to render as
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} props.children - Card content
 */
const NBCard = forwardRef(({ 
  as: Component = 'div', 
  className, 
  children, 
  ...props 
}, ref) => {
  return (
    <Component
      ref={ref}
      className={cn(
        'bg-nb-card border-2 border-nb-ink shadow-nb rounded-nb p-5',
        'transition-transform duration-200 ease-out',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

NBCard.displayName = 'NBCard';

export { NBCard };
export default NBCard;
