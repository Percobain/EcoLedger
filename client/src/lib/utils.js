import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { toast } from 'sonner';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Helper function to check if error is user rejection
export function isUserRejection(error) {
  return error.code === 4001 || 
         error.reason === 'rejected' || 
         error.message?.includes('User denied transaction signature') ||
         error.message?.includes('user rejected action');
}

// Global error handler for transactions
export function handleTransactionError(error, defaultMessage, toastId = null) {
  console.error('Transaction error:', error);
  
  if (isUserRejection(error)) {
    toast.error('User Rejected the Transaction', { id: toastId });
  } else {
    toast.error(defaultMessage + error.message, { id: toastId });
  }
}

// Global error handler for wallet connection
export function handleWalletError(error) {
  console.error('Wallet error:', error);
  
  if (isUserRejection(error)) {
    toast.error('User Rejected the Connection');
  } else {
    toast.error('Failed to connect wallet. Please try again.');
  }
}
