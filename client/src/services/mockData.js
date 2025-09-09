// Seeded mock data for the Blue Carbon MRV platform
// Using deterministic faker with 'bluecarbon' seed

const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper function to generate valid ObjectIds
const generateObjectId = () => {
    const timestamp = Math.floor(Date.now() / 1000).toString(16);
    const random = Math.random().toString(16).substr(2, 16);
    return (timestamp + random).substr(0, 24);
};

// Update project IDs to use valid ObjectIds
export const mockVerifications = [
  {
    id: 'ver-001',
    projectId: '66e5f1234567890123456001',
    mode: 'centralized',
    verifier: 'Alice Johnson',
    decision: 'approved',
    timestamp: '2024-01-20',
    votes: null
  },
  {
    id: 'ver-002',
    projectId: '66e5f1234567890123456003',
    mode: 'decentralized',
    verifier: 'Marine DAO',
    decision: 'approved',
    timestamp: '2024-01-16',
    votes: { approve: 12, reject: 1 }
  },
  {
    id: 'ver-003',
    projectId: '66e5f1234567890123456004',
    mode: 'centralized',
    verifier: 'Bob Smith',
    decision: 'approved',
    timestamp: '2024-01-18', 
    votes: {approve: 10, reject: 3}
  }
];
export const mockProjects = [
  {
    id: '66e5f1234567890123456001', // Valid ObjectId
    ownerId: '66e5f1234567890123456101',
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
    id: '66e5f1234567890123456002',
    ownerId: '66e5f1234567890123456102',
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
    id: '66e5f1234567890123456003', // This replaces proj-003
    ownerId: '66e5f1234567890123456101',
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
    id: '66e5f1234567890123456004',
    ownerId: '66e5f1234567890123456103',
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
    id: '66e5f1234567890123456005',
    ownerId: '66e5f1234567890123456102',
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

// Update NGO IDs
export const mockNGOs = [
  {
    id: '66e5f1234567890123456101',
    name: 'Coastal Conservation Alliance',
    role: 'ngo',
    avatarUrl: '/api/placeholder/100/100'
  },
  {
    id: '66e5f1234567890123456102',
    name: 'Marine Restoration Foundation',
    role: 'ngo',
    avatarUrl: '/api/placeholder/100/100'
  },
  {
    id: '66e5f1234567890123456103',
    name: 'Blue Carbon Initiative',
    role: 'ngo',
    avatarUrl: '/api/placeholder/100/100'
  }
];

// Update report data to use new project IDs
export const mockReports = [
  {
    id: '66e5f1234567890123456201',
    projectId: '66e5f1234567890123456003',
    orgId: '66e5f1234567890123456101',
    type: 'MONTHLY',
    report: {
      description: 'Progress report showing successful mangrove planting in designated areas',
      plantsInstalled: 2500,
      survivalRate: 85,
      weatherConditions: 'Favorable with adequate rainfall'
    },
    media: [
      {
        cloudflareUrl: 'https://example.cloudflare.com/image1.jpg',
        cloudflareKey: 'submissions/66e5f1234567890123456003/2024-01-25/image1.jpg',
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        pHash: '8f373c8bf40a6c42',
        exif: {
          gps: { latitude: 22.1568, longitude: 88.9498 },
          camera: 'iPhone 14 Pro',
          timestamp: '2024-01-25T10:30:00Z'
        },
        watermarked: true
      },
      {
        cloudflareUrl: 'https://example.cloudflare.com/image2.jpg',
        cloudflareKey: 'submissions/66e5f1234567890123456003/2024-01-25/image2.jpg',
        sha256: 'f7c3bc1d808e04732adf679965ccc34ca7ae3441b49bea8c56a000fa16e6eee2',
        pHash: '9e484d9cf51b7d53',
        exif: {
          gps: { latitude: 22.1575, longitude: 88.9505 },
          camera: 'iPhone 14 Pro',
          timestamp: '2024-01-25T10:45:00Z'
        },
        watermarked: true
      }
    ],
    gpsCentroid: {
      type: 'Point',
      coordinates: [88.9502, 22.1572]
    },
    trustScore: 87,
    autoFlags: [],
    status: 'VERIFIED',
    createdAt: '2024-01-25T10:00:00Z',
    verifiedAt: '2024-01-28T14:30:00Z'
  },
  {
    id: '66e5f1234567890123456202',
    projectId: '66e5f1234567890123456005',
    orgId: '66e5f1234567890123456102',
    type: 'MONTHLY',
    report: {
      description: 'Kelp forest restoration progress in Arabian Sea coastal waters',
      plantsInstalled: 800,
      survivalRate: 78,
      waterQuality: 'Good with stable salinity levels'
    },
    media: [
      {
        cloudflareUrl: 'https://example.cloudflare.com/image3.jpg',
        cloudflareKey: 'submissions/66e5f1234567890123456005/2024-01-28/image3.jpg',
        sha256: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
        pHash: '7d372c7bf30a5c31',
        exif: {
          gps: { latitude: 19.0176, longitude: 72.8562 },
          camera: 'Canon EOS R5',
          timestamp: '2024-01-28T08:15:00Z'
        },
        watermarked: true
      },
      {
        cloudflareUrl: 'https://example.cloudflare.com/image4.jpg',
        cloudflareKey: 'submissions/66e5f1234567890123456005/2024-01-28/image4.jpg',
        sha256: 'b5d4045c3f466fa91fe2cc6abe79232a1a57cdf104f7a26e716e0a1e2789df78',
        pHash: '8f483e9df62c8e64',
        exif: {
          gps: { latitude: 19.0180, longitude: 72.8570 },
          camera: 'Canon EOS R5',
          timestamp: '2024-01-28T08:30:00Z'
        },
        watermarked: true
      },
      {
        cloudflareUrl: 'https://example.cloudflare.com/image5.jpg',
        cloudflareKey: 'submissions/66e5f1234567890123456005/2024-01-28/image5.jpg',
        sha256: 'c3499c2729730a7f807efb8676a92dcb6f8a3f8f3e7c4cb8b7f3a1b5b1c2d3e4',
        pHash: '9a594f0ef73d9f75',
        exif: {
          gps: { latitude: 19.0185, longitude: 72.8575 },
          camera: 'Canon EOS R5',
          timestamp: '2024-01-28T08:45:00Z'
        },
        watermarked: true
      }
    ],
    gpsCentroid: {
      type: 'Point',
      coordinates: [72.8569, 19.0180]
    },
    trustScore: 72,
    autoFlags: ['low_trust_score', 'manual_review_required'],
    status: 'PENDING',
    createdAt: '2024-01-28T09:00:00Z'
  },
  {
    id: 'rep-003',
    projectId: 'proj-003',
    orgId: 'ngo-001',
    type: 'QUARTERLY',
    report: {
      description: 'Quarterly assessment of coastal wetland restoration progress',
      plantsInstalled: 7500,
      survivalRate: 92,
      biodiversityImpact: 'Increased bird species count by 15%'
    },
    media: [
      {
        cloudflareUrl: 'https://example.cloudflare.com/image6.jpg',
        cloudflareKey: 'submissions/proj-003/2024-02-01/image6.jpg',
        sha256: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
        pHash: 'ab695b1fg84e6f86',
        exif: {
          gps: { latitude: 22.1580, longitude: 88.9510 },
          camera: 'Samsung Galaxy S23',
          timestamp: '2024-02-01T11:00:00Z'
        },
        watermarked: true
      }
    ],
    gpsCentroid: {
      type: 'Point',
      coordinates: [88.9510, 22.1580]
    },
    trustScore: 94,
    autoFlags: [],
    status: 'VERIFIED',
    createdAt: '2024-02-01T11:30:00Z',
    verifiedAt: '2024-02-02T16:45:00Z'
  }
];

export default {
  projects: mockProjects,
  ngos: mockNGOs,
  verifications: mockVerifications,
  reports: mockReports
};
