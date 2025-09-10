import { Link } from "react-router-dom";
import {
  TreePine,
  Building2,
  Users,
  ArrowRight,
  CheckCircle,
  Shield,
  Target,
  BarChart3,
} from "lucide-react";
import NBCard from "../components/NBCard";
import NBButton from "../components/NBButton";

const Landing = () => {
  const portalCards = [
    {
      title: "Communities Portal",
      description:
        "Submit and manage blue carbon restoration projects with transparent verification processes.",
      icon: TreePine,
      link: "/ngo",
      color: "bg-nb-accent",
    },
    {
      title: "DAO Jury",
      description:
        "Participate in local verification and monitoring of restoration activities and earn money.",
      icon: Users,
      link: "/verification",
      color: "bg-nb-accent-2",
    },
    {
      title: "Carbon Marketplace",
      description:
        "Fund verified restoration projects and track environmental impact transparently and earn carbon credits.",
      icon: Building2,
      link: "/marketplace",
      color: "bg-nb-warn",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Register Project",
      description:
        "NGOs submit detailed restoration proposals with location, species, and budget information.",
    },
    {
      number: "02",
      title: "Verification",
      description:
        "Projects undergo centralized or decentralized verification by officials or DAO members.",
    },
    {
      number: "03",
      title: "Companies Investments",
      description:
        "Verified projects receive funding from companies seeking carbon offset investments.",
    },
    {
      number: "04",
      title: "Progress Reporting",
      description:
        "Regular monitoring with geotagged photos ensures transparency and accountability.",
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "Transparent Verification",
      description:
        "Dual verification system with centralized and decentralized options for maximum trust.",
    },
    {
      icon: Target,
      title: "Accurate Monitoring",
      description:
        "Geotagged photo submissions with EXIF validation ensure authentic progress reporting.",
    },
    {
      icon: BarChart3,
      title: "Impact Tracking",
      description:
        "Real-time dashboard showing carbon sequestration metrics and biodiversity improvements.",
    },
    {
      icon: CheckCircle,
      title: "Secure Funding",
      description:
        "Smart contract-based escrow ensures funds are released based on verified milestones.",
    },
  ];

  const faqs = [
    {
      question: "What is Blue Carbon MRV?",
      answer:
        "Blue Carbon MRV (Monitoring, Reporting, and Verification) is a system for tracking and verifying carbon sequestration in coastal ecosystems like mangroves, seagrass beds, and salt marshes.",
    },
    {
      question: "How does the verification process work?",
      answer:
        "Projects can be verified through centralized authorities (government officials) or decentralized voting by DAO members. Both ensure projects meet environmental and technical standards.",
    },
    {
      question: "What types of projects are eligible?",
      answer:
        "Coastal restoration projects including mangrove reforestation, seagrass restoration, salt marsh conservation, and wetland rehabilitation are all eligible for funding.",
    },
    {
      question: "How is progress monitored?",
      answer:
        "NGOs submit geotagged photographs showing project progress. EXIF data validation ensures photos are taken at the correct location and time.",
    },
  ];

  return (
    <div className="min-h-screen -mt-20">
      {/* Hero Section */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: "url(/hero2.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60"></div>
        <div className="relative z-10 max-w-7xl mx-auto text-center px-4 pb-20 pt-4">
          <div className="mb-4 mt-24">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-bold text-white mb-6 leading-tight">
              Restore Our
              <span className="text-nb-accent block bg-gradient-to-r from-nb-accent to-teal-300 bg-clip-text text-transparent">
                Blue Planet
              </span>
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-12 max-w-4xl mx-auto font-body leading-relaxed">
              Transparent blue carbon restoration platform connecting NGOs,
              communities, and corporates for verified environmental impact.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <NBButton
              variant="primary"
              size="lg"
              className="text-lg px-8 py-4 group"
            >
              <Link to="/ngo" className="flex items-center gap-3">
                Start a Project
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </NBButton>
            <NBButton
              variant="secondary"
              size="lg"
              className="text-lg px-8 py-4 group"
            >
              <Link to="/marketplace" className="flex items-center gap-3">
                Explore Funding
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </NBButton>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
                50+
              </div>
              <div className="text-sm md:text-base text-white/70">
                Active Projects
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
                1.2K
              </div>
              <div className="text-sm md:text-base text-white/70">
                Carbon Credits
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
                25
              </div>
              <div className="text-sm md:text-base text-white/70">
                Partner NGOs
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
                100%
              </div>
              <div className="text-sm md:text-base text-white/70">
                Transparent
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Cards */}
      <section className="py-24 px-4 bg-gradient-to-b from-nb-bg to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-display font-bold mb-6">
              Choose Your
              <span className="text-nb-accent block">Portal</span>
            </h2>
            <p className="text-xl text-nb-ink/70 max-w-3xl mx-auto leading-relaxed">
              Access the platform through your specific role and contribute to
              coastal ecosystem restoration with transparent, verified impact.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {portalCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <NBCard
                  key={index}
                  className="text-center group cursor-pointer relative overflow-hidden hover:scale-105 transition-all duration-300"
                >
                  <Link to={card.link} className="block">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
                      <div className="absolute inset-0 bg-gradient-to-br from-nb-accent/20 to-transparent"></div>
                    </div>

                    <div className="relative z-10">
                      <div
                        className={`w-20 h-20 ${card.color} rounded-nb flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-nb-sm`}
                      >
                        <Icon size={40} className="text-nb-ink" />
                      </div>
                      <h3 className="text-3xl font-display font-bold mb-6 group-hover:text-nb-accent transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-nb-ink/70 mb-8 text-lg leading-relaxed">
                        {card.description}
                      </p>
                      <NBButton
                        variant="ok"
                        className="group-hover:bg-nb-ok group-hover:text-nb-card transition-all duration-300"
                      >
                        Get Started
                        <ArrowRight
                          size={18}
                          className="ml-2 group-hover:translate-x-1 transition-transform"
                        />
                      </NBButton>
                    </div>
                  </Link>
                </NBCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-display font-bold mb-6">
              How It
              <span className="text-nb-accent block">Works</span>
            </h2>
            <p className="text-xl text-nb-ink/70 max-w-3xl mx-auto leading-relaxed">
              Our streamlined process ensures transparency and accountability at
              every step of the restoration journey.
            </p>
          </div>

          <div className="relative">
            {/* Connection Lines - Hidden on mobile */}
            <div className="hidden lg:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-nb-accent via-nb-accent-2 to-nb-warn"></div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {steps.map((step, index) => (
                <div key={index} className="text-center relative group">
                  {/* Step Number Circle */}
                  <div className="relative mb-8">
                    <div className="w-20 h-20 bg-nb-accent rounded-nb flex items-center justify-center mx-auto border-4 border-nb-ink group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <span className="text-3xl font-display font-bold text-nb-ink">
                        {step.number}
                      </span>
                    </div>
                    {/* Connection Dot */}
                    <div className="hidden lg:block absolute top-10 -right-6 w-3 h-3 bg-nb-accent rounded-full border-2 border-nb-ink"></div>
                  </div>

                  <h3 className="text-2xl font-display font-bold mb-6 group-hover:text-nb-accent transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-nb-ink/70 text-lg leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 bg-gradient-to-b from-white to-nb-bg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-display font-bold mb-6">
              Platform
              <span className="text-nb-accent block">Features</span>
            </h2>
            <p className="text-xl text-nb-ink/70 max-w-3xl mx-auto leading-relaxed">
              Built with cutting-edge technology to ensure maximum transparency,
              security, and impact measurement.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <NBCard
                  key={index}
                  className="text-center group hover:scale-105 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
                    <div className="absolute inset-0 bg-gradient-to-br from-nb-accent/20 to-transparent"></div>
                  </div>

                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-nb-accent/10 rounded-nb flex items-center justify-center mx-auto mb-8 group-hover:bg-nb-accent group-hover:scale-110 transition-all duration-300">
                      <Icon
                        size={32}
                        className="text-nb-accent group-hover:text-nb-ink transition-colors"
                      />
                    </div>
                    <h3 className="text-2xl font-display font-bold mb-6 group-hover:text-nb-accent transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-nb-ink/70 text-lg leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </NBCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="relative py-32 px-4 overflow-hidden"
        style={{
          backgroundImage: "url(/hero.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/80 to-black/80"></div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-nb-accent/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-nb-accent-2/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-nb-warn/20 rounded-full blur-xl animate-pulse delay-500"></div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-nb-accent/20 backdrop-blur-sm rounded-full border border-nb-accent/30 mb-8">
              <div className="w-2 h-2 bg-nb-accent rounded-full animate-pulse"></div>
              <span className="text-nb-accent font-medium">
                Join 500+ Organizations
              </span>
            </div>
            <h2 className="text-5xl md:text-7xl font-display font-bold mb-8 text-white leading-tight">
              Ready to Make an
              <span className="text-nb-accent block bg-gradient-to-r from-nb-accent to-teal-300 bg-clip-text text-transparent">
                Impact?
              </span>
            </h2>
            <p className="text-xl md:text-2xl mb-12 text-white/90 max-w-4xl mx-auto leading-relaxed">
              Join the movement to restore coastal ecosystems and combat climate
              change through verified blue carbon projects. Together, we can
              create a sustainable future for our planet.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <NBButton
              variant="primary"
              size="lg"
              className="text-lg px-8 py-4 group bg-nb-accent text-nb-card hover:bg-nb-accent/90 hover:scale-105 transition-all duration-300"
            >
              <Link to="/ngo" className="flex items-center gap-3">
                Start Your Project
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </NBButton>
            <NBButton
              variant="secondary"
              size="lg"
              className="text-lg px-8 py-4 group bg-nb-card text-nb-ink hover:bg-nb-card/90 hover:scale-105 transition-all duration-300"
            >
              <Link to="/marketplace" className="flex items-center gap-3">
                Explore Funding
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </NBButton>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
                500+
              </div>
              <div className="text-sm md:text-base text-white/70">
                Organizations
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
                $2M+
              </div>
              <div className="text-sm md:text-base text-white/70">
                Funding Raised
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
                15+
              </div>
              <div className="text-sm md:text-base text-white/70">
                Countries
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
                100%
              </div>
              <div className="text-sm md:text-base text-white/70">Verified</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
