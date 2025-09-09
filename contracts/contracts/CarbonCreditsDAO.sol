// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

// ERC20 Carbon Credit Token
contract CarbonToken is ERC20Upgradeable {
    address public minter;
    
    function initialize() public initializer {
        __ERC20_init("Carbon Credit", "CC");
        minter = msg.sender;
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

// Main Carbon Credits Platform Contract with UUPS
contract CarbonCreditsDAO is ERC721Upgradeable, ERC721URIStorageUpgradeable, UUPSUpgradeable, OwnableUpgradeable {
    CarbonToken public carbonToken;
    
    uint256 private _nextTokenId;
    uint256 private _nextProjectId;
    
    // Configurable addresses for MVP
    address public nccr;
    address public govtEmployee;
    address public jury;
    address public minter;
    address public daoTreasury;
    
    // Configurable fee percentages (in basis points, 100 = 1%)
    uint256 public daoDepositFee;
    uint256 public platformMarketplaceFee;
    uint256 public govtMarketplaceFee;
    uint256 public juryRewardPercent;
    uint256 public fraudSplitToNCCR;
    
    // Entity Management with optional IDs
    struct Entity {
        string name;
        string entityType; // "NGO", "CORPORATE", "COMMUNITY"
        string registrationId; // DARPAN for NGO, GSTIN for Corporate, optional for Community
        bool isApproved;
        address wallet;
        uint256 registeredAt;
    }
    
    // Enhanced Project/Listing Management
    struct Project {
        address ngo;
        string metadataUri;
        uint256 quotationAmount;
        uint256 securityDeposit;
        bool isListed;
        bool isValidated;
        bool isFraud;
        uint256 carbonCreditsAmount;
        string status;
        uint256 createdAt;
        uint256 validatedAt;
        uint256 totalInvested;
        string projectName;
        string location;
    }
    
    // Verification
    struct Verification {
        bool isCentralized;
        bool juryVoted;
        bool juryDecision;
        uint256 juryStake;
        uint256 verifiedAt;
        address verifier;
    }
    
    // Enhanced Investment tracking
    struct Investment {
        uint256 projectId;
        address company;
        uint256 amount;
        uint256 carbonCreditsReceived;
        uint256 certificateNFTId;
        uint256 investedAt;
        string companyName;
    }
    
    // NFT Certificate Metadata
    struct CertificateMetadata {
        uint256 projectId;
        string projectName;
        address investor;
        string investorName;
        uint256 investmentAmount;
        uint256 carbonCreditsReceived;
        uint256 issuedAt;
        string projectLocation;
    }
    
    // Mappings
    mapping(address => Entity) public entities;
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Verification) public verifications;
    mapping(uint256 => Investment[]) public projectInvestments;
    mapping(address => uint256) public pendingWithdrawals;
    mapping(address => uint256[]) public userProjects;
    mapping(address => uint256[]) public companyInvestments;
    mapping(uint256 => CertificateMetadata) public certificateMetadata;
    mapping(address => uint256) public totalInvestedByCompany;
    mapping(address => uint256) public totalCarbonCreditsByCompany;
    
    address[] public registeredEntities;
    uint256[] public allProjects;
    
    // Statistics
    uint256 public totalProjectsListed;
    uint256 public totalProjectsValidated;
    uint256 public totalProjectsFraud;
    uint256 public totalInvestmentAmount;
    uint256 public totalCarbonCreditsIssued;
    
    // Events
    event EntityRegistered(address entity, string name, string entityType, string registrationId);
    event ProjectListed(uint256 projectId, address ngo, uint256 quotation, uint256 securityDeposit);
    event ProjectVerified(uint256 projectId, bool isValid, string verificationType);
    event ProjectFunded(uint256 projectId, uint256 amount, uint256 carbonCredits);
    event InvestmentMade(uint256 projectId, address company, uint256 amount, uint256 carbonCredits, uint256 certificateId);
    event JuryVoted(uint256 projectId, bool decision);
    event RewardClaimed(address claimer, uint256 amount);
    event AddressUpdated(string role, address oldAddress, address newAddress);
    event FeeUpdated(string feeType, uint256 oldFee, uint256 newFee);
    
    // Initialize function for UUPS
    function initialize() public initializer {
        __ERC721_init("Carbon Credit Certificate", "CCC");
        __ERC721URIStorage_init();
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        
        _nextTokenId = 1;
        _nextProjectId = 1;
        
        // Initialize addresses
        nccr = 0x3ce82871448BD13C07dc68742AC04F630dC40BCD;
        govtEmployee = 0x37eAD7cC9696CE8641855A24A246E86dA092c2fF;
        jury = 0x357e83834b4ee81c0e8275943b54bD7a7a27c607;
        minter = 0x3cD87c8d62695eACE952470402c4b479AA410fB0;
        daoTreasury = 0xBEA3918053EeDEe46167a475e5811DCA625cf9Ef;
        
        // Initialize fees (basis points)
        daoDepositFee = 200; // 2%
        platformMarketplaceFee = 200; // 2%
        govtMarketplaceFee = 300; // 3%
        juryRewardPercent = 200; // 2%
        fraudSplitToNCCR = 5000; // 50%
        
        // Deploy carbon token
        carbonToken = new CarbonToken();
        carbonToken.initialize();
    }
    
    // Required for UUPS
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    // 1. Register Entity with optional ID
    function registerEntity(
        address entityAddress,
        string memory name,
        string memory entityType,
        string memory registrationId // Optional - can be empty string
    ) public {
        entities[entityAddress] = Entity({
            name: name,
            entityType: entityType,
            registrationId: registrationId,
            isApproved: true,
            wallet: entityAddress,
            registeredAt: block.timestamp
        });
        
        registeredEntities.push(entityAddress);
        emit EntityRegistered(entityAddress, name, entityType, registrationId);
    }
    
    // 2. Enhanced List Project
    function listProject(
        string memory metadataUri,
        uint256 quotationAmount,
        string memory projectName,
        string memory location
    ) public payable {
        uint256 projectId = _nextProjectId++;
        uint256 securityDeposit = msg.value > 0 ? msg.value : 0;
        
        uint256 daoFee = 0;
        if (securityDeposit > 0) {
            daoFee = (securityDeposit * daoDepositFee) / 10000;
            if (daoFee > 0) {
                pendingWithdrawals[daoTreasury] += daoFee;
            }
        }
        
        projects[projectId] = Project({
            ngo: msg.sender,
            metadataUri: metadataUri,
            quotationAmount: quotationAmount,
            securityDeposit: securityDeposit > daoFee ? securityDeposit - daoFee : 0,
            isListed: true,
            isValidated: false,
            isFraud: false,
            carbonCreditsAmount: quotationAmount,
            status: "PENDING",
            createdAt: block.timestamp,
            validatedAt: 0,
            totalInvested: 0,
            projectName: projectName,
            location: location
        });
        
        allProjects.push(projectId);
        userProjects[msg.sender].push(projectId);
        totalProjectsListed++;
        
        emit ProjectListed(projectId, msg.sender, quotationAmount, securityDeposit);
    }
    
    // 3a. Centralized Verification
    function verifyCentralized(uint256 projectId, bool isValid) public {
        Project storage project = projects[projectId];
        
        if (isValid) {
            project.isValidated = true;
            project.status = "VALIDATED";
            project.validatedAt = block.timestamp;
            pendingWithdrawals[project.ngo] += project.securityDeposit;
            totalProjectsValidated++;
        } else {
            project.isFraud = true;
            project.status = "FRAUD";
            pendingWithdrawals[nccr] += project.securityDeposit;
            totalProjectsFraud++;
        }
        
        verifications[projectId] = Verification({
            isCentralized: true,
            juryVoted: false,
            juryDecision: isValid,
            juryStake: 0,
            verifiedAt: block.timestamp,
            verifier: msg.sender
        });
        
        emit ProjectVerified(projectId, isValid, "CENTRALIZED");
    }
    
    // 3b. Jury staking and voting
    function stakeAsJury(uint256 projectId) public payable {
        uint256 stake = msg.value > 0 ? msg.value : 0;
        verifications[projectId].juryStake += stake;
        if (stake > 0) {
            pendingWithdrawals[daoTreasury] += stake;
        }
    }
    
    function juryVote(uint256 projectId, bool isValid) public {
        Project storage project = projects[projectId];
        Verification storage verification = verifications[projectId];
        
        verification.juryVoted = true;
        verification.juryDecision = isValid;
        verification.verifiedAt = block.timestamp;
        verification.verifier = msg.sender;
        
        if (isValid) {
            project.isValidated = true;
            project.status = "VALIDATED";
            project.validatedAt = block.timestamp;
            pendingWithdrawals[project.ngo] += project.securityDeposit;
            
            uint256 treasuryBalance = pendingWithdrawals[daoTreasury];
            if (treasuryBalance > 0) {
                uint256 reward = (treasuryBalance * juryRewardPercent) / 10000;
                if (reward > 0 && reward <= treasuryBalance) {
                    pendingWithdrawals[jury] += reward;
                    pendingWithdrawals[daoTreasury] -= reward;
                }
            }
            totalProjectsValidated++;
        } else {
            project.isFraud = true;
            project.status = "FRAUD";
            
            if (project.securityDeposit > 0) {
                uint256 nccrAmount = (project.securityDeposit * fraudSplitToNCCR) / 10000;
                uint256 daoAmount = project.securityDeposit - nccrAmount;
                pendingWithdrawals[nccr] += nccrAmount;
                pendingWithdrawals[daoTreasury] += daoAmount;
                
                uint256 treasuryBalance = pendingWithdrawals[daoTreasury];
                if (treasuryBalance > 0) {
                    uint256 reward = (treasuryBalance * juryRewardPercent) / 10000;
                    if (reward > 0 && reward <= treasuryBalance) {
                        pendingWithdrawals[jury] += reward;
                        pendingWithdrawals[daoTreasury] -= reward;
                    }
                }
            }
            totalProjectsFraud++;
        }
        
        emit JuryVoted(projectId, isValid);
        emit ProjectVerified(projectId, isValid, "DECENTRALIZED");
    }
    
    // 4. Release funds
    function releaseFunds(uint256 projectId) public payable {
        Project storage project = projects[projectId];
        
        uint256 amount = msg.value > 0 ? msg.value : 0;
        if (amount > 0) {
            pendingWithdrawals[project.ngo] += amount;
        }
        
        if (project.carbonCreditsAmount > 0) {
            carbonToken.mint(project.ngo, project.carbonCreditsAmount);
            totalCarbonCreditsIssued += project.carbonCreditsAmount;
        }
        
        project.status = "FUNDED";
        emit ProjectFunded(projectId, amount, project.carbonCreditsAmount);
    }
    
    // 5. Enhanced marketplace buy function
    function buyCarbon(uint256 projectId, string memory companyName) public payable {
        Project storage project = projects[projectId];
        
        uint256 amount = msg.value > 0 ? msg.value : 0;
        if (amount > 0) {
            uint256 platformFee = (amount * platformMarketplaceFee) / 10000;
            uint256 govtFee = (amount * govtMarketplaceFee) / 10000;
            uint256 ngoAmount = amount > (platformFee + govtFee) ? amount - platformFee - govtFee : 0;
            
            if (platformFee > 0) pendingWithdrawals[daoTreasury] += platformFee;
            if (govtFee > 0) pendingWithdrawals[nccr] += govtFee;
            if (ngoAmount > 0) pendingWithdrawals[project.ngo] += ngoAmount;
            
            uint256 carbonAmount = 0;
            if (project.quotationAmount > 0) {
                carbonAmount = (amount * project.carbonCreditsAmount) / project.quotationAmount;
                if (carbonAmount > 0) {
                    carbonToken.mint(msg.sender, carbonAmount);
                    totalCarbonCreditsIssued += carbonAmount;
                }
            }
            
            // Mint NFT certificate with detailed metadata
            uint256 certificateId = _nextTokenId++;
            _safeMint(msg.sender, certificateId);
            _setTokenURI(certificateId, project.metadataUri);
            
            // Store certificate metadata
            certificateMetadata[certificateId] = CertificateMetadata({
                projectId: projectId,
                projectName: project.projectName,
                investor: msg.sender,
                investorName: companyName,
                investmentAmount: amount,
                carbonCreditsReceived: carbonAmount,
                issuedAt: block.timestamp,
                projectLocation: project.location
            });
            
            // Record investment
            projectInvestments[projectId].push(Investment({
                projectId: projectId,
                company: msg.sender,
                amount: amount,
                carbonCreditsReceived: carbonAmount,
                certificateNFTId: certificateId,
                investedAt: block.timestamp,
                companyName: companyName
            }));
            
            companyInvestments[msg.sender].push(certificateId);
            project.totalInvested += amount;
            totalInvestedByCompany[msg.sender] += amount;
            totalCarbonCreditsByCompany[msg.sender] += carbonAmount;
            totalInvestmentAmount += amount;
            
            emit InvestmentMade(projectId, msg.sender, amount, carbonAmount, certificateId);
        }
    }
    
    // 6. Withdraw functions
    function withdraw() public {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount > 0) {
            pendingWithdrawals[msg.sender] = 0;
            payable(msg.sender).transfer(amount);
        }
    }
    
    function claimReward() public {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount > 0) {
            pendingWithdrawals[msg.sender] = 0;
            payable(msg.sender).transfer(amount);
            emit RewardClaimed(msg.sender, amount);
        }
    }
    
    // 7. Update functions for addresses and fees
    function updateAllAddresses(
        address _nccr,
        address _govtEmployee,
        address _jury,
        address _minter,
        address _daoTreasury
    ) public {
        nccr = _nccr;
        govtEmployee = _govtEmployee;
        jury = _jury;
        minter = _minter;
        daoTreasury = _daoTreasury;
    }
    
    function updateAllFees(
        uint256 _daoDepositFee,
        uint256 _platformMarketplaceFee,
        uint256 _govtMarketplaceFee,
        uint256 _juryRewardPercent,
        uint256 _fraudSplitToNCCR
    ) public {
        daoDepositFee = _daoDepositFee;
        platformMarketplaceFee = _platformMarketplaceFee;
        govtMarketplaceFee = _govtMarketplaceFee;
        juryRewardPercent = _juryRewardPercent;
        fraudSplitToNCCR = _fraudSplitToNCCR;
    }
    
    // Minimal getters used by the reader

    function getAllProjects() public view returns (uint256[] memory) {
        return allProjects;
    }

    function getUserProjects(address user) public view returns (uint256[] memory) {
        return userProjects[user];
    }

    function getCompanyInvestments(address company) public view returns (uint256[] memory) {
        return companyInvestments[company];
    }

    function getProjectInvestmentHistory(uint256 projectId) public view returns (Investment[] memory) {
        return projectInvestments[projectId];
    }

    function getCertificateDetails(uint256 certificateId) public view returns (CertificateMetadata memory metadata) {
        return certificateMetadata[certificateId];
    }

    function getRegisteredEntities() public view returns (address[] memory) {
        return registeredEntities;
    }

    function getCarbonBalance(address account) public view returns (uint256) {
        return carbonToken.balanceOf(account);
    }

    function getPendingWithdrawal(address account) public view returns (uint256) {
        return pendingWithdrawals[account];
    }
    
    // // Enhanced View Functions
    
    // // Get complete project info
    // function getCompleteProjectInfo(uint256 projectId) public view returns (
    //     Project memory project,
    //     Verification memory verification,
    //     uint256 investmentCount,
    //     uint256 totalInvested
    // ) {
    //     project = projects[projectId];
    //     verification = verifications[projectId];
    //     investmentCount = projectInvestments[projectId].length;
    //     totalInvested = project.totalInvested;
    // }
    
    // // Get entity details
    // function getEntityDetails(address entityAddress) public view returns (Entity memory) {
    //     return entities[entityAddress];
    // }
    
    // // Get all entities by type
    // function getEntitiesByType(string memory entityType) public view returns (address[] memory) {
    //     uint256 count = 0;
    //     for (uint256 i = 0; i < registeredEntities.length; i++) {
    //         if (keccak256(bytes(entities[registeredEntities[i]].entityType)) == keccak256(bytes(entityType))) {
    //             count++;
    //         }
    //     }
        
    //     address[] memory result = new address[](count);
    //     uint256 index = 0;
    //     for (uint256 i = 0; i < registeredEntities.length; i++) {
    //         if (keccak256(bytes(entities[registeredEntities[i]].entityType)) == keccak256(bytes(entityType))) {
    //             result[index++] = registeredEntities[i];
    //         }
    //     }
        
    //     return result;
    // }
    
    // // Get projects by status
    // function getProjectsByStatus(string memory status) public view returns (uint256[] memory) {
    //     uint256 count = 0;
    //     for (uint256 i = 0; i < allProjects.length; i++) {
    //         if (keccak256(bytes(projects[allProjects[i]].status)) == keccak256(bytes(status))) {
    //             count++;
    //         }
    //     }
        
    //     uint256[] memory result = new uint256[](count);
    //     uint256 index = 0;
    //     for (uint256 i = 0; i < allProjects.length; i++) {
    //         if (keccak256(bytes(projects[allProjects[i]].status)) == keccak256(bytes(status))) {
    //             result[index++] = allProjects[i];
    //         }
    //     }
        
    //     return result;
    // }
    
    // // Get certificate details
    // function getCertificateDetails(uint256 certificateId) public view returns (
    //     CertificateMetadata memory metadata,
    //     string memory uri
    // ) {
    //     metadata = certificateMetadata[certificateId];
    //     uri = tokenURI(certificateId);
    // }
    
    // // Get company statistics
    // function getCompanyStats(address company) public view returns (
    //     uint256 totalInvested,
    //     uint256 totalCarbonCredits,
    //     uint256[] memory certificates,
    //     Entity memory entityInfo
    // ) {
    //     totalInvested = totalInvestedByCompany[company];
    //     totalCarbonCredits = totalCarbonCreditsByCompany[company];
    //     certificates = companyInvestments[company];
    //     entityInfo = entities[company];
    // }
    
    // // Get platform statistics
    // function getPlatformStats() public view returns (
    //     uint256 projectsListed,
    //     uint256 projectsValidated,
    //     uint256 projectsFraud,
    //     uint256 totalInvestment,
    //     uint256 totalCarbonCredits,
    //     uint256 totalEntities
    // ) {
    //     return (
    //         totalProjectsListed,
    //         totalProjectsValidated,
    //         totalProjectsFraud,
    //         totalInvestmentAmount,
    //         totalCarbonCreditsIssued,
    //         registeredEntities.length
    //     );
    // }
    
    // // Get all projects with pagination
    // function getProjectsPaginated(uint256 offset, uint256 limit) public view returns (
    //     Project[] memory projectsList,
    //     uint256 total
    // ) {
    //     uint256 end = offset + limit > allProjects.length ? allProjects.length : offset + limit;
    //     uint256 length = end > offset ? end - offset : 0;
        
    //     projectsList = new Project[](length);
    //     for (uint256 i = 0; i < length; i++) {
    //         projectsList[i] = projects[allProjects[offset + i]];
    //     }
        
    //     return (projectsList, allProjects.length);
    // }
    
    // // Get investment history for a project
    // function getProjectInvestmentHistory(uint256 projectId) public view returns (Investment[] memory) {
    //     return projectInvestments[projectId];
    // }
    
    // // Get pending withdrawal amount
    // function getPendingWithdrawal(address account) public view returns (uint256) {
    //     return pendingWithdrawals[account];
    // }
    
    // // Existing view functions
    // function getAllProjects() public view returns (uint256[] memory) {
    //     return allProjects;
    // }
    
    // function getUserProjects(address user) public view returns (uint256[] memory) {
    //     return userProjects[user];
    // }
    
    // function getValidatedProjects() public view returns (uint256[] memory) {
    //     uint256 count = 0;
    //     for (uint256 i = 0; i < allProjects.length; i++) {
    //         if (projects[allProjects[i]].isValidated) {
    //             count++;
    //         }
    //     }
        
    //     uint256[] memory validated = new uint256[](count);
    //     uint256 index = 0;
    //     for (uint256 i = 0; i < allProjects.length; i++) {
    //         if (projects[allProjects[i]].isValidated) {
    //             validated[index++] = allProjects[i];
    //         }
    //     }
        
    //     return validated;
    // }
    
    // function getCarbonBalance(address account) public view returns (uint256) {
    //     return carbonToken.balanceOf(account);
    // }
    
    // function getRegisteredEntities() public view returns (address[] memory) {
    //     return registeredEntities;
    // }
    
    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    // Fallback to accept ETH
    receive() external payable {}
    fallback() external payable {}
}