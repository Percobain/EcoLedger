import { useState } from 'react';
import ImpactMetrics from './ImpactMetrics';
import NBButton from './NBButton';

const ImpactMetricsDemo = () => {
  const [showDemo, setShowDemo] = useState(false);

  // Your IPFS data from the user query
  const sampleProjectData = {
    "name": "Urban Miyawaki Forest Drive",
    "description": "Creating dense urban forest with 2000 native trees in Bangalore city.",
    "image": "ipfs://QmbDQhetQyLt4LyEJxaQ4eKpZK9SwRZCPApggBrNfd67Fq",
    "attributes": [
      {
        "trait_type": "Location",
        "value": "Bangalore, Karnataka"
      },
      {
        "trait_type": "Species",
        "value": "Mixed Native Trees"
      },
      {
        "trait_type": "Target Plants",
        "value": 4545
      },
      {
        "trait_type": "Project Type",
        "value": "Blue Carbon Restoration"
      },
      {
        "trait_type": "Budget",
        "value": "₹29 Lakhs"
      },
      {
        "trait_type": "Security Deposit",
        "value": "₹2 Lakhs"
      },
      {
        "trait_type": "Ecosystem",
        "value": "Coral Reef"
      },
      {
        "trait_type": "Carbon Capture",
        "value": "4545"
      },
      {
        "trait_type": "Biodiversity Score",
        "value": "6.9/10"
      },
      {
        "trait_type": "Community Impact",
        "value": "Medium"
      }
    ],
    "files": [
      "ipfs://QmbDQhetQyLt4LyEJxaQ4eKpZK9SwRZCPApggBrNfd67Fq"
    ],
    "financial_details": {
      "estimated_budget_inr": 29,
      "security_deposit_inr": 2,
      "currency": "INR",
      "budget_breakdown": {
        "seedlings": 11,
        "labor": 8,
        "equipment": 5,
        "monitoring": 2
      }
    },
    "project_details": {
      "location": "Bangalore, Karnataka",
      "species_planted": "Mixed Native Trees",
      "target_plants": 4545,
      "description": "Creating dense urban forest with 2000 native trees in Bangalore city.",
      "start_date": "2025-09-11",
      "total_area": "Bangalore, Karnataka",
      "ecosystem": "Coral Reef",
      "carbon_capture": "4545",
      "biodiversity_score": "6.9/10",
      "community_impact": "Medium"
    },
    "about_project": {
      "project_description": "Creating dense urban forest with 2000 native trees in Bangalore city.",
      "species": "Mixed Native Trees",
      "target_plants": 4545,
      "start_date": "2025-09-11",
      "total_area": "Bangalore, Karnataka",
      "ecosystem": "Coral Reef",
      "carbon_capture": "4545",
      "biodiversity_score": "6.9/10",
      "community_impact": "Medium"
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-display font-bold text-nb-ink mb-6">
          Impact Metrics Demo
        </h2>
        
        <p className="text-nb-ink/70 mb-6">
          This demo shows how the Environmental Impact Metrics are generated from your IPFS data using Gemini AI.
          The system analyzes your project data and generates realistic environmental impact metrics.
        </p>

        <div className="mb-6">
          <h3 className="text-xl font-semibold text-nb-ink mb-3">Sample Project Data:</h3>
          <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm text-gray-800">
              {JSON.stringify(sampleProjectData, null, 2)}
            </pre>
          </div>
        </div>

        <NBButton 
          variant="primary" 
          onClick={() => setShowDemo(!showDemo)}
          className="mb-6"
        >
          {showDemo ? 'Hide' : 'Show'} Generated Impact Metrics
        </NBButton>

        {showDemo && (
          <div className="border-2 border-nb-ink rounded-lg p-6">
            <h3 className="text-xl font-semibold text-nb-ink mb-4">
              Generated Environmental Impact Metrics:
            </h3>
            <ImpactMetrics projectData={sampleProjectData} />
          </div>
        )}

        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-lg font-semibold text-blue-800 mb-2">
            How it works:
          </h4>
          <ul className="text-blue-700 space-y-2">
            <li>• <strong>IPFS Data Input:</strong> Your project metadata from Pinata IPFS</li>
            <li>• <strong>Gemini AI Analysis:</strong> AI analyzes the data and generates realistic metrics</li>
            <li>• <strong>Scientific Calculations:</strong> Based on ecosystem type, species, and project scale</li>
            <li>• <strong>Fallback System:</strong> If AI fails, uses calculated estimates</li>
            <li>• <strong>Real-time Display:</strong> Metrics are shown in project details and marketplace</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImpactMetricsDemo;
