// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

// Simple ERC20 Carbon Credit Token
contract CarbonToken is ERC20 {
    address public minter;
    
    constructor() ERC20("Carbon Credit", "CC") {
        minter = msg.sender;
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

// Main Contract - EcoLedger Platform
contract EcoLedger is ERC721, ERC721URIStorage {
    CarbonToken public carbonToken;
    
    uint256 private _nextTokenId = 1;
    uint256 private _nextProjectId = 1;
    
    // Government/Platform addresses
    address public nccr = 0x71AfE44200A819171a0687b1026E8d4424472Ff8;
    address public daoTreasury = 0xBEA3918053EeDEe46167a475e5811DCA625cf9Ef; // Escrow wallet
    address public jury = 0x0729a81A995Bed60F4F6C5Ec960bEd999740e160; // Same as FairBNB
    
    // Escrow tracking 
    mapping(address => uint256) public pendingWithdrawals;
    
    // Project Structure
    struct Project {
        address ngo;
        string metadataUri;
        bool isValidated;
        bool isFraud;
        bool isDisputed;
        string status;
        uint256 createdAt;
        uint256 validatedAt;
        string projectName;
        string location;
        uint256 nftTokenId; // Link to NFT
        bool fundsReleased;
    }
    
    // Investment tracking for companies
    struct Investment {
        uint256 projectId;
        address company;
        uint256 certificateNFTId;
        uint256 investedAt;
        string companyName;
        string metadataUri; // ALL investment details stored here
    }
    
    // NFT Certificate for companies
    struct CertificateMetadata {
        uint256 projectId;
        string projectName;
        address investor;
        string investorName;
        uint256 issuedAt;
        string projectLocation;
        string metadataUri; // ALL financial details stored here
    }
    
    // Mappings
    mapping(uint256 => Project) public projects;
    mapping(address => uint256[]) public userProjects; // NGO projects
    mapping(address => uint256[]) public userNFTs; // All NFTs owned
    mapping(uint256 => Investment[]) public projectInvestments;
    mapping(uint256 => CertificateMetadata) public certificateMetadata;
    mapping(address => uint256[]) public companyInvestments;
    
    uint256[] public allProjects;
    uint256[] public allNFTs;
    
    // Events (NO numerical amounts in events - just for tracking)
    event ProjectListed(uint256 projectId, address ngo, uint256 nftTokenId, string metadataUri);
    event ProjectVerified(uint256 projectId, bool isValid, string verificationType);
    event ProjectFunded(uint256 projectId, uint256 carbonCredits);
    event InvestmentMade(uint256 projectId, address company, uint256 carbonCredits, uint256 certificateId);
    event NFTMinted(uint256 tokenId, address owner, string uri, string projectName);
    event DisputeRaised(uint256 projectId);
    event DisputeResolved(uint256 projectId, bool ngoWins, uint256 juryReward);
    event JuryChanged(address oldJury, address newJury);
    event FundsWithdrawn(address user, uint256 amount);
    
    constructor() ERC721("Carbon Project Certificate", "CPC") {
        carbonToken = new CarbonToken();
    }
    
    // 1. List Project & Mint NFT
    function listProject(
        string memory metadataUri, // ALL financial data stored here
        string memory projectName,
        string memory location
    ) public payable {
        uint256 projectId = _nextProjectId++;
        uint256 tokenId = _nextTokenId++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataUri);

        if (msg.value > 0) {
            pendingWithdrawals[daoTreasury] += msg.value;
        }

        projects[projectId] = Project({
            ngo: msg.sender,
            metadataUri: metadataUri,
            isValidated: false,
            isFraud: false,
            isDisputed: false,
            status: "PENDING",
            createdAt: block.timestamp,
            validatedAt: 0,
            projectName: projectName,
            location: location,
            nftTokenId: tokenId,
            fundsReleased: false
        });
        
        // Track data
        allProjects.push(projectId);
        allNFTs.push(tokenId);
        userProjects[msg.sender].push(projectId);
        userNFTs[msg.sender].push(tokenId);
        
        emit ProjectListed(projectId, msg.sender, tokenId, metadataUri);
        emit NFTMinted(tokenId, msg.sender, metadataUri, projectName);
    }
    
    // 2. Verify Project (NCCR/Government) - Happy Path
    function verifyCentralized(uint256 projectId, bool isValid) public {
        Project storage project = projects[projectId];
        
        project.isValidated = isValid;
        project.status = isValid ? "VALIDATED" : "FRAUD";
        project.isFraud = !isValid;
        project.validatedAt = block.timestamp;
        
        // If valid, NGO can get their security deposit back ( happy path)
        if (isValid) {
            // Transfer escrow amount to NGO for withdrawal
            uint256 escrowAmount = pendingWithdrawals[daoTreasury];
            if (escrowAmount > 0) {
                pendingWithdrawals[daoTreasury] = 0;
                pendingWithdrawals[project.ngo] += escrowAmount;
            }
        }
        
        emit ProjectVerified(projectId, isValid, "CENTRALIZED");
    }
    
    // 3. Raise Dispute ( dispute system)
    function raiseDispute(uint256 projectId) public {
        projects[projectId].isDisputed = true;
        emit DisputeRaised(projectId);
    }
    
    // 4. Resolve Dispute (Jury function - )
    function resolveDispute(uint256 projectId, bool ngoWins) public {
        Project storage project = projects[projectId];
        
        // Calculate jury reward ( - half of dispute fee equivalent)
        uint256 escrowAmount = pendingWithdrawals[daoTreasury];
        uint256 juryReward = escrowAmount / 2;
        
        if (ngoWins) {
            // NGO wins: gets remaining escrow minus jury reward
            uint256 ngoAmount = escrowAmount - juryReward;
            pendingWithdrawals[daoTreasury] = 0;
            pendingWithdrawals[project.ngo] += ngoAmount;
            pendingWithdrawals[jury] += juryReward;
            
            project.status = "VALIDATED";
            project.isValidated = true;
        } else {
            // NCCR wins: gets remaining escrow minus jury reward
            uint256 nccrAmount = escrowAmount - juryReward;
            pendingWithdrawals[daoTreasury] = 0;
            pendingWithdrawals[nccr] += nccrAmount;
            pendingWithdrawals[jury] += juryReward;
            
            project.status = "FRAUD";
            project.isFraud = true;
        }
        
        project.isDisputed = false;
        project.validatedAt = block.timestamp;
        
        emit DisputeResolved(projectId, ngoWins, juryReward);
        emit ProjectVerified(projectId, ngoWins, "DECENTRALIZED");
    }
    
    // 5. Fund Project 
    function releaseFunds(uint256 projectId, uint256 carbonCreditsAmount) public payable {
        Project storage project = projects[projectId];

        if (msg.value > 0) {
            pendingWithdrawals[project.ngo] += msg.value;
        }
        
        // Mint carbon credits to NGO 
        if (carbonCreditsAmount > 0) {
            carbonToken.mint(project.ngo, carbonCreditsAmount);
        }
        
        project.status = "FUNDED";
        project.fundsReleased = true;
        emit ProjectFunded(projectId, carbonCreditsAmount);
    }
    
    // 6. Company Investment 
    function buyCarbon(
        uint256 projectId, 
        uint256 carbonCreditsAmount, // Actual carbon credits to mint
        string memory companyName,
        string memory investmentMetadataUri // ALL financial details stored here
    ) public payable {
        Project storage project = projects[projectId];
        
        if (msg.value > 0) {
            // Split like government model: platform fee + NGO + NCCR
            uint256 platformFee = msg.value / 10; // 10% to platform
            uint256 nccrFee = msg.value / 20; // 5% to NCCR
            uint256 ngoAmount = msg.value - platformFee - nccrFee;
            
            pendingWithdrawals[daoTreasury] += platformFee;
            pendingWithdrawals[nccr] += nccrFee;
            pendingWithdrawals[project.ngo] += ngoAmount;
        }
        
        // Mint carbon credits to company 
        if (carbonCreditsAmount > 0) {
            carbonToken.mint(msg.sender, carbonCreditsAmount);
        }
        
        // Mint investment certificate NFT 
        uint256 certificateId = _nextTokenId++;
        _safeMint(msg.sender, certificateId);
        _setTokenURI(certificateId, investmentMetadataUri);
        
        // Store certificate metadata 
        certificateMetadata[certificateId] = CertificateMetadata({
            projectId: projectId,
            projectName: project.projectName,
            investor: msg.sender,
            investorName: companyName,
            issuedAt: block.timestamp,
            projectLocation: project.location,
            metadataUri: investmentMetadataUri
        });
        
        // Record investment 
        projectInvestments[projectId].push(Investment({
            projectId: projectId,
            company: msg.sender,
            certificateNFTId: certificateId,
            investedAt: block.timestamp,
            companyName: companyName,
            metadataUri: investmentMetadataUri
        }));
        
        // Track data
        allNFTs.push(certificateId);
        userNFTs[msg.sender].push(certificateId);
        companyInvestments[msg.sender].push(certificateId);
        
        emit InvestmentMade(projectId, msg.sender, carbonCreditsAmount, certificateId);
        emit NFTMinted(certificateId, msg.sender, investmentMetadataUri, companyName);
    }
    
    // 7. Change jury address ()
    function changeJury(address newJury) public {
        address oldJury = jury;
        jury = newJury;
        emit JuryChanged(oldJury, newJury);
    }
    
    // 8. Withdraw accumulated funds ()
    function withdraw() public {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount > 0) {
            pendingWithdrawals[msg.sender] = 0;
            payable(msg.sender).transfer(amount);
            emit FundsWithdrawn(msg.sender, amount);
        }
    }
    
    // VIEW FUNCTIONS (All the same as before)
    function getAllProjects() public view returns (uint256[] memory) {
        return allProjects;
    }
    
    function getUserProjects(address user) public view returns (uint256[] memory) {
        return userProjects[user];
    }
    
    function getUserNFTs(address user) public view returns (uint256[] memory) {
        return userNFTs[user];
    }
    
    function getAllNFTs() public view returns (uint256[] memory) {
        return allNFTs;
    }
    
    function getCompanyInvestments(address company) public view returns (uint256[] memory) {
        return companyInvestments[company];
    }
    
    function getCertificateDetails(uint256 certificateId) public view returns (CertificateMetadata memory) {
        return certificateMetadata[certificateId];
    }
    
    function getCarbonBalance(address account) public view returns (uint256) {
        return carbonToken.balanceOf(account);
    }
    
    function getProjectInvestmentHistory(uint256 projectId) public view returns (Investment[] memory) {
        return projectInvestments[projectId];
    }
    
    function getPendingWithdrawal(address account) public view returns (uint256) {
        return pendingWithdrawals[account];
    }
    
    function getAllNFTsWithDetails() public view returns (
        uint256[] memory tokenIds,
        address[] memory owners,
        string[] memory uris,
        string[] memory projectNames,
        bool[] memory isProjectNFT
    ) {
        uint256 total = allNFTs.length;
        
        tokenIds = new uint256[](total);
        owners = new address[](total);
        uris = new string[](total);
        projectNames = new string[](total);
        isProjectNFT = new bool[](total);
        
        for (uint256 i = 0; i < total; i++) {
            uint256 tokenId = allNFTs[i];
            tokenIds[i] = tokenId;
            
            try this.ownerOf(tokenId) returns (address owner) {
                owners[i] = owner;
                uris[i] = tokenURI(tokenId);
                
                bool foundAsProject = false;
                for (uint256 j = 1; j < _nextProjectId; j++) {
                    if (projects[j].nftTokenId == tokenId) {
                        projectNames[i] = projects[j].projectName;
                        isProjectNFT[i] = true;
                        foundAsProject = true;
                        break;
                    }
                }
                
                if (!foundAsProject) {
                    CertificateMetadata memory cert = certificateMetadata[tokenId];
                    projectNames[i] = string(abi.encodePacked("Certificate - ", cert.investorName));
                    isProjectNFT[i] = false;
                }
            } catch {
                owners[i] = address(0);
            }
        }
        
        return (tokenIds, owners, uris, projectNames, isProjectNFT);
    }
    
    function getVerification(uint256 projectId) public view returns (
        bool isValidated,
        bool isFraud,
        bool isDisputed,
        string memory status,
        uint256 validatedAt
    ) {
        Project memory project = projects[projectId];
        return (
            project.isValidated,
            project.isFraud,
            project.isDisputed,
            project.status,
            project.validatedAt
        );
    }
    
    function getRegisteredEntities() public view returns (address[] memory) {
        address[] memory entities = new address[](3);
        entities[0] = nccr;
        entities[1] = daoTreasury;
        entities[2] = jury;
        return entities;
    }
    
    function totalProjectsListed() public view returns (uint256) {
        return allProjects.length;
    }
    
    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    receive() external payable {}
    fallback() external payable {}
}