import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Upload, Check, AlertTriangle, X, FileText, Image, File, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useWeb3 } from '../contexts/Web3Context';
import NBCard from '../components/NBCard';
import NBButton from '../components/NBButton';

// Validation schema - comprehensive project data
const projectSchema = z.object({
  // Basic Information
  title: z.string().optional(),
  location: z.string().optional(),
  speciesPlanted: z.string().optional(),
  description: z.string().optional(),
  targetPlants: z.number().optional(),
  
  // Financial Details
  estimatedBudget: z.number().optional(),
  securityDeposit: z.number().optional(),
  
  // Project Details (from About this project section)
  startDate: z.string().optional(),
  totalArea: z.string().optional(),
  ecosystem: z.string().optional(),
  carbonCapture: z.string().optional(),
  biodiversityScore: z.string().optional(),
  communityImpact: z.string().optional(),
  
  // Files and Media
  files: z.array(z.any()).optional(),
  coverImage: z.number().optional()
});

const AddProject = () => {
  const navigate = useNavigate();
  const { isConnected, account, web3Service } = useWeb3();
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    watch
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      files: [],
      coverImage: 0,
      estimatedBudget: 50, // 50 Lakhs INR
      securityDeposit: 5,  // 5 Lakhs INR  
      targetPlants: 1000
    }
  });

  const steps = [
    {
      title: 'Basic Information',
      fields: ['title', 'location', 'speciesPlanted', 'description', 'targetPlants']
    },
    {
      title: 'Project Details',
      fields: ['startDate', 'totalArea', 'ecosystem', 'carbonCapture', 'biodiversityScore', 'communityImpact']
    },
    {
      title: 'Budget Details',
      fields: ['estimatedBudget', 'securityDeposit']
    },
    {
      title: 'Project Documents',
      fields: ['files', 'coverImage']
    },
    {
      title: 'Review & Submit',
      fields: []
    }
  ];

  // File type categories
  const fileCategories = {
    images: {
      label: 'Photos',
      icon: Image,
      accept: 'image/*',
      description: 'Project site photos, before/after images',
      maxSize: 10,
      types: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    },
    documents: {
      label: 'Documents',
      icon: FileText,
      accept: 'application/pdf,.doc,.docx',
      description: 'Project proposals, reports, permits',
      maxSize: 25,
      types: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    },
    certificates: {
      label: 'Certificates',
      icon: File,
      accept: 'application/pdf,image/*',
      description: 'Environmental clearances, registrations',
      maxSize: 15,
      types: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    }
  };

  // Navigation functions
  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // Helper functions for files
  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType.includes('pdf')) return FileText;
    return File;
  };

  const getFileCategory = (fileType) => {
    if (fileType.startsWith('image/')) return 'images';
    if (fileType.includes('pdf') || fileType.includes('doc')) return 'documents';
    return 'certificates';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file) => {
    const category = getFileCategory(file.type);
    const config = fileCategories[category];
    
    if (file.size > config.maxSize * 1024 * 1024) {
      toast.error(`${file.name} is too large. Maximum size for ${config.label.toLowerCase()} is ${config.maxSize}MB.`);
      return false;
    }
    
    if (!config.types.includes(file.type)) {
      toast.error(`${file.name} is not a supported file type for ${config.label.toLowerCase()}.`);
      return false;
    }
    
    return true;
  };

  // File upload handling
  const handleFileUpload = (newFiles) => {
    const validFiles = [];
    
    Array.from(newFiles).forEach(file => {
      if (validateFile(file)) {
        const fileWithMetadata = Object.assign(file, {
          id: Date.now() + Math.random(),
          category: getFileCategory(file.type),
          uploadedAt: new Date().toISOString()
        });
        validFiles.push(fileWithMetadata);
      }
    });

    if (validFiles.length > 0) {
      const newUploadedFiles = [...uploadedFiles, ...validFiles];
      setUploadedFiles(newUploadedFiles);
      setValue('files', newUploadedFiles);
      toast.success(`${validFiles.length} file(s) uploaded successfully!`);
    }
  };

  // Drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const removeFile = (fileId) => {
    const newFiles = uploadedFiles.filter(file => file.id !== fileId);
    setUploadedFiles(newFiles);
    setValue('files', newFiles);
    toast.success('File removed');
  };

  // Group files by category
  const groupedFiles = uploadedFiles.reduce((acc, file) => {
    if (!acc[file.category]) acc[file.category] = [];
    acc[file.category].push(file);
    return acc;
  }, {});

  // Convert ETH amounts to INR for display
  const formatINRFromETH = (ethAmount) => {
    const inrAmount = parseFloat(ethAmount) * 100000; // 1 ETH = 1,00,000 INR for display
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(inrAmount);
  };

  const onSubmit = async (data) => {
    if (!isConnected) {
      toast.error('Please connect your wallet to submit project');
      return;
    }

    // Basic validation
    if (!data.title || data.title.trim().length < 3) {
      toast.error('Please enter a project title (min 3 characters)');
      return;
    }
    if (!data.location || data.location.trim().length < 3) {
      toast.error('Please enter a location (min 3 characters)');
      return;
    }
    if (!data.estimatedBudget || data.estimatedBudget <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }
    if (!data.securityDeposit || data.securityDeposit <= 0) {
      toast.error('Please enter a valid security deposit');
      return;
    }
    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one document');
      return;
    }

    setIsSubmitting(true);
    try {
      toast.loading('Uploading project to EcoLedger...', { id: 'submit-project' });
      
      // Prepare data for EcoLedger - include ALL project details
      const projectDataForBlockchain = {
        title: data.title.trim(),
        location: data.location.trim(),
        description: data.description?.trim() || '',
        estimatedBudget: parseFloat(data.estimatedBudget),
        securityDeposit: parseFloat(data.securityDeposit),
        speciesPlanted: data.speciesPlanted?.trim() || '',
        targetPlants: parseInt(data.targetPlants) || 0,
        // Include all the new project details fields
        startDate: data.startDate?.trim() || '',
        totalArea: data.totalArea?.trim() || '',
        ecosystem: data.ecosystem?.trim() || '',
        carbonCapture: data.carbonCapture?.trim() || '',
        biodiversityScore: data.biodiversityScore?.trim() || '',
        communityImpact: data.communityImpact?.trim() || ''
      };

      console.log('Submitting to EcoLedger:', projectDataForBlockchain);
      
      // Submit to EcoLedger contract
      const result = await web3Service.listProject(projectDataForBlockchain, uploadedFiles);
      
      // FIXED: Properly handle the result object
      const txHash = result?.transactionHash || result?.hash || 'unknown';
      
      toast.success(`Project submitted successfully! TX: ${txHash.slice(0, 10)}...`, 
        { id: 'submit-project' });
      
      navigate('/ngo');
    } catch (error) {
      console.error('Failed to submit project:', error);
      toast.error('Failed to submit project: ' + error.message, { id: 'submit-project' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-display font-bold text-nb-ink mb-4">
              Basic Project Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Project Title
              </label>
              <input
                {...register('title')}
                className="w-full px-4 py-3 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                placeholder="e.g., Mangrove Restoration - Sundarbans"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Project Location
              </label>
              <input
                {...register('location')}
                className="w-full px-4 py-3 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                placeholder="e.g., Sundarbans, West Bengal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Species to be Planted
              </label>
              <input
                {...register('speciesPlanted')}
                className="w-full px-4 py-3 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                placeholder="e.g., Rhizophora mucronata, Avicennia marina"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Target Plants
              </label>
              <input
                type="number"
                {...register('targetPlants', { valueAsNumber: true })}
                className="w-full px-4 py-3 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                placeholder="e.g., 25000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Project Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-4 py-3 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                placeholder="Describe your restoration project, its goals, and expected environmental impact..."
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-display font-bold text-nb-ink mb-4">
              Project Details
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Start Date
              </label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full px-4 py-3 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Total Area (hectares)
              </label>
              <input
                {...register('totalArea')}
                className="w-full px-4 py-3 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                placeholder="e.g., 15.7 hectares"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Ecosystem Type
              </label>
              <select
                {...register('ecosystem')}
                className="w-full px-4 py-3 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
              >
                <option value="">Select ecosystem type</option>
                <option value="Coastal Wetland">Coastal Wetland</option>
                <option value="Mangrove Forest">Mangrove Forest</option>
                <option value="Seagrass Meadow">Seagrass Meadow</option>
                <option value="Salt Marsh">Salt Marsh</option>
                <option value="Coral Reef">Coral Reef</option>
                <option value="Freshwater Wetland">Freshwater Wetland</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Carbon Capture (tonnes CO2/year)
              </label>
              <input
                {...register('carbonCapture')}
                className="w-full px-4 py-3 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                placeholder="e.g., 500 tonnes CO2/year"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Biodiversity Score (1-10)
              </label>
              <input
                {...register('biodiversityScore')}
                className="w-full px-4 py-3 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                placeholder="e.g., 8.4/10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Community Impact Level
              </label>
              <select
                {...register('communityImpact')}
                className="w-full px-4 py-3 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
              >
                <option value="">Select impact level</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-display font-bold text-nb-ink mb-4">
              Budget Information (₹ Lakhs)
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Estimated Budget (₹ Lakhs)
              </label>
              <input
                type="number"
                step="1"
                {...register('estimatedBudget', { valueAsNumber: true })}
                className="w-full px-4 py-3 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                placeholder="e.g., 50"
              />
              <p className="text-sm text-nb-ink/60 mt-1">
                Total budget required for the project (in Lakhs)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Security Deposit (₹ Lakhs)
              </label>
              <input
                type="number"
                step="1"
                {...register('securityDeposit', { valueAsNumber: true })}
                className="w-full px-4 py-3 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                placeholder="e.g., 5"
              />
              <p className="text-sm text-nb-ink/60 mt-1">
                Security deposit (typically 10% of budget)
              </p>
            </div>

            <NBCard className="bg-nb-accent/10">
              <h4 className="font-semibold text-nb-ink mb-2">Government Requirements</h4>
              <ul className="text-sm text-nb-ink/70 space-y-1">
                <li>• All amounts are processed through government treasury</li>
                <li>• Security deposit is held in escrow until project completion</li>
                <li>• Funds are released after NCCR verification</li>
                <li>• 2% platform fee for transparency and accountability</li>
              </ul>
            </NBCard>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-display font-bold text-nb-ink mb-4">
              Project Documents & Media
            </h3>
            
            {/* File Upload Zone */}
            <div
              className={`border-2 border-dashed rounded-nb p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-nb-accent bg-nb-accent/10' 
                  : 'border-nb-ink/30 hover:border-nb-ink/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload size={48} className="text-nb-ink/30 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-nb-ink mb-2">
                Upload Project Documents
              </h4>
              <p className="text-nb-ink/70 mb-4">
                Drag and drop files here, or click to browse
              </p>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {Object.entries(fileCategories).map(([key, category]) => {
                  const Icon = category.icon;
                  return (
                    <div key={key} className="text-center">
                      <input
                        type="file"
                        multiple
                        accept={category.accept}
                        onChange={(e) => handleFileUpload(e.target.files)}
                        className="hidden"
                        id={`file-upload-${key}`}
                      />
                      <label htmlFor={`file-upload-${key}`} className="cursor-pointer">
                        <NBCard className="hover:bg-nb-accent/10 transition-colors">
                          <Icon size={32} className="text-nb-accent mx-auto mb-2" />
                          <h5 className="font-medium text-nb-ink mb-1">{category.label}</h5>
                          <p className="text-xs text-nb-ink/60 mb-2">{category.description}</p>
                          <p className="text-xs text-nb-ink/50">Max {category.maxSize}MB</p>
                        </NBCard>
                      </label>
                    </div>
                  );
                })}
              </div>

              <NBButton variant="secondary" type="button" onClick={() => document.getElementById('file-upload-images').click()}>
                <Camera size={16} className="mr-2" />
                Browse Files
              </NBButton>
            </div>

            {/* Uploaded Files Display */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-nb-ink">
                    Uploaded Files ({uploadedFiles.length})
                  </h4>
                  <NBButton 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setUploadedFiles([]);
                      setValue('files', []);
                      toast.success('All files removed');
                    }}
                  >
                    Clear All
                  </NBButton>
                </div>

                {Object.entries(groupedFiles).map(([category, files]) => {
                  const categoryConfig = fileCategories[category];
                  const Icon = categoryConfig.icon;
                  
                  return (
                    <NBCard key={category}>
                      <div className="flex items-center gap-2 mb-4">
                        <Icon size={20} className="text-nb-accent" />
                        <h5 className="font-medium text-nb-ink">
                          {categoryConfig.label} ({files.length})
                        </h5>
                      </div>
                      
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {files.map((file) => {
                          const FileIcon = getFileIcon(file.type);
                          return (
                            <div key={file.id} className="border border-nb-ink/20 rounded-nb p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <FileIcon size={16} className="text-nb-ink/60 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-nb-ink truncate">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-nb-ink/60">
                                      {formatFileSize(file.size)}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeFile(file.id)}
                                  className="text-nb-error hover:bg-red-100 rounded p-1 flex-shrink-0"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                              
                              {file.type.startsWith('image/') && (
                                <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                                  <img 
                                    src={URL.createObjectURL(file)} 
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </NBCard>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 4:
        const data = getValues();
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-display font-bold text-nb-ink mb-4">
              Review Your Project Submission
            </h3>
            
            {!isConnected && (
              <NBCard className="bg-orange-50 border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={20} className="text-orange-600" />
                  <span className="font-semibold text-orange-800">Wallet Required</span>
                </div>
                <p className="text-sm text-orange-700">
                  Please connect your wallet to submit the project to EcoLedger.
                </p>
              </NBCard>
            )}
            
            <div className="grid md:grid-cols-2 gap-6">
              <NBCard>
                <h4 className="font-semibold text-nb-ink mb-3">Basic Project Details</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-nb-ink/60">Title:</span> {data.title || 'Not provided'}</div>
                  <div><span className="text-nb-ink/60">Location:</span> {data.location || 'Not provided'}</div>
                  <div><span className="text-nb-ink/60">Species:</span> {data.speciesPlanted || 'Not provided'}</div>
                  <div><span className="text-nb-ink/60">Target Plants:</span> {data.targetPlants?.toLocaleString() || 'Not provided'}</div>
                </div>
              </NBCard>

              <NBCard>
                <h4 className="font-semibold text-nb-ink mb-3">Financial Summary</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-nb-ink/60">Total Budget:</span> ₹{(data.estimatedBudget || 0).toFixed(0)} Lakhs</div>
                  <div><span className="text-nb-ink/60">Security Deposit:</span> ₹{(data.securityDeposit || 0).toFixed(0)} Lakhs</div>
                  <div><span className="text-nb-ink/60">Documents:</span> {uploadedFiles.length} files</div>
                  <div><span className="text-nb-ink/60">Submitter:</span> {account ? account.slice(0, 8) + '...' : 'Not connected'}</div>
                </div>
              </NBCard>
            </div>

            {/* Additional Project Details */}
            <NBCard>
              <h4 className="font-semibold text-nb-ink mb-3">Project Details</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div><span className="text-nb-ink/60">Start Date:</span> {data.startDate || 'Not provided'}</div>
                <div><span className="text-nb-ink/60">Total Area:</span> {data.totalArea || 'Not provided'}</div>
                <div><span className="text-nb-ink/60">Ecosystem:</span> {data.ecosystem || 'Not provided'}</div>
                <div><span className="text-nb-ink/60">Carbon Capture:</span> {data.carbonCapture || 'Not provided'}</div>
                <div><span className="text-nb-ink/60">Biodiversity Score:</span> {data.biodiversityScore || 'Not provided'}</div>
                <div><span className="text-nb-ink/60">Community Impact:</span> {data.communityImpact || 'Not provided'}</div>
              </div>
            </NBCard>

            {/* File Summary */}
            {uploadedFiles.length > 0 && (
              <NBCard>
                <h4 className="font-semibold text-nb-ink mb-3">Uploaded Documents</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  {Object.entries(groupedFiles).map(([category, files]) => {
                    const categoryConfig = fileCategories[category];
                    const Icon = categoryConfig.icon;
                    return (
                      <div key={category} className="text-center p-3 bg-nb-accent/5 rounded-nb">
                        <Icon size={24} className="text-nb-accent mx-auto mb-2" />
                        <p className="font-medium text-nb-ink">{categoryConfig.label}</p>
                        <p className="text-sm text-nb-ink/60">{files.length} files</p>
                      </div>
                    );
                  })}
                </div>
              </NBCard>
            )}

            <NBCard>
              <h4 className="font-semibold text-nb-ink mb-3">Description</h4>
              <p className="text-sm text-nb-ink/80">{data.description || 'No description provided'}</p>
            </NBCard>

            <NBCard className="bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Check size={20} className="text-green-600" />
                <span className="font-semibold text-green-800">Ready for Government Review</span>
              </div>
              <p className="text-sm text-green-700">
                Your project will be submitted to NCCR for verification. 
                All financial transactions are handled through secure government channels.
              </p>
            </NBCard>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <NBCard className="max-w-md w-full text-center">
          <NBButton variant="ghost" onClick={() => navigate('/ngo')}>
            <ArrowLeft size={20} />
          </NBButton>
          <h2 className="text-2xl font-display font-bold text-nb-ink mb-2">
            Connect Wallet
          </h2>
          <p className="text-nb-ink/70 mb-6">
            Please connect your wallet to submit projects to EcoLedger.
          </p>
        </NBCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <NBButton variant="ghost" onClick={() => navigate('/ngo')}>
            <ArrowLeft size={20} />
          </NBButton>
          <div>
            <h1 className="text-4xl font-display font-bold text-nb-ink">
              Add New Project
            </h1>
            <p className="text-lg text-nb-ink/70">
              Submit your project to EcoLedger on Sepolia Testnet
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(index)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  index <= currentStep 
                    ? 'bg-nb-accent border-nb-accent text-nb-ink' 
                    : 'border-nb-ink/30 text-nb-ink/30 hover:border-nb-ink/50'
                  }`}
                >
                  {index < currentStep ? <Check size={20} /> : index + 1}
                </button>
                <span className={`ml-2 text-sm font-medium ${
                  index <= currentStep ? 'text-nb-ink' : 'text-nb-ink/30'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    index < currentStep ? 'bg-nb-accent' : 'bg-nb-ink/30'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <NBCard className="mb-8">
            {renderStepContent()}
          </NBCard>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <NBButton 
              type="button"
              variant="secondary" 
              onClick={prevStep} 
              disabled={currentStep === 0}
            >
              <ArrowLeft size={16} className="mr-2" />
              Previous
            </NBButton>

            {currentStep < steps.length - 1 ? (
              <NBButton type="button" onClick={nextStep}>
                Next
                <ArrowRight size={16} className="ml-2" />
              </NBButton>
            ) : (
              <NBButton 
                type="submit" 
                variant="primary"
                disabled={!isConnected || isSubmitting}
              >
                {isSubmitting ? 'Submitting to EcoLedger...' : 'Submit to EcoLedger'}
                <Check size={16} className="ml-2" />
              </NBButton>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProject;
