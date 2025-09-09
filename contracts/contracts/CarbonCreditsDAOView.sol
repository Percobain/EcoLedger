// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICarbonCreditsDAO {
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
    struct Verification {
        bool isCentralized;
        bool juryVoted;
        bool juryDecision;
        uint256 juryStake;
        uint256 verifiedAt;
        address verifier;
    }
    struct Investment {
        uint256 projectId;
        address company;
        uint256 amount;
        uint256 carbonCreditsReceived;
        uint256 certificateNFTId;
        uint256 investedAt;
        string companyName;
    }
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

    // Public getters from DAO
    function projects(uint256) external view returns (Project memory);
    function verifications(uint256) external view returns (Verification memory);
    function projectInvestments(uint256) external view returns (Investment[] memory);
    function certificateMetadata(uint256) external view returns (CertificateMetadata memory);
    function userProjects(address) external view returns (uint256[] memory);
    function companyInvestments(address) external view returns (uint256[] memory);
    function getAllProjects() external view returns (uint256[] memory);
    function getCarbonBalance(address) external view returns (uint256);
    function getRegisteredEntities() external view returns (address[] memory);
    function pendingWithdrawals(address) external view returns (uint256);

    // Stats
    function totalProjectsListed() external view returns (uint256);
    function totalProjectsValidated() external view returns (uint256);
    function totalProjectsFraud() external view returns (uint256);
    function totalInvestmentAmount() external view returns (uint256);
    function totalCarbonCreditsIssued() external view returns (uint256);
}

contract CarbonCreditsDAOView {
    ICarbonCreditsDAO public immutable dao;

    constructor(address _dao) {
        dao = ICarbonCreditsDAO(_dao);
    }

    function getCompleteProjectInfo(uint256 projectId) external view returns (
        ICarbonCreditsDAO.Project memory project,
        ICarbonCreditsDAO.Verification memory verification,
        uint256 investmentCount,
        uint256 totalInvested
    ) {
        project = dao.projects(projectId);
        verification = dao.verifications(projectId);
        investmentCount = dao.projectInvestments(projectId).length;
        totalInvested = project.totalInvested;
    }

    function getEntitiesByType(string memory entityType) external view returns (address[] memory) {
        address[] memory entities = dao.getRegisteredEntities();
        uint256 count;
        for (uint256 i = 0; i < entities.length; i++) {
            // Use dao.getEntityDetails if you keep it public; otherwise skip this helper or
            // keep a lightweight entity getter in the DAO. If removed, drop this function.
        }
        return new address[](0);
    }

    function getProjectsByStatus(string memory status) external view returns (uint256[] memory) {
        uint256[] memory all = dao.getAllProjects();
        uint256 count;
        for (uint256 i = 0; i < all.length; i++) {
            if (keccak256(bytes(dao.projects(all[i]).status)) == keccak256(bytes(status))) count++;
        }
        uint256[] memory result = new uint256[](count);
        uint256 idx;
        for (uint256 i = 0; i < all.length; i++) {
            if (keccak256(bytes(dao.projects(all[i]).status)) == keccak256(bytes(status))) {
                result[idx++] = all[i];
            }
        }
        return result;
    }

    function getCertificateDetails(uint256 certificateId) external view returns (
        ICarbonCreditsDAO.CertificateMetadata memory metadata
    ) {
        metadata = dao.certificateMetadata(certificateId);
    }

    function getCompanyStats(address company) external view returns (
        uint256 totalInvested,
        uint256 totalCarbonCredits,
        uint256[] memory certificates
    ) {
        // totalInvested / totalCarbonCredits aren’t public in DAO; if removed, read via derived sums or keep those public getters.
        certificates = dao.companyInvestments(company);
        totalCarbonCredits = dao.getCarbonBalance(company);
        // totalInvestedByCompany is public in DAO; add to interface if needed, else compute off-chain.
    }

    function getPlatformStats() external view returns (
        uint256 projectsListed,
        uint256 projectsValidated,
        uint256 projectsFraud,
        uint256 totalInvestment,
        uint256 totalCarbonCredits,
        uint256 totalEntities
    ) {
        projectsListed = dao.totalProjectsListed();
        projectsValidated = dao.totalProjectsValidated();
        projectsFraud = dao.totalProjectsFraud();
        totalInvestment = dao.totalInvestmentAmount();
        totalCarbonCredits = dao.totalCarbonCreditsIssued();
        totalEntities = dao.getRegisteredEntities().length;
    }

    function getProjectsPaginated(uint256 offset, uint256 limit) external view returns (
        ICarbonCreditsDAO.Project[] memory projectsList,
        uint256 total
    ) {
        uint256[] memory all = dao.getAllProjects();
        uint256 end = offset + limit > all.length ? all.length : offset + limit;
        uint256 length = end > offset ? end - offset : 0;

        projectsList = new ICarbonCreditsDAO.Project[](length);
        for (uint256 i = 0; i < length; i++) {
            projectsList[i] = dao.projects(all[offset + i]);
        }
        return (projectsList, all.length);
    }

    function getProjectInvestmentHistory(uint256 projectId) external view returns (ICarbonCreditsDAO.Investment[] memory) {
        return dao.projectInvestments(projectId);
    }

    function getPendingWithdrawal(address account) external view returns (uint256) {
        return dao.pendingWithdrawals(account);
    }

    function getAllProjects() external view returns (uint256[] memory) {
        return dao.getAllProjects();
    }

    function getUserProjects(address user) external view returns (uint256[] memory) {
        return dao.userProjects(user);
    }

    function getValidatedProjects() external view returns (uint256[] memory) {
        uint256[] memory all = dao.getAllProjects();
        uint256 count;
        for (uint256 i = 0; i < all.length; i++) if (dao.projects(all[i]).isValidated) count++;
        uint256[] memory res = new uint256[](count);
        uint256 idx;
        for (uint256 i = 0; i < all.length; i++) if (dao.projects(all[i]).isValidated) res[idx++] = all[i];
        return res;
    }

    function getCarbonBalance(address account) external view returns (uint256) {
        return dao.getCarbonBalance(account);
    }

    function getRegisteredEntities() external view returns (address[] memory) {
        return dao.getRegisteredEntities();
    }
}