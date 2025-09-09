import { Link } from 'react-router-dom';
import { TreePine, Building2, Users, ArrowRight, CheckCircle, Shield, Target, BarChart3 } from 'lucide-react';
import NBCard from '../components/NBCard';
import NBButton from '../components/NBButton';

const Landing = () => {
  const portalCards = [
    {
      title: 'NGO Portal',
      description: 'Submit and manage blue carbon restoration projects with transparent verification processes.',
      icon: TreePine,
      link: '/ngo',
      color: 'bg-nb-accent'
    },
    {
      title: 'Panchayat & Communities',
      description: 'Participate in local verification and monitoring of restoration activities.',
      icon: Users,
      link: '/verification',
      color: 'bg-nb-accent-2'
    },
    {
      title: 'CSR Companies',
      description: 'Fund verified restoration projects and track environmental impact transparently.',
      icon: Building2,
      link: '/csr',
      color: 'bg-nb-warn'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Register Project',
      description: 'NGOs submit detailed restoration proposals with location, species, and budget information.'
    },
    {
      number: '02',
      title: 'Verification',
      description: 'Projects undergo centralized or decentralized verification by officials or DAO members.'
    },
    {
      number: '03',
      title: 'CSR Funding',
      description: 'Verified projects receive funding from companies seeking carbon offset investments.'
    },
    {
      number: '04',
      title: 'Progress Reporting',
      description: 'Regular monitoring with geotagged photos ensures transparency and accountability.'
    }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Transparent Verification',
      description: 'Dual verification system with centralized and decentralized options for maximum trust.'
    },
    {
      icon: Target,
      title: 'Accurate Monitoring',
      description: 'Geotagged photo submissions with EXIF validation ensure authentic progress reporting.'
    },
    {
      icon: BarChart3,
      title: 'Impact Tracking',
      description: 'Real-time dashboard showing carbon sequestration metrics and biodiversity improvements.'
    },
    {
      icon: CheckCircle,
      title: 'Secure Funding',
      description: 'Smart contract-based escrow ensures funds are released based on verified milestones.'
    }
  ];

  const faqs = [
    {
      question: 'What is Blue Carbon MRV?',
      answer: 'Blue Carbon MRV (Monitoring, Reporting, and Verification) is a system for tracking and verifying carbon sequestration in coastal ecosystems like mangroves, seagrass beds, and salt marshes.'
    },
    {
      question: 'How does the verification process work?',
      answer: 'Projects can be verified through centralized authorities (government officials) or decentralized voting by DAO members. Both ensure projects meet environmental and technical standards.'
    },
    {
      question: 'What types of projects are eligible?',
      answer: 'Coastal restoration projects including mangrove reforestation, seagrass restoration, salt marsh conservation, and wetland rehabilitation are all eligible for funding.'
    },
    {
      question: 'How is progress monitored?',
      answer: 'NGOs submit geotagged photographs showing project progress. EXIF data validation ensures photos are taken at the correct location and time.'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-nb-bg to-nb-accent/10 py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-nb-ink mb-6">
            Restore Our
            <span className="text-nb-accent block">Blue Planet</span>
          </h1>
          <p className="text-xl md:text-2xl text-nb-ink/80 mb-12 max-w-3xl mx-auto font-body">
            Transparent blue carbon restoration platform connecting NGOs, communities, and corporates for verified environmental impact.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <NBButton variant="primary" size="lg" className="text-lg">
              <Link to="/ngo" className="flex items-center gap-2">
                Start a Project
                <ArrowRight size={20} />
              </Link>
            </NBButton>
            <NBButton variant="secondary" size="lg" className="text-lg">
              <Link to="/csr">
                Explore Funding
              </Link>
            </NBButton>
          </div>
        </div>
      </section>

      {/* Portal Cards */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-display font-bold text-center mb-4">
            Choose Your Portal
          </h2>
          <p className="text-lg text-center text-nb-ink/70 mb-12 max-w-2xl mx-auto">
            Access the platform through your specific role and contribute to coastal ecosystem restoration.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {portalCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <NBCard key={index} className="text-center group cursor-pointer">
                  <Link to={card.link}>
                    <div className={`w-16 h-16 ${card.color} rounded-nb flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                      <Icon size={32} className="text-nb-ink" />
                    </div>
                    <h3 className="text-2xl font-display font-bold mb-4">{card.title}</h3>
                    <p className="text-nb-ink/70 mb-6">{card.description}</p>
                    <NBButton variant="ghost" className="group-hover:bg-nb-ink group-hover:text-nb-card">
                      Get Started
                      <ArrowRight size={16} className="ml-2" />
                    </NBButton>
                  </Link>
                </NBCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-nb-card">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-display font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-lg text-center text-nb-ink/70 mb-16 max-w-2xl mx-auto">
            Our streamlined process ensures transparency and accountability at every step.
          </p>
          
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-nb-accent rounded-nb flex items-center justify-center mx-auto mb-6 border-2 border-nb-ink">
                  <span className="text-2xl font-display font-bold text-nb-ink">{step.number}</span>
                </div>
                <h3 className="text-xl font-display font-bold mb-4">{step.title}</h3>
                <p className="text-nb-ink/70">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-display font-bold text-center mb-16">
            Platform Features
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <NBCard key={index} className="text-center">
                  <Icon size={48} className="text-nb-accent mx-auto mb-6" />
                  <h3 className="text-xl font-display font-bold mb-4">{feature.title}</h3>
                  <p className="text-nb-ink/70">{feature.description}</p>
                </NBCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-nb-card">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-display font-bold text-center mb-16">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <NBCard key={index}>
                <h3 className="text-xl font-display font-bold mb-4 text-nb-ink">
                  {faq.question}
                </h3>
                <p className="text-nb-ink/70 leading-relaxed">
                  {faq.answer}
                </p>
              </NBCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-nb-accent to-nb-accent-2">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-display font-bold mb-6 text-nb-ink">
            Ready to Make an Impact?
          </h2>
          <p className="text-xl mb-8 text-nb-ink/80">
            Join the movement to restore coastal ecosystems and combat climate change through verified blue carbon projects.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <NBButton variant="primary" size="lg" className="bg-nb-ink text-nb-card hover:bg-nb-ink/90">
              <Link to="/ngo">Start Your Project</Link>
            </NBButton>
            <NBButton variant="secondary" size="lg" className="bg-nb-card text-nb-ink hover:bg-nb-card/90">
              <Link to="/csr">Explore Funding</Link>
            </NBButton>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
