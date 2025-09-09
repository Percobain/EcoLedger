/**
 * @fileoverview Neo-Brutalist button component
 */

import { cn } from '../lib/utils';
import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { motion } from 'framer-motion';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-nb text-sm font-medium transition-all duration-200 ease-out border-2 border-nb-ink shadow-nb-sm hover:-translate-y-0.5 hover:shadow-[2px_2px_0_0_rgba(0,0,0,0.9)] active:translate-y-1 active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nb-accent disabled:pointer-events-none disabled:opacity-50 transform-gpu',
  {
    variants: {
      variant: {
        primary: 'bg-nb-accent text-nb-ink hover:bg-nb-accent/90',
        secondary: 'bg-nb-accent-2 text-nb-ink hover:bg-nb-accent-2/90',
        ghost: 'bg-transparent text-nb-ink hover:bg-nb-ink hover:text-nb-card shadow-none border-none',
        destructive: 'bg-nb-error text-white hover:bg-nb-error/90'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3',
        lg: 'h-12 rounded-nb px-8',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default'
    }
  }
);

/**
 * Neo-Brutalist button component
 * @param {Object} props
 * @param {'primary'|'secondary'|'ghost'|'destructive'} [props.variant='primary'] - Button style variant
 * @param {'default'|'sm'|'lg'|'icon'} [props.size='default'] - Button size
 * @param {React.ReactNode} [props.icon] - Icon element
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 */
const NBButton = forwardRef(({ 
  className, 
  variant, 
  size, 
  icon,
  children,
  ...props 
}, ref) => {
  return (
    <motion.button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      whileHover={{ 
        y: -2,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={{ 
        y: 4,
        scale: 0.98,
        transition: { duration: 0.1, ease: "easeInOut" }
      }}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </motion.button>
  );
});

NBButton.displayName = 'NBButton';

export { NBButton, buttonVariants };
export default NBButton;
