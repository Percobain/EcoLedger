import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Upload, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useProjectStore } from '../stores/useProjectStore';
import NBCard from '../components/NBCard';
import NBButton from '../components/NBButton';

// Validation schema
const projectSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  location: z.string().min(3, 'Location is required'),
  speciesPlanted: z.string().min(3, 'Species information is required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  targetPlants: z.number().min(100, 'Minimum 100 plants required'),
  estimatedBudget: z.number().min(10000, 'Minimum budget is ₹10,000'),
  securityDeposit: z.number().min(1000, 'Security deposit required'),
  photos: z.array(z.string()).min(1, 'At least one photo is required'),
  coverImage: z.number().min(0)
});

const AddProject = () => {
  const navigate = useNavigate();
  const { createProject } = useProjectStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    trigger
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      photos: [],
      coverImage: 0
    }
  });

  const steps = [
    {
      title: 'Basic Information',
      fields: ['title', 'location', 'speciesPlanted', 'description', 'targetPlants']
    },
    {
      title: 'Budget Details',
      fields: ['estimatedBudget', 'securityDeposit']
    },
    {
      title: 'Project Media',
      fields: ['photos', 'coverImage']
    },
    {
      title: 'Review & Submit',
      fields: []
    }
  ];

  const nextStep = async () => {
    const currentFields = steps[currentStep].fields;
    const isValid = await trigger(currentFields);
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handlePhotoUpload = () => {
    // Mock photo upload - in real app this would handle file uploads
    const mockPhotos = [
      '/api/placeholder/600/400',
      '/api/placeholder/600/400',
      '/api/placeholder/600/400'
    ];
    
    setUploadedPhotos(mockPhotos);
    setValue('photos', mockPhotos);
    toast.success('Photos uploaded successfully!');
  };

  const onSubmit = async (data) => {
    try {
      await createProject(data);
      toast.success('Project submitted successfully! It will be reviewed for verification.');
      navigate('/ngo');
    } catch (error) {
      toast.error('Failed to submit project. Please try again.');
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
                Project Title *
              </label>
              <input
                {...register('title')}
                className="w-full px-4 py-3 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                placeholder="e.g., Mangrove Restoration - Sundarbans"
              />
              {errors.title && (
                <p className="text-nb-error text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Project Location *
              </label>
              <input
                {...register('location')}
                className="w-full px-4 py-3 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                placeholder="e.g., Sundarbans, West Bengal"
              />
              {errors.location && (
                <p className="text-nb-error text-sm mt-1">{errors.location.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Species to be Planted *
              </label>
              <input
                {...register('speciesPlanted')}
                className="w-full px-4 py-3 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                placeholder="e.g., Rhizophora mucronata, Avicennia marina"
              />
              {errors.speciesPlanted && (
                <p className="text-nb-error text-sm mt-1">{errors.speciesPlanted.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Target Plants *
              </label>
              <input
                type="number"
                {...register('targetPlants', { valueAsNumber: true })}
                className="w-full px-4 py-3 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                placeholder="e.g., 25000"
              />
              {errors.targetPlants && (
                <p className="text-nb-error text-sm mt-1">{errors.targetPlants.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Project Description *
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-4 py-3 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                placeholder="Describe your restoration project, its goals, and expected environmental impact..."
              />
              {errors.description && (
                <p className="text-nb-error text-sm mt-1">{errors.description.message}</p>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-display font-bold text-nb-ink mb-4">
              Budget Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Estimated Budget (₹) *
              </label>
              <input
                type="number"
                {...register('estimatedBudget', { valueAsNumber: true })}
                className="w-full px-4 py-3 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                placeholder="e.g., 750000"
              />
              {errors.estimatedBudget && (
                <p className="text-nb-error text-sm mt-1">{errors.estimatedBudget.message}</p>
              )}
              <p className="text-sm text-nb-ink/60 mt-1">
                Total budget required for the entire project duration
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Security Deposit (₹) *
              </label>
              <input
                type="number"
                {...register('securityDeposit', { valueAsNumber: true })}
                className="w-full px-4 py-3 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                placeholder="e.g., 75000"
              />
              {errors.securityDeposit && (
                <p className="text-nb-error text-sm mt-1">{errors.securityDeposit.message}</p>
              )}
              <p className="text-sm text-nb-ink/60 mt-1">
                Security deposit to ensure project completion (typically 10% of budget)
              </p>
            </div>

            <NBCard className="bg-nb-accent/10">
              <h4 className="font-semibold text-nb-ink mb-2">Budget Guidelines</h4>
              <ul className="text-sm text-nb-ink/70 space-y-1">
                <li>• Include costs for seedlings, planting, maintenance, and monitoring</li>
                <li>• Security deposit will be returned upon successful project completion</li>
                <li>• Budget should be realistic and based on current market rates</li>
              </ul>
            </NBCard>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-display font-bold text-nb-ink mb-4">
              Project Media
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Project Photos *
              </label>
              <div className="border-2 border-dashed border-nb-ink rounded-nb p-8 text-center">
                {uploadedPhotos.length > 0 ? (
                  <div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {uploadedPhotos.map((photo, index) => (
                        <div key={index} className="aspect-square bg-gray-200 rounded-nb overflow-hidden">
                          <img src={photo} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    <p className="text-nb-ok">✓ {uploadedPhotos.length} photos uploaded</p>
                  </div>
                ) : (
                  <div>
                    <Upload size={48} className="text-nb-ink/30 mx-auto mb-4" />
                    <p className="text-nb-ink/70 mb-4">Upload project site photos</p>
                    <NBButton variant="secondary" onClick={handlePhotoUpload}>
                      Choose Files
                    </NBButton>
                  </div>
                )}
              </div>
              {errors.photos && (
                <p className="text-nb-error text-sm mt-1">{errors.photos.message}</p>
              )}
            </div>

            {uploadedPhotos.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-nb-ink mb-2">
                  Cover Image
                </label>
                <select
                  {...register('coverImage', { valueAsNumber: true })}
                  className="w-full px-4 py-3 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                >
                  {uploadedPhotos.map((_, index) => (
                    <option key={index} value={index}>
                      Photo {index + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );

      case 3:
        const data = getValues();
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-display font-bold text-nb-ink mb-4">
              Review Your Project
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <NBCard>
                <h4 className="font-semibold text-nb-ink mb-3">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-nb-ink/60">Title:</span> {data.title}</div>
                  <div><span className="text-nb-ink/60">Location:</span> {data.location}</div>
                  <div><span className="text-nb-ink/60">Species:</span> {data.speciesPlanted}</div>
                  <div><span className="text-nb-ink/60">Target Plants:</span> {data.targetPlants?.toLocaleString()}</div>
                </div>
              </NBCard>

              <NBCard>
                <h4 className="font-semibold text-nb-ink mb-3">Budget Details</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-nb-ink/60">Budget:</span> ₹{data.estimatedBudget?.toLocaleString()}</div>
                  <div><span className="text-nb-ink/60">Security Deposit:</span> ₹{data.securityDeposit?.toLocaleString()}</div>
                  <div><span className="text-nb-ink/60">Photos:</span> {data.photos?.length || 0} uploaded</div>
                </div>
              </NBCard>
            </div>

            <NBCard>
              <h4 className="font-semibold text-nb-ink mb-3">Description</h4>
              <p className="text-sm text-nb-ink/80">{data.description}</p>
            </NBCard>

            <NBCard className="bg-nb-accent/10">
              <div className="flex items-center gap-2 mb-2">
                <Check size={20} className="text-nb-ok" />
                <span className="font-semibold text-nb-ink">Ready to Submit</span>
              </div>
              <p className="text-sm text-nb-ink/70">
                Your project will be submitted for verification. You'll be notified once the review is complete.
              </p>
            </NBCard>
          </div>
        );

      default:
        return null;
    }
  };

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
              Submit your blue carbon restoration project for verification
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  index <= currentStep 
                    ? 'bg-nb-accent border-nb-accent text-nb-ink' 
                    : 'border-nb-ink/30 text-nb-ink/30'
                }`}>
                  {index < currentStep ? <Check size={20} /> : index + 1}
                </div>
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
              <NBButton type="submit" variant="primary">
                Submit Project
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
