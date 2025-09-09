import { ethers } from 'ethers';
import { CarbonCreditsDAO } from '../abis/CarbonCreditsDAO.js';
import { CarbonToken } from '../abis/CarbonToken.js';

// Contract addresses - Update these with your deployed contract addresses
const CONTRACT_ADDRESSES = {
  carbonCreditsDAO: "0x35160Cd5953df8Dbf324554D61f4438fb2D713B4",
};

// Pinata configuration
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.carbonCreditsDAO = null;
    this.carbonToken = null;
    this.account = null;
  }

  // Initialize Web3 connection
  async init() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        this.account = await this.signer.getAddress();
        
        // Initialize main contract
        this.carbonCreditsDAO = new ethers.Contract(
          CONTRACT_ADDRESSES.carbonCreditsDAO,
          CarbonCreditsDAO,
          this.signer
        );

        // Try to get carbon token address, but don't fail if it's not available yet
        try {
          const carbonTokenAddress = await this.carbonCreditsDAO.carbonToken();
          if (carbonTokenAddress && carbonTokenAddress !== ethers.ZeroAddress) {
            this.carbonToken = new ethers.Contract(
              carbonTokenAddress,
              CarbonToken,
              this.signer
            );
          }
        } catch (error) {
          console.warn('Carbon token not yet deployed or accessible:', error.message);
          // Don't fail initialization if carbon token is not available
        }

        return true;
      } catch (error) {
        console.error('Failed to initialize Web3:', error);
        throw error;
      }
    } else {
      throw new Error('MetaMask not found. Please install MetaMask.');
    }
  }

  // Connect wallet
  async connectWallet() {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        await this.init();
        return accounts[0];
      } else {
        throw new Error('MetaMask not found');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  // Disconnect wallet
  async disconnectWallet() {
    this.provider = null;
    this.signer = null;
    this.carbonCreditsDAO = null;
    this.carbonToken = null;
    this.account = null;
  }

  // Check if wallet is connected
  isConnected() {
    return this.account !== null;
  }

  // Get current account
  getCurrentAccount() {
    return this.account;
  }

  // Initialize carbon token if not already done
  async initializeCarbonToken() {
    if (!this.carbonToken && this.carbonCreditsDAO) {
      try {
        const carbonTokenAddress = await this.carbonCreditsDAO.carbonToken();
        if (carbonTokenAddress && carbonTokenAddress !== ethers.ZeroAddress) {
          this.carbonToken = new ethers.Contract(
            carbonTokenAddress,
            CarbonToken,
            this.signer
          );
        }
      } catch (error) {
        console.warn('Carbon token still not available:', error.message);
      }
    }
  }

  // Pinata file upload
  async uploadToPinata(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload to Pinata');
      }

      const result = await response.json();
      return result.IpfsHash;
    } catch (error) {
      console.error('Pinata upload error:', error);
      throw error;
    }
  }

  // Upload multiple files to Pinata
  async uploadMultipleFiles(files) {
    const uploadPromises = files.map(file => this.uploadToPinata(file));
    return Promise.all(uploadPromises);
  }

  // Upload JSON metadata to Pinata
  async uploadMetadataToPinata(metadata) {
    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PINATA_JWT}`,
        },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        throw new Error('Failed to upload metadata to Pinata');
      }

      const result = await response.json();
      return result.IpfsHash;
    } catch (error) {
      console.error('Metadata upload error:', error);
      throw error;
    }
  }

  // Helper to convert ETH to Wei - FIXED
  toWei(amount) {
    if (amount === null || amount === undefined || amount === '') {
      return ethers.parseEther('0');
    }
    
    // Convert to string and handle edge cases
    const amountStr = typeof amount === 'string' ? amount : String(amount);
    
    // Check if it's a valid number
    if (isNaN(parseFloat(amountStr))) {
      throw new Error(`Invalid amount for toWei: ${amountStr}`);
    }
    
    return ethers.parseEther(amountStr);
  }

  // Helper to convert Wei to ETH
  fromWei(amount) {
    return ethers.formatEther(amount);
  }

  // ============= ENTITY MANAGEMENT =============

  // Register entity (NGO, Corporate, etc.)
  async registerEntity(entityData) {
    try {
      const { address, name, entityType, registrationId } = entityData;
      
      const tx = await this.carbonCreditsDAO.registerEntity(
        address,
        name,
        entityType,
        registrationId || ""
      );
      
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Failed to register entity:', error);
      throw error;
    }
  }

  // Get entity details
  async getEntity(address) {
    try {
      return await this.carbonCreditsDAO.entities(address);
    } catch (error) {
      console.error('Failed to get entity:', error);
      throw error;
    }
  }

  // Get all registered entities
  async getAllEntities() {
    try {
      const addresses = await this.carbonCreditsDAO.getRegisteredEntities();
      const entities = [];
      
      for (const address of addresses) {
        const entity = await this.getEntity(address);
        entities.push({ address, ...entity });
      }
      
      return entities;
    } catch (error) {
      console.error('Failed to get all entities:', error);
      throw error;
    }
  }

  // ============= PROJECT MANAGEMENT =============

  // List a new project - FIXED
  async listProject(projectData, files) {
    try {
      console.log('Project data received:', projectData);
      console.log('Files received:', files);

      const { 
        title, 
        location, 
        description, 
        estimatedBudget, // Changed from quotationAmount
        securityDeposit,
        speciesPlanted,
        targetPlants 
      } = projectData;

      // Validate required fields
      if (!title || !location) {
        throw new Error('Title and location are required');
      }

      // Validate amounts
      if (!estimatedBudget || isNaN(parseFloat(estimatedBudget))) {
        throw new Error('Valid budget amount is required');
      }
      
      if (!securityDeposit || isNaN(parseFloat(securityDeposit))) {
        throw new Error('Valid security deposit is required');
      }

      // Validate files
      if (!files || files.length === 0) {
        throw new Error('At least one file is required');
      }

      // Upload files to Pinata
      console.log('Uploading files to Pinata...');
      const fileCIDs = await this.uploadMultipleFiles(files);
      console.log('File CIDs:', fileCIDs);
      
      // Create metadata
      const metadata = {
        name: title,
        description: description || '',
        image: fileCIDs[0] ? `ipfs://${fileCIDs[0]}` : "",
        attributes: [
          { trait_type: "Location", value: location || '' },
          { trait_type: "Species", value: speciesPlanted || '' },
          { trait_type: "Target Plants", value: targetPlants || 0 },
          { trait_type: "Project Type", value: "Blue Carbon Restoration" }
        ],
        files: fileCIDs.map(cid => `ipfs://${cid}`),
        project_details: {
          location: location || '',
          species_planted: speciesPlanted || '',
          target_plants: targetPlants || 0,
          estimated_budget: estimatedBudget
        }
      };

      // Upload metadata to Pinata
      console.log('Uploading metadata to Pinata...');
      const metadataHash = await this.uploadMetadataToPinata(metadata);
      const metadataUri = `ipfs://${metadataHash}`;
      console.log('Metadata URI:', metadataUri);

      // Convert amounts to Wei with validation
      console.log('Converting amounts - Budget:', estimatedBudget, 'Deposit:', securityDeposit);
      const quotationWei = this.toWei(estimatedBudget);
      const depositWei = this.toWei(securityDeposit);
      console.log('Wei amounts - Budget:', quotationWei.toString(), 'Deposit:', depositWei.toString());

      // List project on blockchain
      console.log('Submitting to blockchain...');
      const tx = await this.carbonCreditsDAO.listProject(
        metadataUri,
        quotationWei,
        title, // Use title as project name
        location,
        { value: depositWei }
      );

      console.log('Transaction submitted:', tx.hash);
      await tx.wait();
      console.log('Transaction confirmed');
      
      return {
        transactionHash: tx.hash,
        metadataHash,
        metadataUri
      };
    } catch (error) {
      console.error('Failed to list project:', error);
      throw error;
    }
  }

  // Get project details
  async getProject(projectId) {
    try {
      return await this.carbonCreditsDAO.projects(projectId);
    } catch (error) {
      console.error('Failed to get project:', error);
      throw error;
    }
  }

  // Get all projects
  async getAllProjects() {
    try {
      const projectIds = await this.carbonCreditsDAO.getAllProjects();
      const projects = [];
      
      for (const id of projectIds) {
        const project = await this.getProject(id);
        projects.push({ id: id.toString(), ...project });
      }
      
      return projects;
    } catch (error) {
      console.error('Failed to get all projects:', error);
      throw error;
    }
  }

  // Get user projects
  async getUserProjects(userAddress) {
    try {
      const projectIds = await this.carbonCreditsDAO.getUserProjects(userAddress || this.account);
      const projects = [];
      
      for (const id of projectIds) {
        const project = await this.getProject(id);
        projects.push({ id: id.toString(), ...project });
      }
      
      return projects;
    } catch (error) {
      console.error('Failed to get user projects:', error);
      throw error;
    }
  }

  // ============= VERIFICATION =============

  // Centralized verification
  async verifyCentralized(projectId, isValid) {
    try {
      const tx = await this.carbonCreditsDAO.verifyCentralized(projectId, isValid);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Failed to verify project:', error);
      throw error;
    }
  }

  // Stake as jury
  async stakeAsJury(projectId, stakeAmount) {
    try {
      const stakeWei = this.toWei(stakeAmount);
      const tx = await this.carbonCreditsDAO.stakeAsJury(projectId, { value: stakeWei });
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Failed to stake as jury:', error);
      throw error;
    }
  }

  // Jury vote
  async juryVote(projectId, isValid) {
    try {
      const tx = await this.carbonCreditsDAO.juryVote(projectId, isValid);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Failed to vote:', error);
      throw error;
    }
  }

  // ============= FUNDING =============

  // Release funds to NGO
  async releaseFunds(projectId, amount) {
    try {
      const amountWei = this.toWei(amount);
      const tx = await this.carbonCreditsDAO.releaseFunds(projectId, { value: amountWei });
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Failed to release funds:', error);
      throw error;
    }
  }

  // ============= MARKETPLACE =============

  // Buy carbon credits
  async buyCarbon(projectId, amount, companyName) {
    try {
      const amountWei = this.toWei(amount);
      const tx = await this.carbonCreditsDAO.buyCarbon(projectId, companyName, { value: amountWei });
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Failed to buy carbon credits:', error);
      throw error;
    }
  }

  // Get company investments
  async getCompanyInvestments(companyAddress) {
    try {
      const certificateIds = await this.carbonCreditsDAO.getCompanyInvestments(companyAddress || this.account);
      const investments = [];
      
      for (const certId of certificateIds) {
        const cert = await this.carbonCreditsDAO.getCertificateDetails(certId);
        investments.push({ certificateId: certId.toString(), ...cert });
      }
      
      return investments;
    } catch (error) {
      console.error('Failed to get company investments:', error);
      throw error;
    }
  }

  // ============= WITHDRAWALS =============

  // Withdraw pending funds
  async withdraw() {
    try {
      const tx = await this.carbonCreditsDAO.withdraw();
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Failed to withdraw:', error);
      throw error;
    }
  }

  // Claim reward
  async claimReward() {
    try {
      const tx = await this.carbonCreditsDAO.claimReward();
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Failed to claim reward:', error);
      throw error;
    }
  }

  // Get pending withdrawal amount
  async getPendingWithdrawal(address) {
    try {
      return await this.carbonCreditsDAO.getPendingWithdrawal(address || this.account);
    } catch (error) {
      console.error('Failed to get pending withdrawal:', error);
      throw error;
    }
  }

  // ============= CARBON TOKEN =============

  // Get carbon balance
  async getCarbonBalance(address) {
    try {
      // Initialize carbon token if needed
      await this.initializeCarbonToken();
      
      if (this.carbonToken) {
        return await this.carbonToken.balanceOf(address || this.account);
      } else {
        // Fallback to the DAO contract method
        return await this.carbonCreditsDAO.getCarbonBalance(address || this.account);
      }
    } catch (error) {
      console.error('Failed to get carbon balance:', error);
      throw error;
    }
  }

  // ============= UTILITY FUNCTIONS =============

  // Get verification details
  async getVerification(projectId) {
    try {
      return await this.carbonCreditsDAO.verifications(projectId);
    } catch (error) {
      console.error('Failed to get verification:', error);
      throw error;
    }
  }

  // Get project investment history
  async getProjectInvestmentHistory(projectId) {
    try {
      return await this.carbonCreditsDAO.getProjectInvestmentHistory(projectId);
    } catch (error) {
      console.error('Failed to get investment history:', error);
      throw error;
    }
  }

  // Listen for events
  listenForEvents(eventName, callback) {
    if (this.carbonCreditsDAO) {
      this.carbonCreditsDAO.on(eventName, callback);
    }
  }

  // Stop listening for events
  removeEventListener(eventName, callback) {
    if (this.carbonCreditsDAO) {
      this.carbonCreditsDAO.off(eventName, callback);
    }
  }
}

// Create and export singleton instance
const web3Service = new Web3Service();
export default web3Service;