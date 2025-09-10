const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Generate environmental impact metrics for a project using Gemini AI
 * @param {Object} projectData - Project data from IPFS metadata
 * @returns {Promise<Object>} Generated impact metrics
 */
export const generateImpactMetrics = async (projectData) => {
  try {
    console.log('🌱 Generating impact metrics for project:', projectData.name);
    
    const response = await fetch(`${API_BASE_URL}/impact-metrics/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectData }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to generate impact metrics');
    }

    console.log('✅ Impact metrics generated successfully:', result.metrics);
    return result.metrics;
  } catch (error) {
    console.error('❌ Error generating impact metrics:', error);
    throw error;
  }
};

/**
 * Generate impact metrics for multiple projects (batch processing)
 * @param {Array} projects - Array of project data
 * @returns {Promise<Array>} Array of results with metrics for each project
 */
export const generateBatchImpactMetrics = async (projects) => {
  try {
    console.log(`🌱 Generating impact metrics for ${projects.length} projects`);
    
    const response = await fetch(`${API_BASE_URL}/impact-metrics/generate-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projects }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to generate batch impact metrics');
    }

    console.log('✅ Batch impact metrics generated successfully');
    return result.results;
  } catch (error) {
    console.error('❌ Error generating batch impact metrics:', error);
    throw error;
  }
};

/**
 * Generate fallback metrics when API fails
 * @param {Object} projectData - Project data from IPFS metadata
 * @returns {Object} Fallback impact metrics
 */
export const generateFallbackMetrics = (projectData) => {
  const targetPlants = projectData.project_details?.target_plants || 
                     projectData.about_project?.target_plants || 
                     projectData.attributes?.find(attr => attr.trait_type === "Target Plants")?.value || 0;
  
  const ecosystem = projectData.project_details?.ecosystem || 
                   projectData.about_project?.ecosystem || 
                   projectData.attributes?.find(attr => attr.trait_type === "Ecosystem")?.value || 'Unknown';
  
  const communityImpact = projectData.project_details?.community_impact || 
                         projectData.about_project?.community_impact || 
                         projectData.attributes?.find(attr => attr.trait_type === "Community Impact")?.value || 'Medium';
  
  const biodiversityScore = projectData.project_details?.biodiversity_score || 
                           projectData.about_project?.biodiversity_score || 
                           projectData.attributes?.find(attr => attr.trait_type === "Biodiversity Score")?.value || '7/10';
  
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
  const areaHectares = parseFloat(projectData.project_details?.total_area) || (targetPlants / 1000);
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
};
