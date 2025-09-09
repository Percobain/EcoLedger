export const ICarbonCreditsDAO = [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "certificateMetadata",
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
          "name": "",
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
          "name": "",
          "type": "address"
        }
      ],
      "name": "companyInvestments",
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
          "name": "",
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
          "name": "",
          "type": "address"
        }
      ],
      "name": "pendingWithdrawals",
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
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "projectInvestments",
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
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "projects",
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
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalCarbonCreditsIssued",
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
      "name": "totalInvestmentAmount",
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
      "name": "totalProjectsFraud",
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
      "name": "totalProjectsListed",
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
      "name": "totalProjectsValidated",
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
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "userProjects",
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
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "verifications",
      "outputs": [
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
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]