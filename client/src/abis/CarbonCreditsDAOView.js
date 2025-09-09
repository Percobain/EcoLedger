export const CarbonCreditsDAOView = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_dao",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "dao",
      "outputs": [
        {
          "internalType": "contract ICarbonCreditsDAO",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getAllProjects",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "getCarbonBalance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "certificateId",
          "type": "uint256"
        }
      ],
      "name": "getCertificateDetails",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "projectId",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "projectName",
              "type": "string"
            },
            {
              "internalType": "address",
              "name": "investor",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "investorName",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "investmentAmount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "carbonCreditsReceived",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "issuedAt",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "projectLocation",
              "type": "string"
            }
          ],
          "internalType": "struct ICarbonCreditsDAO.CertificateMetadata",
          "name": "metadata",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "company",
          "type": "address"
        }
      ],
      "name": "getCompanyStats",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "totalInvested",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalCarbonCredits",
          "type": "uint256"
        },
        {
          "internalType": "uint256[]",
          "name": "certificates",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "projectId",
          "type": "uint256"
        }
      ],
      "name": "getCompleteProjectInfo",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "ngo",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "metadataUri",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "quotationAmount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "securityDeposit",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "isListed",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "isValidated",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "isFraud",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "carbonCreditsAmount",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "status",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "createdAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "validatedAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "totalInvested",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "projectName",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "location",
              "type": "string"
            }
          ],
          "internalType": "struct ICarbonCreditsDAO.Project",
          "name": "project",
          "type": "tuple"
        },
        {
          "components": [
            {
              "internalType": "bool",
              "name": "isCentralized",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "juryVoted",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "juryDecision",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "juryStake",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "verifiedAt",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "verifier",
              "type": "address"
            }
          ],
          "internalType": "struct ICarbonCreditsDAO.Verification",
          "name": "verification",
          "type": "tuple"
        },
        {
          "internalType": "uint256",
          "name": "investmentCount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalInvested",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "entityType",
          "type": "string"
        }
      ],
      "name": "getEntitiesByType",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "",
          "type": "address[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "getPendingWithdrawal",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getPlatformStats",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "projectsListed",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "projectsValidated",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "projectsFraud",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalInvestment",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalCarbonCredits",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalEntities",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "projectId",
          "type": "uint256"
        }
      ],
      "name": "getProjectInvestmentHistory",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "projectId",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "company",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "carbonCreditsReceived",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "certificateNFTId",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "investedAt",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "companyName",
              "type": "string"
            }
          ],
          "internalType": "struct ICarbonCreditsDAO.Investment[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "status",
          "type": "string"
        }
      ],
      "name": "getProjectsByStatus",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "offset",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "limit",
          "type": "uint256"
        }
      ],
      "name": "getProjectsPaginated",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "ngo",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "metadataUri",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "quotationAmount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "securityDeposit",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "isListed",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "isValidated",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "isFraud",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "carbonCreditsAmount",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "status",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "createdAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "validatedAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "totalInvested",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "projectName",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "location",
              "type": "string"
            }
          ],
          "internalType": "struct ICarbonCreditsDAO.Project[]",
          "name": "projectsList",
          "type": "tuple[]"
        },
        {
          "internalType": "uint256",
          "name": "total",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getRegisteredEntities",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "",
          "type": "address[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getUserProjects",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getValidatedProjects",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]