import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@/hooks/useGSAP";
import { useAppStore } from "@/stores/useAppStore";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Database,
  Shield,
  Zap,
  Users,
  Download,
  Upload,
} from "lucide-react";

export const Landing = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const { animatePageEnter, animateTextReveal } = useGSAP();
  const { setUploadModalOpen } = useAppStore();

  useEffect(() => {
    if (heroRef.current) {
      animatePageEnter(heroRef.current);
    }
    if (featuresRef.current) {
      animateTextReveal(featuresRef.current);
    }
    if (stepsRef.current) {
      animateTextReveal(stepsRef.current);
    }
  }, []);

  const features = [
    {
      icon: Shield,
      title: "Decentralized & Secure",
      description:
        "Built on StarkNet with cryptographic proof of ownership and transparent transactions.",
    },
    {
      icon: Database,
      title: "IPFS Storage",
      description:
        "Datasets stored on IPFS ensuring permanence, availability, and censorship resistance.",
    },
    {
      icon: Zap,
      title: "Instant Access",
      description:
        "Purchase and download datasets instantly with smart contract automation.",
    },
    {
      icon: Users,
      title: "Global Community",
      description:
        "Connect with AI researchers and data scientists from around the world.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Connect Wallet",
      description:
        "Connect your StarkNet wallet (ArgentX or Braavos) to get started.",
    },
    {
      number: "02",
      title: "Browse & Purchase",
      description:
        "Explore high-quality datasets across multiple AI domains and purchase with STRK.",
    },
    {
      number: "03",
      title: "Download & Train",
      description:
        "Instantly download your purchased datasets and start training your AI models.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section ref={heroRef} className="relative py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="ainest-section-title text-5xl lg:text-7xl">
              Decentralized AI
              <br />
              <span className="text-muted-foreground">Dataset Marketplace</span>
            </h1>

            <p className="ainest-text-large max-w-2xl mx-auto">
              Trade AI datasets on StarkNet. Built for researchers, by
              researchers. Secure, transparent, and global access to premium
              training data.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Link to="/marketplace">
                <Button className="ainest-btn-primary text-lg px-8 py-4 flex items-center space-x-2">
                  <span>Explore Datasets</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>

              <div className="flex items-center space-x-4 text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span className="text-sm">1,247 Datasets</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">3,891 Users</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="ainest-section-title">Why Choose AInest?</h2>
            <p className="ainest-text-large max-w-2xl mx-auto">
              Experience the future of AI dataset trading with blockchain
              technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="ainest-card text-center space-y-4">
                <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto">
                  <feature.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section ref={stepsRef} className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="ainest-section-title">How It Works</h2>
            <p className="ainest-text-large max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="ainest-card space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-bold text-lg">
                      {step.number}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed pl-16">
                    {step.description}
                  </p>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-border transform -translate-y-1/2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground absolute -right-1 -top-2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold">
              Ready to Start Training?
            </h2>
            <p className="text-xl opacity-90 leading-relaxed">
              Join thousands of AI researchers already using AInest to access
              premium datasets and monetize their data contributions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/marketplace">
                <Button variant="secondary" className="text-lg px-8 py-4">
                  Browse Datasets
                </Button>
              </Link>
              <Button
                variant="outline"
                className="text-lg px-8 py-4 border-primary-foreground text-primary-foreground bg-primary-foreground text-primary"
                onClick={() => setUploadModalOpen(true)}
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Dataset
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
