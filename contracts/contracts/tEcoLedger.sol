// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

// ERC20 Carbon Credit Token
contract CarbonToken is ERC20 {
    address public minter;
    
    constructor() ERC20("Carbon Credit", "CC") {
        minter = msg.sender;
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

// Main Carbon Credits Platform Contract
contract CarbonCreditsDAO is ERC721, ERC721URIStorage {
    CarbonToken public carbonToken;
    
    uint256 private _nextTokenId = 1;
    uint256 private _nextProjectId = 1;
    
    // Hardcoded addresses for MVP
    address public nccr = 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4; // Change this
    address public govtEmployee = 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2; // Change this
    address public jury = 0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db; // Change this
    address public minter = 0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB; // Change this
    address public daoTreasury = 0x617F2E2fD72FD9D5503197092aC168c91465E7f2; // Change this


    uint256 public daoDepositFee = 200; // 2% default
    uint256 public platformMarketplaceFee = 200; // 2% default  
    uint256 public govtMarketplaceFee = 300; // 3% default
    uint256 public juryRewardPercent = 1000; // 10% default
    uint256 public fraudSplitToNCCR = 5000; // 50% default
    
    // Entity Management
    struct Entity {
        string name;
        string entityType; // "NGO", "CORPORATE", "COMMUNITY"
        bool isApproved;
        address wallet;
    }
    
    // Project/Listing Management
    struct Project {
        address ngo;
        string metadataUri; // IPFS URI with all docs
        uint256 quotationAmount;
        uint256 securityDeposit;
        bool isListed;
        bool isValidated;
        bool isFraud;
        uint256 carbonCreditsAmount;
        string status; // "PENDING", "VALIDATED", "FRAUD", "FUNDED"
    }
    
    // Verification
    struct Verification {
        bool isCentralized;
        bool juryVoted;
        bool juryDecision; // true = valid, false = fraud
        uint256 juryStake;
    }
    
    // Marketplace
    struct Investment {
        uint256 projectId;
        address company;
        uint256 amount;
        uint256 carbonCreditsReceived;
        uint256 certificateNFTId;
    }
    
    // Mappings
    mapping(address => Entity) public entities;
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Verification) public verifications;
    mapping(uint256 => Investment[]) public projectInvestments;
    mapping(address => uint256) public pendingWithdrawals;
    mapping(address => uint256[]) public userProjects;
    mapping(address => uint256[]) public companyInvestments;
    
    address[] public registeredEntities;
    uint256[] public allProjects;
    
    // Events
    event EntityRegistered(address entity, string name, string entityType);
    event ProjectListed(uint256 projectId, address ngo, uint256 quotation, uint256 securityDeposit);
    event ProjectVerified(uint256 projectId, bool isValid, string verificationType);
    event ProjectFunded(uint256 projectId, uint256 amount, uint256 carbonCredits);
    event InvestmentMade(uint256 projectId, address company, uint256 amount, uint256 carbonCredits, uint256 certificateId);
    event JuryVoted(uint256 projectId, bool decision);
    event RewardClaimed(address jury, uint256 amount);
    event AddressUpdated(string role, address oldAddress, address newAddress);
    event FeeUpdated(string feeType, uint256 oldValue, uint256 newValue);
    
    constructor() ERC721("Carbon Credit Certificate", "CCC") {
        carbonToken = new CarbonToken();
    }
    
    // 1. Register Entity (NGO, Corporate, Community) - Anyone can register anyone
    function registerEntity(
        address entityAddress,
        string memory name,
        string memory entityType
    ) public {
        entities[entityAddress] = Entity({
            name: name,
            entityType: entityType,
            isApproved: true, // Auto-approve for MVP
            wallet: entityAddress
        });
        
        registeredEntities.push(entityAddress);
        emit EntityRegistered(entityAddress, name, entityType);
    }
    
    // 2. List Plantation Project - NGO submits project
    function listProject(
        string memory metadataUri,
        uint256 quotationAmount
    ) public payable {
        uint256 projectId = _nextProjectId++;
        uint256 securityDeposit = msg.value;
        
        // 2% of security deposit goes to DAO treasury
        uint256 daoFee = (securityDeposit * 2) / 100;
        pendingWithdrawals[daoTreasury] += daoFee;
        
        projects[projectId] = Project({
            ngo: msg.sender,
            metadataUri: metadataUri,
            quotationAmount: quotationAmount,
            securityDeposit: securityDeposit - daoFee,
            isListed: true,
            isValidated: false,
            isFraud: false,
            carbonCreditsAmount: quotationAmount, // 1:1 for simplicity
            status: "PENDING"
        });
        
        allProjects.push(projectId);
        userProjects[msg.sender].push(projectId);
        
        emit ProjectListed(projectId, msg.sender, quotationAmount, securityDeposit);
    }
    
    // 3a. Centralized Verification - Govt Employee validates
    function verifyCentralized(uint256 projectId, bool isValid) public {
        Project storage project = projects[projectId];
        
        if (isValid) {
            project.isValidated = true;
            project.status = "VALIDATED";
            // Return security deposit to NGO
            pendingWithdrawals[project.ngo] += project.securityDeposit;
        } else {
            project.isFraud = true;
            project.status = "FRAUD";
            // Security deposit goes to NCCR
            pendingWithdrawals[nccr] += project.securityDeposit;
        }
        
        verifications[projectId].isCentralized = true;
        emit ProjectVerified(projectId, isValid, "CENTRALIZED");
    }
    
    // 3b. Decentralized Verification - Jury stakes and votes
    function stakeAsJury(uint256 projectId) public payable {
        verifications[projectId].juryStake += msg.value;
        pendingWithdrawals[daoTreasury] += msg.value;
    }
    
    function juryVote(uint256 projectId, bool isValid) public {
        Project storage project = projects[projectId];
        Verification storage verification = verifications[projectId];
        
        verification.juryVoted = true;
        verification.juryDecision = isValid;
        
        if (isValid) {
            project.isValidated = true;
            project.status = "VALIDATED";
            // Return security deposit to NGO
            pendingWithdrawals[project.ngo] += project.securityDeposit;
            // Dynamic jury reward (basis points)
            uint256 reward = (pendingWithdrawals[daoTreasury] * juryRewardPercent) / 10000;
            pendingWithdrawals[jury] += reward;
            pendingWithdrawals[daoTreasury] -= reward;
        } else {
            project.isFraud = true;
            project.status = "FRAUD";
            // Dynamic fraud split (basis points)
            uint256 nccrAmount = (project.securityDeposit * fraudSplitToNCCR) / 10000;
            uint256 daoAmount = project.securityDeposit - nccrAmount;
            pendingWithdrawals[nccr] += nccrAmount;
            pendingWithdrawals[daoTreasury] += daoAmount;
            // Dynamic jury reward (basis points)
            uint256 reward = (pendingWithdrawals[daoTreasury] * juryRewardPercent) / 10000;
            pendingWithdrawals[jury] += reward;
            pendingWithdrawals[daoTreasury] -= reward;
        }
        
        emit JuryVoted(projectId, isValid);
        emit ProjectVerified(projectId, isValid, "DECENTRALIZED");
    }
    
    // 4. Minter releases funds and carbon credits
    function releaseFunds(uint256 projectId) public payable {
        Project storage project = projects[projectId];
        
        // Transfer funds to NGO (anyone can call and pay)
        if (msg.value > 0) {
            pendingWithdrawals[project.ngo] += msg.value;
        }
        
        // Mint carbon credits to NGO
        carbonToken.mint(project.ngo, project.carbonCreditsAmount);
        
        project.status = "FUNDED";
        emit ProjectFunded(projectId, msg.value, project.carbonCreditsAmount);
    }
    
    // 5. Marketplace - Companies buy carbon credits
    function buyCarbon(uint256 projectId) public payable {
        Project storage project = projects[projectId];
        
        if (msg.value > 0) {
            // Dynamic fee percentages (basis points)
            uint256 platformFee = (msg.value * platformMarketplaceFee) / 10000;
            uint256 govtFee = (msg.value * govtMarketplaceFee) / 10000;
            uint256 ngoAmount = msg.value - platformFee - govtFee;
            
            // Distribute funds
            pendingWithdrawals[daoTreasury] += platformFee;
            pendingWithdrawals[nccr] += govtFee;
            pendingWithdrawals[project.ngo] += ngoAmount;
            
            // Calculate carbon credits (proportional to payment)
            uint256 carbonAmount = (msg.value * project.carbonCreditsAmount) / project.quotationAmount;
            
            // Mint NFT certificate
            uint256 certificateId = _nextTokenId++;
            _safeMint(msg.sender, certificateId);
            _setTokenURI(certificateId, project.metadataUri);
            
            // Transfer carbon credits from NGO to company (simplified - direct mint)
            carbonToken.mint(msg.sender, carbonAmount);
            
            // Record investment
            projectInvestments[projectId].push(Investment({
                projectId: projectId,
                company: msg.sender,
                amount: msg.value,
                carbonCreditsReceived: carbonAmount,
                certificateNFTId: certificateId
            }));
            
            companyInvestments[msg.sender].push(certificateId);
            
            emit InvestmentMade(projectId, msg.sender, msg.value, carbonAmount, certificateId);
        }
    }
    
    // 6. Claim rewards (for jury)
    function claimReward() public {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount > 0) {
            pendingWithdrawals[msg.sender] = 0;
            payable(msg.sender).transfer(amount);
            emit RewardClaimed(msg.sender, amount);
        }
    }
    
    // 7. Withdraw accumulated funds
    function withdraw() public {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount > 0) {
            pendingWithdrawals[msg.sender] = 0;
            payable(msg.sender).transfer(amount);
        }
    }
    
    // 8. Update key addresses - Anyone can change (for MVP flexibility)
    function updateNCCR(address newNCCR) public {
        address oldNCCR = nccr;
        nccr = newNCCR;
        emit AddressUpdated("NCCR", oldNCCR, newNCCR);
    }
    
    function updateGovtEmployee(address newGovtEmployee) public {
        address oldGovtEmployee = govtEmployee;
        govtEmployee = newGovtEmployee;
        emit AddressUpdated("GovtEmployee", oldGovtEmployee, newGovtEmployee);
    }
    
    function updateJury(address newJury) public {
        address oldJury = jury;
        jury = newJury;
        emit AddressUpdated("Jury", oldJury, newJury);
    }
    
    function updateMinter(address newMinter) public {
        address oldMinter = minter;
        minter = newMinter;
        emit AddressUpdated("Minter", oldMinter, newMinter);
    }
    
    function updateDAOTreasury(address newDAOTreasury) public {
        address oldDAOTreasury = daoTreasury;
        daoTreasury = newDAOTreasury;
        emit AddressUpdated("DAOTreasury", oldDAOTreasury, newDAOTreasury);
    }
    
    // Batch update all addresses at once
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
    
    // 9. Update fee percentages - Anyone can change (for MVP flexibility)
    function updateDAODepositFee(uint256 newFee) public {
        uint256 oldFee = daoDepositFee;
        daoDepositFee = newFee;
        emit FeeUpdated("DAODepositFee", oldFee, newFee);
    }
    
    function updatePlatformMarketplaceFee(uint256 newFee) public {
        uint256 oldFee = platformMarketplaceFee;
        platformMarketplaceFee = newFee;
        emit FeeUpdated("PlatformMarketplaceFee", oldFee, newFee);
    }
    
    function updateGovtMarketplaceFee(uint256 newFee) public {
        uint256 oldFee = govtMarketplaceFee;
        govtMarketplaceFee = newFee;
        emit FeeUpdated("GovtMarketplaceFee", oldFee, newFee);
    }
    
    function updateJuryRewardPercent(uint256 newFee) public {
        uint256 oldFee = juryRewardPercent;
        juryRewardPercent = newFee;
        emit FeeUpdated("JuryRewardPercent", oldFee, newFee);
    }
    
    function updateFraudSplitToNCCR(uint256 newSplit) public {
        uint256 oldSplit = fraudSplitToNCCR;
        fraudSplitToNCCR = newSplit;
        emit FeeUpdated("FraudSplitToNCCR", oldSplit, newSplit);
    }
    
    // Batch update all fees at once
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
    
    // View Functions
    function getAllProjects() public view returns (uint256[] memory) {
        return allProjects;
    }
    
    function getUserProjects(address user) public view returns (uint256[] memory) {
        return userProjects[user];
    }
    
    function getValidatedProjects() public view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < allProjects.length; i++) {
            if (projects[allProjects[i]].isValidated) {
                count++;
            }
        }
        
        uint256[] memory validated = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allProjects.length; i++) {
            if (projects[allProjects[i]].isValidated) {
                validated[index++] = allProjects[i];
            }
        }
        
        return validated;
    }
    
    function getProjectDetails(uint256 projectId) public view returns (
        address ngo,
        string memory metadataUri,
        uint256 quotation,
        uint256 securityDeposit,
        bool isValidated,
        string memory status,
        uint256 carbonCredits
    ) {
        Project memory p = projects[projectId];
        return (p.ngo, p.metadataUri, p.quotationAmount, p.securityDeposit, 
                p.isValidated, p.status, p.carbonCreditsAmount);
    }
    
    function getProjectInvestments(uint256 projectId) public view returns (Investment[] memory) {
        return projectInvestments[projectId];
    }
    
    function getCompanyInvestments(address company) public view returns (uint256[] memory) {
        return companyInvestments[company];
    }
    
    function getCarbonBalance(address account) public view returns (uint256) {
        return carbonToken.balanceOf(account);
    }
    
    function getRegisteredEntities() public view returns (address[] memory) {
        return registeredEntities;
    }
    
    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    // Fallback to accept ETH
    receive() external payable {}
    fallback() external payable {}
}