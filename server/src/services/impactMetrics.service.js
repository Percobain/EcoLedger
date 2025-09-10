const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates environmental impact metrics from project IPFS data using Gemini AI
 * @param {Object} projectData - Project data from IPFS metadata
 * @returns {Promise<Object>} Generated impact metrics
 */
exports.generateImpactMetrics = async (projectData) => {
    try {
        console.log("🌱 Starting Gemini Impact Metrics Generation");
        console.log("📊 Project Data:", JSON.stringify(projectData, null, 2));

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = buildImpactMetricsPrompt(projectData);

        console.log("📝 Gemini Prompt for Impact Metrics:");
        console.log("-".repeat(50));
        console.log(prompt);
        console.log("-".repeat(50));

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text();

        console.log("🤖 Gemini Response for Impact Metrics:");
        console.log("-".repeat(50));
        console.log(content);
        console.log("-".repeat(50));

        // Parse the response
        const parsedMetrics = parseImpactMetricsResponse(content, projectData);

        console.log("📋 Parsed Impact Metrics:", JSON.stringify(parsedMetrics, null, 2));
        console.log("=".repeat(50));

        return parsedMetrics;
    } catch (error) {
        console.error("Gemini impact metrics generation error:", error);
        // Fallback to calculated metrics based on project data
        return generateFallbackMetrics(projectData);
    }
};

/**
 * Builds comprehensive prompt for impact metrics generation
 */
function buildImpactMetricsPrompt(projectData) {
    const {
        name,
        description,
        project_details,
        about_project,
        attributes,
        financial_details
    } = projectData;

    return `You are an expert environmental scientist specializing in carbon sequestration and ecosystem restoration. 
Analyze the following project data and generate realistic environmental impact metrics.

PROJECT DATA:
- Project Name: ${name || 'Unknown'}
- Description: ${description || 'No description'}
- Location: ${project_details?.location || about_project?.total_area || 'Unknown'}
- Species: ${project_details?.species_planted || about_project?.species || 'Unknown'}
- Target Plants: ${project_details?.target_plants || about_project?.target_plants || 0}
- Total Area: ${project_details?.total_area || about_project?.total_area || 'Unknown'}
- Ecosystem: ${project_details?.ecosystem || about_project?.ecosystem || 'Unknown'}
- Carbon Capture: ${project_details?.carbon_capture || about_project?.carbon_capture || 'Unknown'}
- Biodiversity Score: ${project_details?.biodiversity_score || about_project?.biodiversity_score || 'Unknown'}
- Community Impact: ${project_details?.community_impact || about_project?.community_impact || 'Unknown'}
- Budget: ₹${financial_details?.estimated_budget_inr || 0} Lakhs

TASK: Generate the following environmental impact metrics based on the project data:

1. TREES PLANTED: Use the target_plants value directly
2. CARBON SEQUESTERED: Calculate based on ecosystem type, number of trees, and area. Use scientific formulas:
   - Mangrove Forest: 3-5 tons CO2/hectare/year
   - Coastal Wetland: 2-4 tons CO2/hectare/year  
   - Seagrass Meadow: 1-3 tons CO2/hectare/year
   - Salt Marsh: 2-3 tons CO2/hectare/year
   - Coral Reef: 0.5-1.5 tons CO2/hectare/year
   - Freshwater Wetland: 1-2 tons CO2/hectare/year
3. SURVIVAL RATE: Estimate based on ecosystem type and project quality (80-95% for well-managed projects)
4. AREA RESTORED: Convert total_area to hectares if needed, or estimate from location and project scale
5. COMMUNITY BENEFICIARIES: Estimate based on community impact level and project scale
6. WILDLIFE SPECIES: Estimate based on biodiversity score and ecosystem type

RESPONSE FORMAT (JSON only):
{
  "treesPlanted": number,
  "carbonSequestered": number,
  "survivalRate": number,
  "areaRestored": number,
  "communityBeneficiaries": number,
  "wildlifeSpecies": number,
  "metrics": {
    "treesPlanted": {
      "value": number,
      "unit": "trees",
      "label": "Trees Planted"
    },
    "carbonSequestered": {
      "value": number,
      "unit": "t",
      "label": "Carbon Sequestered"
    },
    "survivalRate": {
      "value": number,
      "unit": "%",
      "label": "Survival Rate"
    },
    "areaRestored": {
      "value": number,
      "unit": "ha",
      "label": "Area Restored"
    },
    "communityBeneficiaries": {
      "value": number,
      "unit": "people",
      "label": "Community Beneficiaries"
    },
    "wildlifeSpecies": {
      "value": number,
      "unit": "species",
      "label": "Wildlife Species"
    }
  }
}

IMPORTANT: 
- Use realistic scientific estimates
- Ensure all values are positive numbers
- Round to appropriate decimal places
- Base calculations on the actual project data provided
- If data is missing, make reasonable estimates based on project type and scale`;
}

/**
 * Parses Gemini response and extracts impact metrics
 */
function parseImpactMetricsResponse(content, projectData) {
    try {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const jsonStr = jsonMatch[0];
            const metrics = JSON.parse(jsonStr);
            
            // Validate and clean the metrics
            return {
                treesPlanted: Math.max(0, parseInt(metrics.treesPlanted) || projectData.project_details?.target_plants || 0),
                carbonSequestered: Math.max(0, parseFloat(metrics.carbonSequestered) || 0),
                survivalRate: Math.min(100, Math.max(0, parseFloat(metrics.survivalRate) || 85)),
                areaRestored: Math.max(0, parseFloat(metrics.areaRestored) || 0),
                communityBeneficiaries: Math.max(0, parseInt(metrics.communityBeneficiaries) || 0),
                wildlifeSpecies: Math.max(0, parseInt(metrics.wildlifeSpecies) || 0),
                metrics: {
                    treesPlanted: {
                        value: Math.max(0, parseInt(metrics.treesPlanted) || projectData.project_details?.target_plants || 0),
                        unit: "trees",
                        label: "Trees Planted"
                    },
                    carbonSequestered: {
                        value: Math.max(0, parseFloat(metrics.carbonSequestered) || 0),
                        unit: "t",
                        label: "Carbon Sequestered"
                    },
                    survivalRate: {
                        value: Math.min(100, Math.max(0, parseFloat(metrics.survivalRate) || 85)),
                        unit: "%",
                        label: "Survival Rate"
                    },
                    areaRestored: {
                        value: Math.max(0, parseFloat(metrics.areaRestored) || 0),
                        unit: "ha",
                        label: "Area Restored"
                    },
                    communityBeneficiaries: {
                        value: Math.max(0, parseInt(metrics.communityBeneficiaries) || 0),
                        unit: "people",
                        label: "Community Beneficiaries"
                    },
                    wildlifeSpecies: {
                        value: Math.max(0, parseInt(metrics.wildlifeSpecies) || 0),
                        unit: "species",
                        label: "Wildlife Species"
                    }
                }
            };
        }
    } catch (error) {
        console.error("Error parsing Gemini response:", error);
    }
    
    // Fallback to calculated metrics
    return generateFallbackMetrics(projectData);
}

/**
 * Generates fallback metrics when Gemini fails
 */
function generateFallbackMetrics(projectData) {
    const targetPlants = projectData.project_details?.target_plants || projectData.about_project?.target_plants || 0;
    const ecosystem = projectData.project_details?.ecosystem || projectData.about_project?.ecosystem || 'Unknown';
    const communityImpact = projectData.project_details?.community_impact || projectData.about_project?.community_impact || 'Medium';
    const biodiversityScore = projectData.project_details?.biodiversity_score || projectData.about_project?.biodiversity_score || '7/10';
    
    // Calculate carbon sequestration based on ecosystem type
    const carbonRates = {
        'Mangrove Forest': 4.0,
        'Coastal Wetland': 3.0,
        'Seagrass Meadow': 2.0,
        'Salt Marsh': 2.5,
        'Coral Reef': 1.0,
        'Freshwater Wetland': 1.5
    };
    
    const carbonRate = carbonRates[ecosystem] || 2.0;
    const areaHectares = parseFloat(projectData.project_details?.total_area) || (targetPlants / 1000); // Estimate area
    const carbonSequestered = areaHectares * carbonRate;
    
    // Calculate community beneficiaries based on impact level
    const beneficiaryMultipliers = {
        'High': 1.5,
        'Medium': 1.0,
        'Low': 0.5
    };
    const multiplier = beneficiaryMultipliers[communityImpact] || 1.0;
    const communityBeneficiaries = Math.round(targetPlants * 0.1 * multiplier);
    
    // Calculate wildlife species based on biodiversity score
    const biodiversityNum = parseFloat(biodiversityScore) || 7;
    const wildlifeSpecies = Math.round(biodiversityNum * 2.5);
    
    return {
        treesPlanted: targetPlants,
        carbonSequestered: Math.round(carbonSequestered * 10) / 10,
        survivalRate: 87.3,
        areaRestored: Math.round(areaHectares * 10) / 10,
        communityBeneficiaries: communityBeneficiaries,
        wildlifeSpecies: wildlifeSpecies,
        metrics: {
            treesPlanted: {
                value: targetPlants,
                unit: "trees",
                label: "Trees Planted"
            },
            carbonSequestered: {
                value: Math.round(carbonSequestered * 10) / 10,
                unit: "t",
                label: "Carbon Sequestered"
            },
            survivalRate: {
                value: 87.3,
                unit: "%",
                label: "Survival Rate"
            },
            areaRestored: {
                value: Math.round(areaHectares * 10) / 10,
                unit: "ha",
                label: "Area Restored"
            },
            communityBeneficiaries: {
                value: communityBeneficiaries,
                unit: "people",
                label: "Community Beneficiaries"
            },
            wildlifeSpecies: {
                value: wildlifeSpecies,
                unit: "species",
                label: "Wildlife Species"
            }
        }
    };
}
