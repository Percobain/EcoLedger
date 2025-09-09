// Seeded mock data for the Blue Carbon MRV platform
// Using deterministic faker with 'bluecarbon' seed

const generateId = () => Math.random().toString(36).substr(2, 9);

// Seed data for projects
export const mockProjects = [
  {
    id: 'proj-001',
    ownerId: 'ngo-001',
    title: 'Mangrove Restoration - Sundarbans',
    location: 'Sundarbans, West Bengal',
    speciesPlanted: 'Rhizophora mucronata, Avicennia marina',
    description: 'Large-scale mangrove restoration project aimed at restoring 500 hectares of degraded coastal land in the Sundarbans region.',
    targetPlants: 25000,
    estimatedBudget: 750000,
    securityDeposit: 75000,
    status: 'verified',
    photos: ['/api/placeholder/600/400', '/api/placeholder/600/400', '/api/placeholder/600/400'],
    coverImage: 0,
    createdAt: '2024-01-15',
    verifiedAt: '2024-01-20'
  },
  {
    id: 'proj-002',
    ownerId: 'ngo-002',
    title: 'Seagrass Meadow Conservation',
    location: 'Palk Bay, Tamil Nadu',
    speciesPlanted: 'Zostera marina, Cymodocea rotundata',
    description: 'Conservation and restoration of critical seagrass meadows that serve as nurseries for marine life.',
    targetPlants: 15000,
    estimatedBudget: 450000,
    securityDeposit: 45000,
    status: 'pending',
    photos: ['/api/placeholder/600/400', '/api/placeholder/600/400'],
    coverImage: 0,
    createdAt: '2024-01-18'
  },
  {
    id: 'proj-003',
    ownerId: 'ngo-001',
    title: 'Coastal Wetland Restoration',
    location: 'Chilika Lake, Odisha',
    speciesPlanted: 'Phragmites karka, Typha elephantina',
    description: 'Restoration of coastal wetlands to improve biodiversity and provide natural flood protection.',
    targetPlants: 30000,
    estimatedBudget: 900000,
    securityDeposit: 90000,
    status: 'funded',
    photos: ['/api/placeholder/600/400', '/api/placeholder/600/400', '/api/placeholder/600/400', '/api/placeholder/600/400'],
    coverImage: 1,
    createdAt: '2024-01-10',
    verifiedAt: '2024-01-16',
    fundedAt: '2024-01-22'
  },
  {
    id: 'proj-004',
    ownerId: 'ngo-003',
    title: 'Salt Marsh Restoration',
    location: 'Rann of Kutch, Gujarat',
    speciesPlanted: 'Salicornia brachiata, Suaeda maritima',
    description: 'Restoration of salt marshes to enhance carbon sequestration and support migratory bird populations.',
    targetPlants: 20000,
    estimatedBudget: 600000,
    securityDeposit: 60000,
    status: 'verified',
    photos: ['/api/placeholder/600/400', '/api/placeholder/600/400'],
    coverImage: 0,
    createdAt: '2024-01-12',
    verifiedAt: '2024-01-18'
  },
  {
    id: 'proj-005',
    ownerId: 'ngo-002',
    title: 'Kelp Forest Restoration',
    location: 'Arabian Sea Coast, Maharashtra',
    speciesPlanted: 'Sargassum species, Turbinaria ornata',
    description: 'Restoration of kelp forests to enhance marine biodiversity and carbon sequestration.',
    targetPlants: 10000,
    estimatedBudget: 350000,
    securityDeposit: 35000,
    status: 'reporting',
    photos: ['/api/placeholder/600/400', '/api/placeholder/600/400', '/api/placeholder/600/400'],
    coverImage: 0,
    createdAt: '2024-01-05',
    verifiedAt: '2024-01-12',
    fundedAt: '2024-01-20'
  }
];

// Seed data for NGOs
export const mockNGOs = [
  {
    id: 'ngo-001',
    name: 'Coastal Conservation Alliance',
    role: 'ngo',
    avatarUrl: '/api/placeholder/100/100'
  },
  {
    id: 'ngo-002',
    name: 'Marine Restoration Foundation',
    role: 'ngo',
    avatarUrl: '/api/placeholder/100/100'
  },
  {
    id: 'ngo-003',
    name: 'Blue Carbon Initiative',
    role: 'ngo',
    avatarUrl: '/api/placeholder/100/100'
  }
];

// Seed data for verifications
export const mockVerifications = [
  {
    id: 'ver-001',
    projectId: 'proj-001',
    mode: 'centralized',
    verifier: 'Dr. Rajesh Kumar - Forest Officer',
    decision: 'approved',
    timestamp: '2024-01-20'
  },
  {
    id: 'ver-002',
    projectId: 'proj-003',
    mode: 'decentralized',
    verifier: 'DAO Community',
    decision: 'approved',
    timestamp: '2024-01-16',
    votes: { approve: 15, reject: 2 }
  }
];

// Seed data for reports
export const mockReports = [
  {
    id: 'rep-001',
    projectId: 'proj-003',
    ngoUpload: ['/api/placeholder/600/400', '/api/placeholder/600/400'],
    daoUpload: ['/api/placeholder/600/400'],
    exifMatch: true,
    status: 'verified',
    submittedAt: '2024-01-25',
    verifiedAt: '2024-01-28'
  },
  {
    id: 'rep-002',
    projectId: 'proj-005',
    ngoUpload: ['/api/placeholder/600/400', '/api/placeholder/600/400', '/api/placeholder/600/400'],
    daoUpload: [],
    exifMatch: true,
    status: 'submitted',
    submittedAt: '2024-01-28'
  }
];

export default {
  projects: mockProjects,
  ngos: mockNGOs,
  verifications: mockVerifications,
  reports: mockReports
};
