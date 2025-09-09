import { useEffect, useState } from 'react';
import { Upload, MapPin, Calendar, CheckCircle, Clock, Image } from 'lucide-react';
import { toast } from 'sonner';
import { useReportingStore } from '../stores/useReportingStore';
import NBCard from '../components/NBCard';
import NBButton from '../components/NBButton';
import ProjectCard from '../components/ProjectCard';

const Reporting = () => {
  const {
    reportableProjects,
    reports,
    loading,
    error,
    fetchReportableProjects,
    submitReport,
    fetchReports
  } = useReportingStore();

  const [selectedProject, setSelectedProject] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);

  useEffect(() => {
    fetchReportableProjects();
  }, [fetchReportableProjects]);

  const handleSelectProject = (projectId) => {
    const project = reportableProjects.find(p => p.id === projectId);
    setSelectedProject(project);
    if (project) {
      fetchReports(projectId);
    }
  };

  const handleImageUpload = () => {
    // Mock image upload with geotagged photos
    const mockImages = [
      '/api/placeholder/600/400',
      '/api/placeholder/600/400',
      '/api/placeholder/600/400'
    ];
    
    setUploadedImages(mockImages);
    toast.success('Geotagged images uploaded successfully! EXIF data verified.');
  };

  const handleSubmitReport = async () => {
    if (!selectedProject || uploadedImages.length === 0) {
      toast.error('Please select a project and upload images');
      return;
    }

    try {
      await submitReport({
        projectId: selectedProject.id,
        ngoUpload: uploadedImages
      });
      
      toast.success('Progress report submitted successfully!');
      setUploadedImages([]);
      
      // Refresh data
      fetchReportableProjects();
      fetchReports(selectedProject.id);
    } catch (error) {
      toast.error('Failed to submit report');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-nb-accent mx-auto mb-4"></div>
          <p className="text-lg text-nb-ink/70">Loading reportable projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-nb-error mb-4">Error loading projects: {error}</p>
          <NBButton onClick={() => fetchReportableProjects()}>
            Try Again
          </NBButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-nb-ink mb-2">
            Project Reporting
          </h1>
          <p className="text-lg text-nb-ink/70">
            Upload geotagged progress photos for your funded projects
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Project Selection */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-display font-bold text-nb-ink mb-4">
              Select Project ({reportableProjects.length})
            </h2>
            
            {reportableProjects.length > 0 ? (
              <div className="space-y-4">
                {reportableProjects.map((project) => (
                  <NBCard 
                    key={project.id} 
                    className={`cursor-pointer transition-all ${
                      selectedProject?.id === project.id 
                        ? 'ring-2 ring-nb-accent' 
                        : 'hover:shadow-nb-sm'
                    }`}
                    onClick={() => handleSelectProject(project.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-nb-ink line-clamp-1">
                        {project.title}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        project.status === 'funded' 
                          ? 'bg-nb-accent-2 text-white'
                          : 'bg-purple-500 text-white'
                      }`}>
                        {project.status === 'funded' ? 'Funded' : 'In Progress'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-nb-ink/70">
                      <MapPin size={14} />
                      <span>{project.location}</span>
                    </div>
                    {project.fundedAt && (
                      <div className="flex items-center gap-2 text-sm text-nb-ink/70 mt-2">
                        <Calendar size={14} />
                        <span>Funded: {formatDate(project.fundedAt)}</span>
                      </div>
                    )}
                  </NBCard>
                ))}
              </div>
            ) : (
              <NBCard className="text-center">
                <Image size={48} className="text-nb-ink/30 mx-auto mb-4" />
                <h3 className="font-semibold text-nb-ink mb-2">No Projects Available</h3>
                <p className="text-sm text-nb-ink/70">
                  You don't have any funded projects that need reporting yet.
                </p>
              </NBCard>
            )}
          </div>

          {/* Upload & Reporting */}
          <div className="lg:col-span-2">
            {selectedProject ? (
              <div className="space-y-6">
                {/* Project Info */}
                <NBCard>
                  <h2 className="text-xl font-display font-bold text-nb-ink mb-4">
                    Upload Progress Report
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-nb-ink/60">Project:</span>
                      <p className="font-semibold">{selectedProject.title}</p>
                    </div>
                    <div>
                      <span className="text-sm text-nb-ink/60">Target Plants:</span>
                      <p className="font-semibold">{selectedProject.targetPlants?.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <span className="text-sm text-nb-ink/60">Description:</span>
                    <p className="text-nb-ink/80 mt-1">{selectedProject.description}</p>
                  </div>
                </NBCard>

                {/* Image Upload */}
                <NBCard>
                  <h3 className="text-lg font-semibold text-nb-ink mb-4">
                    Upload Geotagged Photos
                  </h3>
                  
                  <div className="border-2 border-dashed border-nb-ink rounded-nb p-8 text-center mb-6">
                    {uploadedImages.length > 0 ? (
                      <div>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          {uploadedImages.map((image, index) => (
                            <div key={index} className="aspect-square bg-gray-200 rounded-nb overflow-hidden">
                              <img src={image} alt={`Progress ${index + 1}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-center gap-2 text-nb-ok">
                          <CheckCircle size={20} />
                          <span>{uploadedImages.length} geotagged photos uploaded</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Upload size={48} className="text-nb-ink/30 mx-auto mb-4" />
                        <p className="text-nb-ink/70 mb-4">
                          Upload photos with GPS coordinates showing project progress
                        </p>
                        <NBButton variant="secondary" onClick={handleImageUpload}>
                          Choose Files
                        </NBButton>
                      </div>
                    )}
                  </div>

                  {uploadedImages.length > 0 && (
                    <div className="space-y-4">
                      <NBCard className="bg-nb-ok/10">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle size={20} className="text-nb-ok" />
                          <span className="font-semibold text-nb-ink">EXIF Data Verified</span>
                        </div>
                        <p className="text-sm text-nb-ink/70">
                          All uploaded images contain valid GPS coordinates and timestamps matching the project location.
                        </p>
                      </NBCard>

                      <NBButton 
                        variant="primary" 
                        onClick={handleSubmitReport}
                        className="w-full"
                      >
                        Submit Progress Report
                      </NBButton>
                    </div>
                  )}
                </NBCard>

                {/* Previous Reports */}
                {reports.length > 0 && (
                  <NBCard>
                    <h3 className="text-lg font-semibold text-nb-ink mb-4">
                      Previous Reports
                    </h3>
                    <div className="space-y-4">
                      {reports.map((report) => (
                        <div key={report.id} className="border border-nb-ink/20 rounded-nb p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-nb-ink/60" />
                              <span className="text-sm">
                                Submitted: {formatDate(report.submittedAt)}
                              </span>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              report.status === 'verified' 
                                ? 'bg-nb-ok text-white'
                                : report.status === 'submitted'
                                ? 'bg-nb-warn text-white'
                                : 'bg-nb-error text-white'
                            }`}>
                              {report.status === 'verified' ? 'Verified' : 'Pending Review'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2">
                            {report.ngoUpload.slice(0, 3).map((image, index) => (
                              <div key={index} className="aspect-square bg-gray-200 rounded overflow-hidden">
                                <img src={image} alt={`Report ${index + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                          
                          {report.status === 'verified' && report.verifiedAt && (
                            <p className="text-sm text-nb-ok mt-2">
                              ✓ Verified by DAO on {formatDate(report.verifiedAt)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </NBCard>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Image size={64} className="text-nb-ink/30 mx-auto mb-4" />
                  <h3 className="text-xl font-display font-bold text-nb-ink mb-2">
                    Select a Project
                  </h3>
                  <p className="text-nb-ink/70">
                    Choose a funded project from the left to upload progress reports.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Guidelines */}
        <NBCard className="mt-8 bg-nb-accent/10">
          <h3 className="text-lg font-semibold text-nb-ink mb-4">
            Reporting Guidelines
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-nb-ink mb-2">Photo Requirements</h4>
              <ul className="text-sm text-nb-ink/70 space-y-1">
                <li>• Photos must be taken at the project location</li>
                <li>• GPS coordinates will be automatically verified</li>
                <li>• Upload clear, high-resolution images</li>
                <li>• Show progress of plantation activities</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-nb-ink mb-2">Reporting Schedule</h4>
              <ul className="text-sm text-nb-ink/70 space-y-1">
                <li>• Submit reports monthly during planting season</li>
                <li>• Include before, during, and after photos</li>
                <li>• Reports are reviewed by DAO members</li>
                <li>• Approved reports unlock milestone payments</li>
              </ul>
            </div>
          </div>
        </NBCard>
      </div>
    </div>
  );
};

export default Reporting;
