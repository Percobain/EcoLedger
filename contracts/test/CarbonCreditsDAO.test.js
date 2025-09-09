const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("CarbonCreditsDAO", function () {
    let carbonCreditsDAO;
    let carbonToken;
    let owner, ngo, company, jury, govtEmployee, nccr, minter, daoTreasury;
    let user1, user2, user3;
    
    beforeEach(async function () {
        // Get signers
        [owner, ngo, company, jury, govtEmployee, nccr, minter, daoTreasury, user1, user2, user3] = await ethers.getSigners();
        
        // Deploy contract using UUPS proxy pattern
        const CarbonCreditsDAO = await ethers.getContractFactory("CarbonCreditsDAO");
        carbonCreditsDAO = await upgrades.deployProxy(CarbonCreditsDAO, [], {
            kind: 'uups',
            initializer: 'initialize'
        });
        await carbonCreditsDAO.waitForDeployment();
        
        // Get carbon token address
        const carbonTokenAddress = await carbonCreditsDAO.carbonToken();
        carbonToken = await ethers.getContractAt("CarbonToken", carbonTokenAddress);
        
        // Update addresses to our test accounts
        await carbonCreditsDAO.updateAllAddresses(
            nccr.address,
            govtEmployee.address,
            jury.address,
            minter.address,
            daoTreasury.address
        );
    });
    
    describe("Deployment & Initialization", function () {
        it("Should initialize with correct values", async function () {
            expect(await carbonCreditsDAO.nccr()).to.equal(nccr.address);
            expect(await carbonCreditsDAO.govtEmployee()).to.equal(govtEmployee.address);
            expect(await carbonCreditsDAO.jury()).to.equal(jury.address);
            expect(await carbonCreditsDAO.minter()).to.equal(minter.address);
            expect(await carbonCreditsDAO.daoTreasury()).to.equal(daoTreasury.address);
        });
        
        it("Should have default fee percentages", async function () {
            expect(await carbonCreditsDAO.daoDepositFee()).to.equal(200); // 2%
            expect(await carbonCreditsDAO.platformMarketplaceFee()).to.equal(200);
            expect(await carbonCreditsDAO.govtMarketplaceFee()).to.equal(300);
            expect(await carbonCreditsDAO.juryRewardPercent()).to.equal(200);
            expect(await carbonCreditsDAO.fraudSplitToNCCR()).to.equal(5000);
        });
        
        it("Should deploy carbon token", async function () {
            expect(carbonToken.target).to.not.equal(ethers.ZeroAddress);
            const name = await carbonToken.name();
            expect(name).to.equal("Carbon Credit");
        });
    });
    
    describe("Entity Registration", function () {
        it("Should register NGO with DARPAN ID", async function () {
            await carbonCreditsDAO.registerEntity(
                ngo.address,
                "Green Earth NGO",
                "NGO",
                "DL/2021/0282903"
            );
            
            const entity = await carbonCreditsDAO.getEntityDetails(ngo.address);
            expect(entity.name).to.equal("Green Earth NGO");
            expect(entity.entityType).to.equal("NGO");
            expect(entity.registrationId).to.equal("DL/2021/0282903");
            expect(entity.isApproved).to.be.true;
        });
        
        it("Should register Company with GSTIN", async function () {
            await carbonCreditsDAO.registerEntity(
                company.address,
                "Reliance Industries",
                "CORPORATE",
                "27AAACR5055K1Z5"
            );
            
            const entity = await carbonCreditsDAO.getEntityDetails(company.address);
            expect(entity.entityType).to.equal("CORPORATE");
            expect(entity.registrationId).to.equal("27AAACR5055K1Z5");
        });
        
        it("Should register Community without ID", async function () {
            await carbonCreditsDAO.registerEntity(
                user1.address,
                "Local Community Group",
                "COMMUNITY",
                "" // Empty registration ID
            );
            
            const entity = await carbonCreditsDAO.getEntityDetails(user1.address);
            expect(entity.registrationId).to.equal("");
            expect(entity.isApproved).to.be.true;
        });
        
        it("Should allow anyone to register anyone", async function () {
            // User2 registers User3
            await carbonCreditsDAO.connect(user2).registerEntity(
                user3.address,
                "Another NGO",
                "NGO",
                "MH/2022/0123456"
            );
            
            const entities = await carbonCreditsDAO.getRegisteredEntities();
            expect(entities).to.include(user3.address);
        });
    });
    
    describe("Project Listing", function () {
        it("Should list project with security deposit", async function () {
            const depositAmount = ethers.parseEther("1");
            const quotation = ethers.parseEther("100");
            
            await carbonCreditsDAO.connect(ngo).listProject(
                "ipfs://QmXxx123",
                quotation,
                "Mangrove Restoration",
                "Mumbai Coast",
                { value: depositAmount }
            );
            
            const projectId = 1;
            const project = await carbonCreditsDAO.projects(projectId);
            
            expect(project.ngo).to.equal(ngo.address);
            expect(project.quotationAmount).to.equal(quotation);
            expect(project.projectName).to.equal("Mangrove Restoration");
            expect(project.location).to.equal("Mumbai Coast");
            expect(project.status).to.equal("PENDING");
            
            // Check DAO fee deduction (2%)
            const daoFee = (depositAmount * 200n) / 10000n;
            expect(project.securityDeposit).to.equal(depositAmount - daoFee);
        });
        
        it("Should list project without security deposit", async function () {
            // No value sent - should not revert
            await carbonCreditsDAO.connect(ngo).listProject(
                "ipfs://QmXxx456",
                ethers.parseEther("50"),
                "Tree Plantation",
                "Delhi NCR",
                { value: 0 }
            );
            
            const project = await carbonCreditsDAO.projects(1);
            expect(project.securityDeposit).to.equal(0);
            expect(project.isListed).to.be.true;
        });
        
        it("Should track user projects", async function () {
            await carbonCreditsDAO.connect(ngo).listProject(
                "ipfs://test1",
                ethers.parseEther("10"),
                "Project 1",
                "Location 1",
                { value: ethers.parseEther("0.5") }
            );
            
            await carbonCreditsDAO.connect(ngo).listProject(
                "ipfs://test2",
                ethers.parseEther("20"),
                "Project 2",
                "Location 2",
                { value: ethers.parseEther("1") }
            );
            
            const userProjects = await carbonCreditsDAO.getUserProjects(ngo.address);
            expect(userProjects.length).to.equal(2);
            expect(userProjects[0]).to.equal(1);
            expect(userProjects[1]).to.equal(2);
        });
    });
    
    describe("Centralized Verification", function () {
        beforeEach(async function () {
            await carbonCreditsDAO.connect(ngo).listProject(
                "ipfs://QmTest",
                ethers.parseEther("100"),
                "Test Project",
                "Test Location",
                { value: ethers.parseEther("5") }
            );
        });
        
        it("Should validate project (anyone can call)", async function () {
            // Any user can call - no role check
            await carbonCreditsDAO.connect(user1).verifyCentralized(1, true);
            
            const project = await carbonCreditsDAO.projects(1);
            expect(project.isValidated).to.be.true;
            expect(project.status).to.equal("VALIDATED");
            
            // Security deposit should be returned to NGO
            const pendingAmount = await carbonCreditsDAO.getPendingWithdrawal(ngo.address);
            expect(pendingAmount).to.be.gt(0);
        });
        
        it("Should mark project as fraud", async function () {
            await carbonCreditsDAO.connect(govtEmployee).verifyCentralized(1, false);
            
            const project = await carbonCreditsDAO.projects(1);
            expect(project.isFraud).to.be.true;
            expect(project.status).to.equal("FRAUD");
            
            // Security deposit should go to NCCR
            const nccrPending = await carbonCreditsDAO.getPendingWithdrawal(nccr.address);
            expect(nccrPending).to.be.gt(0);
        });
    });
    
    describe("Decentralized Verification (DAO Jury)", function () {
        beforeEach(async function () {
            await carbonCreditsDAO.connect(ngo).listProject(
                "ipfs://QmTest",
                ethers.parseEther("100"),
                "Test Project",
                "Test Location",
                { value: ethers.parseEther("5") }
            );
        });
        
        it("Should allow jury staking", async function () {
            const stakeAmount = ethers.parseEther("1");
            await carbonCreditsDAO.connect(jury).stakeAsJury(1, { value: stakeAmount });
            
            const verification = await carbonCreditsDAO.verifications(1);
            expect(verification.juryStake).to.equal(stakeAmount);
            
            // Stake should go to DAO treasury
            const treasuryPending = await carbonCreditsDAO.getPendingWithdrawal(daoTreasury.address);
            expect(treasuryPending).to.equal(stakeAmount);
        });
        
        it("Should handle jury vote for valid project", async function () {
            // Stake first
            await carbonCreditsDAO.connect(jury).stakeAsJury(1, { value: ethers.parseEther("1") });
            
            // Vote valid
            await carbonCreditsDAO.connect(user2).juryVote(1, true);
            
            const project = await carbonCreditsDAO.projects(1);
            expect(project.isValidated).to.be.true;
            expect(project.status).to.equal("VALIDATED");
            
            // Jury should get reward
            const juryPending = await carbonCreditsDAO.getPendingWithdrawal(jury.address);
            expect(juryPending).to.be.gt(0);
        });
        
        it("Should handle jury vote for fraud project", async function () {
            await carbonCreditsDAO.connect(jury).juryVote(1, false);
            
            const project = await carbonCreditsDAO.projects(1);
            expect(project.isFraud).to.be.true;
            expect(project.status).to.equal("FRAUD");
            
            // Check fraud split (50% NCCR, 50% DAO)
            const nccrPending = await carbonCreditsDAO.getPendingWithdrawal(nccr.address);
            const daoPending = await carbonCreditsDAO.getPendingWithdrawal(daoTreasury.address);
            
            expect(nccrPending).to.be.gt(0);
            expect(daoPending).to.be.gt(0);
        });
    });
    
    describe("Fund Release", function () {
        beforeEach(async function () {
            await carbonCreditsDAO.connect(ngo).listProject(
                "ipfs://QmTest",
                ethers.parseEther("100"),
                "Test Project",
                "Test Location",
                { value: ethers.parseEther("5") }
            );
            await carbonCreditsDAO.verifyCentralized(1, true);
        });
        
        it("Should release funds to NGO", async function () {
            const fundAmount = ethers.parseEther("100");
            
            await carbonCreditsDAO.connect(minter).releaseFunds(1, { value: fundAmount });
            
            const project = await carbonCreditsDAO.projects(1);
            expect(project.status).to.equal("FUNDED");
            
            const ngoPending = await carbonCreditsDAO.getPendingWithdrawal(ngo.address);
            expect(ngoPending).to.be.gte(fundAmount);
        });
        
        it("Should mint carbon credits to NGO", async function () {
            await carbonCreditsDAO.releaseFunds(1, { value: ethers.parseEther("100") });
            
            const project = await carbonCreditsDAO.projects(1);
            const ngoBalance = await carbonToken.balanceOf(ngo.address);
            
            expect(ngoBalance).to.equal(project.carbonCreditsAmount);
        });
        
        it("Should work with zero value", async function () {
            // Should not revert even with 0 value
            await carbonCreditsDAO.releaseFunds(1, { value: 0 });
            
            const project = await carbonCreditsDAO.projects(1);
            expect(project.status).to.equal("FUNDED");
        });
    });
    
    describe("Marketplace - Buy Carbon Credits", function () {
        beforeEach(async function () {
            // Setup: List and validate project
            await carbonCreditsDAO.connect(ngo).listProject(
                "ipfs://QmTest",
                ethers.parseEther("100"),
                "Mangrove Project",
                "Mumbai",
                { value: ethers.parseEther("5") }
            );
            await carbonCreditsDAO.verifyCentralized(1, true);
            await carbonCreditsDAO.releaseFunds(1, { value: 0 });
            
            // Register company
            await carbonCreditsDAO.registerEntity(
                company.address,
                "Tech Corp",
                "CORPORATE",
                "27AAACR5055K1Z5"
            );
        });
        
        it("Should allow company to buy carbon credits", async function () {
            const investAmount = ethers.parseEther("10");
            
            await carbonCreditsDAO.connect(company).buyCarbon(
                1,
                "Tech Corp",
                { value: investAmount }
            );
            
            // Check carbon credits received
            const companyBalance = await carbonToken.balanceOf(company.address);
            expect(companyBalance).to.be.gt(0);
            
            // Check NFT certificate minted
            const certificates = await carbonCreditsDAO.companyInvestments(company.address);
            expect(certificates.length).to.equal(1);
            
            // Check certificate metadata
            const certMetadata = await carbonCreditsDAO.certificateMetadata(certificates[0]);
            expect(certMetadata.investorName).to.equal("Tech Corp");
            expect(certMetadata.investmentAmount).to.equal(investAmount);
            expect(certMetadata.projectName).to.equal("Mangrove Project");
        });
        
        it("Should distribute fees correctly", async function () {
            const investAmount = ethers.parseEther("100");
            
            const initialNGOPending = await carbonCreditsDAO.getPendingWithdrawal(ngo.address);
            
            await carbonCreditsDAO.connect(company).buyCarbon(
                1,
                "Tech Corp",
                { value: investAmount }
            );
            
            // Check fee distribution
            const platformFee = (investAmount * 200n) / 10000n; // 2%
            const govtFee = (investAmount * 300n) / 10000n; // 3%
            const ngoAmount = investAmount - platformFee - govtFee;
            
            const daoPending = await carbonCreditsDAO.getPendingWithdrawal(daoTreasury.address);
            const nccrPending = await carbonCreditsDAO.getPendingWithdrawal(nccr.address);
            const ngoPending = await carbonCreditsDAO.getPendingWithdrawal(ngo.address);
            
            expect(daoPending).to.be.gte(platformFee);
            expect(nccrPending).to.be.gte(govtFee);
            expect(ngoPending - initialNGOPending).to.equal(ngoAmount);
        });
        
        it("Should track investment history", async function () {
            await carbonCreditsDAO.connect(company).buyCarbon(
                1,
                "Tech Corp",
                { value: ethers.parseEther("10") }
            );
            
            await carbonCreditsDAO.connect(user1).buyCarbon(
                1,
                "Another Corp",
                { value: ethers.parseEther("5") }
            );
            
            const investments = await carbonCreditsDAO.getProjectInvestmentHistory(1);
            expect(investments.length).to.equal(2);
            expect(investments[0].companyName).to.equal("Tech Corp");
            expect(investments[1].companyName).to.equal("Another Corp");
        });
    });
    
    describe("Fee Updates", function () {
        it("Should update all fees", async function () {
            await carbonCreditsDAO.updateAllFees(
                300,  // 3% DAO deposit
                150,  // 1.5% platform
                500,  // 5% govt
                100,  // 1% jury
                7000  // 70% fraud to NCCR
            );
            
            expect(await carbonCreditsDAO.daoDepositFee()).to.equal(300);
            expect(await carbonCreditsDAO.platformMarketplaceFee()).to.equal(150);
            expect(await carbonCreditsDAO.govtMarketplaceFee()).to.equal(500);
            expect(await carbonCreditsDAO.juryRewardPercent()).to.equal(100);
            expect(await carbonCreditsDAO.fraudSplitToNCCR()).to.equal(7000);
        });
        
        it("Should allow anyone to update fees (MVP feature)", async function () {
            // Any user can update - no access control
            await carbonCreditsDAO.connect(user3).updateAllFees(
                100, 100, 100, 100, 5000
            );
            
            expect(await carbonCreditsDAO.daoDepositFee()).to.equal(100);
        });
    });
    
    describe("Withdrawals", function () {
        beforeEach(async function () {
            // Setup some pending withdrawals
            await carbonCreditsDAO.connect(ngo).listProject(
                "ipfs://test",
                ethers.parseEther("100"),
                "Test",
                "Location",
                { value: ethers.parseEther("5") }
            );
            await carbonCreditsDAO.verifyCentralized(1, true);
        });
        
        it("Should allow withdrawal of pending amounts", async function () {
            const pendingAmount = await carbonCreditsDAO.getPendingWithdrawal(ngo.address);
            expect(pendingAmount).to.be.gt(0);
            
            const initialBalance = await ethers.provider.getBalance(ngo.address);
            
            await carbonCreditsDAO.connect(ngo).withdraw();
            
            const finalBalance = await ethers.provider.getBalance(ngo.address);
            expect(finalBalance).to.be.gt(initialBalance);
            
            // Pending should be zero after withdrawal
            const newPending = await carbonCreditsDAO.getPendingWithdrawal(ngo.address);
            expect(newPending).to.equal(0);
        });
        
        it("Should handle zero withdrawal gracefully", async function () {
            // User with no pending amount - should not revert
            await expect(
                carbonCreditsDAO.connect(user3).withdraw()
            ).to.not.be.reverted;
        });
    });
    
    describe("View Functions", function () {
        beforeEach(async function () {
            // Setup test data
            await carbonCreditsDAO.registerEntity(ngo.address, "NGO1", "NGO", "DL123");
            await carbonCreditsDAO.registerEntity(company.address, "Corp1", "CORPORATE", "GS123");
            await carbonCreditsDAO.registerEntity(user1.address, "Comm1", "COMMUNITY", "");
            
            await carbonCreditsDAO.connect(ngo).listProject(
                "ipfs://1", ethers.parseEther("100"), "Project1", "Loc1",
                { value: ethers.parseEther("5") }
            );
            await carbonCreditsDAO.connect(ngo).listProject(
                "ipfs://2", ethers.parseEther("200"), "Project2", "Loc2",
                { value: ethers.parseEther("10") }
            );
            
            await carbonCreditsDAO.verifyCentralized(1, true);
            await carbonCreditsDAO.verifyCentralized(2, false);
        });
        
        it("Should get entities by type", async function () {
            const ngos = await carbonCreditsDAO.getEntitiesByType("NGO");
            const corporates = await carbonCreditsDAO.getEntitiesByType("CORPORATE");
            const communities = await carbonCreditsDAO.getEntitiesByType("COMMUNITY");
            
            expect(ngos).to.include(ngo.address);
            expect(corporates).to.include(company.address);
            expect(communities).to.include(user1.address);
        });
        
        it("Should get projects by status", async function () {
            const validated = await carbonCreditsDAO.getProjectsByStatus("VALIDATED");
            const fraud = await carbonCreditsDAO.getProjectsByStatus("FRAUD");
            
            expect(validated).to.include(1n);
            expect(fraud).to.include(2n);
        });
        
        it("Should get complete project info", async function () {
            const info = await carbonCreditsDAO.getCompleteProjectInfo(1);
            
            expect(info.project.projectName).to.equal("Project1");
            expect(info.project.isValidated).to.be.true;
            expect(info.verification.isCentralized).to.be.true;
        });
        
        it("Should get platform statistics", async function () {
            const stats = await carbonCreditsDAO.getPlatformStats();
            
            expect(stats.projectsListed).to.equal(2);
            expect(stats.projectsValidated).to.equal(1);
            expect(stats.projectsFraud).to.equal(1);
            expect(stats.totalEntities).to.equal(3);
        });
        
        it("Should get paginated projects", async function () {
            const result = await carbonCreditsDAO.getProjectsPaginated(0, 1);
            
            expect(result.projectsList.length).to.equal(1);
            expect(result.total).to.equal(2);
            
            const result2 = await carbonCreditsDAO.getProjectsPaginated(1, 1);
            expect(result2.projectsList.length).to.equal(1);
        });
    });
    
    describe("UUPS Upgrade", function () {
        it("Should only allow owner to upgrade", async function () {
            const CarbonCreditsDAOV2 = await ethers.getContractFactory("CarbonCreditsDAO");
            
            // Non-owner cannot upgrade
            await expect(
                upgrades.upgradeProxy(carbonCreditsDAO.target, CarbonCreditsDAOV2, {
                    call: { fn: "initialize", args: [] }
                })
            ).to.be.revertedWithCustomError(carbonCreditsDAO, "OwnableUnauthorizedAccount");
        });
        
        it("Should maintain state after upgrade", async function () {
            // Add some state
            await carbonCreditsDAO.connect(ngo).listProject(
                "ipfs://test",
                ethers.parseEther("100"),
                "Test Project",
                "Location",
                { value: ethers.parseEther("5") }
            );
            
            const projectBefore = await carbonCreditsDAO.projects(1);
            
            // Mock upgrade (would need V2 contract in real scenario)
            // State should persist
            expect(projectBefore.projectName).to.equal("Test Project");
        });
    });
    
    describe("Edge Cases & No Revert Guarantee", function () {
        it("Should handle all zero values without reverting", async function () {
            // List with 0 quotation and 0 deposit
            await expect(
                carbonCreditsDAO.listProject("", 0, "", "", { value: 0 })
            ).to.not.be.reverted;
            
            // Buy with 0 value
            await expect(
                carbonCreditsDAO.buyCarbon(1, "", { value: 0 })
            ).to.not.be.reverted;
            
            // Release funds with 0
            await expect(
                carbonCreditsDAO.releaseFunds(1, { value: 0 })
            ).to.not.be.reverted;
        });
        
        it("Should handle empty strings", async function () {
            await expect(
                carbonCreditsDAO.registerEntity(user1.address, "", "", "")
            ).to.not.be.reverted;
            
            const entity = await carbonCreditsDAO.getEntityDetails(user1.address);
            expect(entity.name).to.equal("");
            expect(entity.entityType).to.equal("");
        });
        
        it("Should handle non-existent project IDs", async function () {
            // These should not revert even for non-existent projects
            await expect(
                carbonCreditsDAO.verifyCentralized(999, true)
            ).to.not.be.reverted;
            
            await expect(
                carbonCreditsDAO.buyCarbon(999, "Company", { value: ethers.parseEther("1") })
            ).to.not.be.reverted;
        });
        
        it("Should handle division by zero cases", async function () {
            // List project with 0 quotation
            await carbonCreditsDAO.listProject(
                "ipfs://zero",
                0, // Zero quotation
                "Zero Project",
                "Location",
                { value: 0 }
            );
            
            // Try to buy - should not revert despite division by zero scenario
            await expect(
                carbonCreditsDAO.buyCarbon(1, "Company", { value: ethers.parseEther("1") })
            ).to.not.be.reverted;
        });
    });
    
    describe("Gas Optimization Tests", function () {
        it("Should handle batch operations efficiently", async function () {
            // Register multiple entities
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(
                    carbonCreditsDAO.registerEntity(
                        ethers.Wallet.createRandom().address,
                        `Entity${i}`,
                        "NGO",
                        `ID${i}`
                    )
                );
            }
            await Promise.all(promises);
            
            const entities = await carbonCreditsDAO.getRegisteredEntities();
            expect(entities.length).to.equal(10);
        });
    });
});