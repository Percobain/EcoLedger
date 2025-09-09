import { useState } from 'react';
import { toast } from 'sonner';
import { handleTransactionError, handleWalletError } from '../lib/utils';

export function useTransaction() {
  const [isLoading, setIsLoading] = useState(false);

  const executeTransaction = async (transactionFn, successMessage, errorMessage, toastId = null) => {
    setIsLoading(true);
    
    try {
      toast.loading('Processing transaction...', { id: toastId });
      const result = await transactionFn();
      
      if (successMessage) {
        const txHash = result?.transactionHash || result?.hash || 'unknown';
        toast.success(`${successMessage} TX: ${txHash.slice(0, 10)}...`, { id: toastId });
      }
      
      return result;
    } catch (error) {
      handleTransactionError(error, errorMessage, toastId);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const executeWalletConnection = async (connectionFn) => {
    setIsLoading(true);
    
    try {
      const result = await connectionFn();
      toast.success('Wallet connected successfully!');
      return result;
    } catch (error) {
      handleWalletError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    executeTransaction,
    executeWalletConnection
  };
}
