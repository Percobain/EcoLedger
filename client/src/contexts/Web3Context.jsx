import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import web3Service from '../services/web3Service';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState(null);

  // Check if already connected on mount
  useEffect(() => {
    checkConnection();
    setupEventListeners();
  }, []);

  const checkConnection = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await web3Service.init();
          setAccount(accounts[0]);
          setIsConnected(true);
          
          // Get chain ID
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          setChainId(parseInt(chainId, 16));
        }
      }
    } catch (error) {
      console.error('Failed to check connection:', error);
    }
  };

  const setupEventListeners = () => {
    if (typeof window.ethereum !== 'undefined') {
      // Account changed
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAccount(accounts[0]);
          web3Service.init();
        }
      });

      // Chain changed
      window.ethereum.on('chainChanged', (chainId) => {
        setChainId(parseInt(chainId, 16));
        window.location.reload(); // Reload to reset state
      });

      // Disconnect
      window.ethereum.on('disconnect', () => {
        disconnect();
      });
    }
  };

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const account = await web3Service.connectWallet();
      setAccount(account);
      setIsConnected(true);
      
      // Get chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      setChainId(parseInt(chainId, 16));
      
      toast.success('Wallet connected successfully!');
      return account;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet. Please try again.');
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await web3Service.disconnectWallet();
      setAccount(null);
      setIsConnected(false);
      setChainId(null);
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  }, []);

  const value = {
    // State
    account,
    isConnected,
    isConnecting,
    chainId,
    
    // Actions
    connect,
    disconnect,
    
    // Web3 service
    web3Service,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};