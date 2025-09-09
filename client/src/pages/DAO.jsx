import { useEffect, useState } from 'react';
import { Check, X, Eye, Users, ThumbsUp, ThumbsDown, Image } from 'lucide-react';
import { toast } from 'sonner';
import { useReportingStore } from '../stores/useReportingStore';
import NBCard from '../components/NBCard';
import NBButton from '../components/NBButton';

const DAO = () => {
  const {
    pendingReports,
    loading,
    error,
    fetchPendingReports,
    verifyReport
  } = useReportingStore();

  const [selectedReport, setSelectedReport] = useState(null);
  const [daoUploadedImages, setDaoUploadedImages] = useState([]);

  useEffect(() => {
    fetchPendingReports();
  }, [fetchPendingReports]);

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setDaoUploadedImages([]);
  };

  const handleDaoImageUpload = () => {
    // Mock DAO image upload for comparison
    const mockImages = [
      '/api/placeholder/600/400',
      '/api/placeholder/600/400'
    ];
    
    setDaoUploadedImages(mockImages);
    toast.success('DAO verification photos uploaded!');
  };

  const handleVerifyReport = async (approve) => {
    if (!selectedReport) return;

    try {
      await verifyReport(selectedReport.id, daoUploadedImages);
      
      if (approve) {
        toast.success('Report approved! NGO will be notified of successful verification.');
      } else {
        toast.error('Report rejected. NGO will need to resubmit with corrections.');
      }
      
      setSelectedReport(null);
      setDaoUploadedImages([]);
      fetchPendingReports();
    } catch (error) {
      toast.error('Failed to submit verification');
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
          <p className="text-lg text-nb-ink/70">Loading pending reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-nb-error mb-4">Error loading reports: {error}</p>
          <NBButton onClick={() => fetchPendingReports()}>
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
            DAO Verification
          </h1>
          <p className="text-lg text-nb-ink/70">
            Review and verify NGO progress reports through decentralized voting
          </p>
        </div>

        {/* DAO Info */}
        <NBCard className="mb-8 bg-gradient-to-r from-nb-accent-2/10 to-purple-500/10">
          <div className="flex items-start gap-4">
            <Users size={32} className="text-nb-accent-2 mt-1" />
            <div>
              <h3 className="text-xl font-display font-bold text-nb-ink mb-2">
                Decentralized Verification Process
              </h3>
              <p className="text-nb-ink/70 mb-4">
                As a DAO member, you help ensure the integrity of blue carbon projects by verifying NGO progress reports.
                Your votes are recorded on the blockchain for full transparency.
              </p>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-nb-ok" />
                  <span>Upload verification photos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-nb-accent-2" />
                  <span>Compare with NGO submissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-purple-500" />
                  <span>Vote approve/reject collectively</span>
                </div>
              </div>
            </div>
          </div>
        </NBCard>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Pending Reports List */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-display font-bold text-nb-ink mb-4">
              Pending Verification ({pendingReports.length})
            </h2>
            
            {pendingReports.length > 0 ? (
              <div className="space-y-4">
                {pendingReports.map((report) => (
                  <NBCard 
                    key={report.id} 
                    className={`cursor-pointer transition-all ${
                      selectedReport?.id === report.id 
                        ? 'ring-2 ring-nb-accent-2' 
                        : 'hover:shadow-nb-sm'
                    }`}
                    onClick={() => handleViewReport(report)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-nb-ink text-sm">
                        Report #{report.id.slice(-6)}
                      </h3>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-nb-warn text-white">
                        Pending
                      </span>
                    </div>
                    <p className="text-sm text-nb-ink/70 mb-2">
                      Project: {report.projectId}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-nb-ink/60">
                      <span>Submitted: {formatDate(report.submittedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-nb-ink/60 mt-1">
                      <Image size={12} />
                      <span>{report.ngoUpload.length} NGO photos</span>
                    </div>
                  </NBCard>
                ))}
              </div>
            ) : (
              <NBCard className="text-center">
                <Check size={48} className="text-nb-ok mx-auto mb-4" />
                <h3 className="font-semibold text-nb-ink mb-2">All Caught Up!</h3>
                <p className="text-sm text-nb-ink/70">
                  No reports pending verification at the moment.
                </p>
              </NBCard>
            )}
          </div>

          {/* Verification Interface */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <div className="space-y-6">
                {/* Report Details */}
                <NBCard>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-display font-bold text-nb-ink">
                      Verify Report #{selectedReport.id.slice(-6)}
                    </h2>
                    <span className="text-sm text-nb-ink/60">
                      Submitted: {formatDate(selectedReport.submittedAt)}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-nb-ink/60">Project ID:</span>
                      <p className="font-semibold">{selectedReport.projectId}</p>
                    </div>
                    <div>
                      <span className="text-sm text-nb-ink/60">EXIF Verification:</span>
                      <p className="font-semibold flex items-center gap-1">
                        <Check size={16} className="text-nb-ok" />
                        GPS Coordinates Valid
                      </p>
                    </div>
                  </div>
                </NBCard>

                {/* Photo Comparison */}
                <NBCard>
                  <h3 className="text-lg font-semibold text-nb-ink mb-4">
                    Photo Comparison
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* NGO Photos */}
                    <div>
                      <h4 className="font-medium text-nb-ink mb-3 flex items-center gap-2">
                        <span>NGO Submitted Photos</span>
                        <span className="px-2 py-1 rounded text-xs bg-nb-accent text-nb-ink">
                          {selectedReport.ngoUpload.length} photos
                        </span>
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedReport.ngoUpload.map((photo, index) => (
                          <div key={index} className="aspect-square bg-gray-200 rounded-nb overflow-hidden border border-nb-ink">
                            <img 
                              src={photo} 
                              alt={`NGO Photo ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* DAO Photos */}
                    <div>
                      <h4 className="font-medium text-nb-ink mb-3 flex items-center gap-2">
                        <span>DAO Verification Photos</span>
                        {daoUploadedImages.length > 0 && (
                          <span className="px-2 py-1 rounded text-xs bg-nb-accent-2 text-white">
                            {daoUploadedImages.length} photos
                          </span>
                        )}
                      </h4>
                      
                      {daoUploadedImages.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {daoUploadedImages.map((photo, index) => (
                            <div key={index} className="aspect-square bg-gray-200 rounded-nb overflow-hidden border border-nb-ink">
                              <img 
                                src={photo} 
                                alt={`DAO Photo ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-nb-ink rounded-nb p-6 text-center">
                          <Image size={32} className="text-nb-ink/30 mx-auto mb-3" />
                          <p className="text-sm text-nb-ink/70 mb-3">
                            Upload your verification photos from the same location
                          </p>
                          <NBButton variant="secondary" size="sm" onClick={handleDaoImageUpload}>
                            Upload Photos
                          </NBButton>
                        </div>
                      )}
                    </div>
                  </div>
                </NBCard>

                {/* Voting Interface */}
                <NBCard>
                  <h3 className="text-lg font-semibold text-nb-ink mb-4">
                    Cast Your Vote
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 border border-nb-ok/30 rounded-nb">
                      <div className="flex items-center gap-2 mb-2">
                        <ThumbsUp size={20} className="text-nb-ok" />
                        <span className="font-semibold text-nb-ink">Approve Report</span>
                      </div>
                      <p className="text-sm text-nb-ink/70">
                        The NGO photos match the current site conditions and show genuine progress.
                      </p>
                    </div>
                    
                    <div className="p-4 border border-nb-error/30 rounded-nb">
                      <div className="flex items-center gap-2 mb-2">
                        <ThumbsDown size={20} className="text-nb-error" />
                        <span className="font-semibold text-nb-ink">Reject Report</span>
                      </div>
                      <p className="text-sm text-nb-ink/70">
                        The photos don't match site conditions or show insufficient progress.
                      </p>
                    </div>
                  </div>

                  {daoUploadedImages.length > 0 ? (
                    <div className="flex gap-4 justify-center">
                      <NBButton 
                        variant="destructive" 
                        onClick={() => handleVerifyReport(false)}
                        icon={<X size={16} />}
                      >
                        Vote Reject
                      </NBButton>
                      <NBButton 
                        variant="primary" 
                        onClick={() => handleVerifyReport(true)}
                        icon={<Check size={16} />}
                      >
                        Vote Approve
                      </NBButton>
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-nb-warn/10 rounded-nb">
                      <p className="text-sm text-nb-ink/70">
                        Please upload verification photos before voting
                      </p>
                    </div>
                  )}
                </NBCard>

                {/* Voting Stats */}
                <NBCard className="bg-nb-accent-2/10">
                  <h3 className="text-lg font-semibold text-nb-ink mb-4">
                    Current Voting Status
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-nb-ok">8</div>
                      <div className="text-sm text-nb-ink/60">Approve Votes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-nb-error">2</div>
                      <div className="text-sm text-nb-ink/60">Reject Votes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-nb-ink">12</div>
                      <div className="text-sm text-nb-ink/60">Threshold</div>
                    </div>
                  </div>
                  <p className="text-center text-sm text-nb-ink/70 mt-4">
                    4 more votes needed to reach decision threshold
                  </p>
                </NBCard>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Eye size={64} className="text-nb-ink/30 mx-auto mb-4" />
                  <h3 className="text-xl font-display font-bold text-nb-ink mb-2">
                    Select a Report
                  </h3>
                  <p className="text-nb-ink/70">
                    Choose a pending report from the left to begin verification.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* DAO Guidelines */}
        <NBCard className="mt-8 bg-purple-500/10">
          <h3 className="text-lg font-semibold text-nb-ink mb-4">
            DAO Verification Guidelines
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-nb-ink mb-2">Verification Process</h4>
              <ul className="text-sm text-nb-ink/70 space-y-1">
                <li>• Visit the project site if possible</li>
                <li>• Upload photos from the same location</li>
                <li>• Compare NGO photos with current conditions</li>
                <li>• Vote based on actual progress observed</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-nb-ink mb-2">Voting Guidelines</h4>
              <ul className="text-sm text-nb-ink/70 space-y-1">
                <li>• Approve if photos show genuine progress</li>
                <li>• Reject if photos seem outdated or fake</li>
                <li>• 12 votes needed to reach decision threshold</li>
                <li>• All votes are recorded on blockchain</li>
              </ul>
            </div>
          </div>
        </NBCard>
      </div>
    </div>
  );
};

export default DAO;
