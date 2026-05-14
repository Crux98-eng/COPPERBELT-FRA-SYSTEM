import { Link } from "react-router";
import { Shield, MapPin } from "lucide-react";

import registerImage from "@/assets/registration.png";
import transportImage from "@/assets/transport.png";
import shedImage from "@/assets/shed.png";
import fraudImage from "@/assets/froud.png";
import logo from '@/assets/fra-cbu-logo.png';
export function LandingPage() {
  const solutionCards = [
    {
      title: "Farmer Registration",
      description:
        "Secure biometric registration with GPS verification and NRC validation for all registered farmers",
      image: registerImage,
      alt: "Farmer registration illustration",
    },
    {
      title: "Transport Tracking",
      description:
        "Real-time GPS tracking of produce from collection points to storage sheds with full audit trails",
      image: transportImage,
      alt: "Transport tracking illustration",
    },
    {
      title: "Shed Procurement",
      description:
        "Automated weighing, variance detection, and instant payment processing for transparent transactions",
      image: shedImage,
      alt: "Shed procurement illustration",
    },
    {
      title: "Fraud Prevention",
      description:
        "AI-powered detection of irregularities, duplicate registrations, and suspicious transaction patterns",
      image: fraudImage,
      alt: "Fraud prevention illustration",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div
        className="relative h-screen bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1567412411487-7115605058b2?q=80&w=2000')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-primary/75"></div>

        <nav className="relative z-10 flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl text-white">Farners Market</h1>
              <p className="text-xs text-white/80">Republic of Zambia</p>
            </div>
          </div>

          <Link
            to="/login"
            className="px-6 py-2.5 bg-white text-primary rounded-lg hover:bg-white/90 transition-colors"
          >
            Officer Login
          </Link>
        </nav>

        <div className="relative z-10 flex flex-col items-center justify-center h-[calc(100vh-100px)] px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm mb-6">
              <Shield className="w-4 h-4" />
              <span>Secure & Transparent</span>
            </div>

            <h1 className="text-5xl md:text-7xl text-white mb-6 leading-tight">
              Agricultural Management
              <br />
              <span className="text-accent">& Procurement System</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto">
              Empowering Zambian farmers through transparent registration,
              real-time logistics tracking, and secure procurement processes
              under the Food Reserve Agency.
            </p>

           
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg
            className="w-full"
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 80C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="#F5F7FA"
            />
          </svg>
        </div>
      </div>

      <section className="py-20 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl text-foreground mb-4">
              Comprehensive Agricultural Solutions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A unified platform for farmer registration, transport monitoring,
              shed procurement, and fraud prevention
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {solutionCards.map((card) => (
              <div
                key={card.title}
                className="bg-card border-2 border-border rounded-xl overflow-hidden hover:border-primary transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div className="h-44 bg-muted/40 p-5 flex items-center justify-center">
                  <img
                    src={card.image}
                    alt={card.alt}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="px-5 pb-5 pt-3">
                  <h3 className="text-sm text-card-foreground mb-2">
                    {card.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm mb-6">
                <MapPin className="w-4 h-4" />
                <span>Nationwide Coverage</span>
              </div>

              <h2 className="text-4xl text-foreground mb-6">
                Serving Zambia's Agricultural Community
              </h2>

              <p className="text-lg text-muted-foreground mb-8">
                Our platform connects over 12,000 registered farmers across all
                provinces, ensuring fair access to government support programmes
                and transparent procurement processes.
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-card rounded-lg p-6 border border-border">
                  <p className="text-3xl text-primary mb-2">12,458</p>
                  <p className="text-sm text-muted-foreground">
                    Registered Farmers
                  </p>
                </div>
                <div className="bg-card rounded-lg p-6 border border-border">
                  <p className="text-3xl text-secondary mb-2">127</p>
                  <p className="text-sm text-muted-foreground">
                    Active Transport Batches
                  </p>
                </div>
                <div className="bg-card rounded-lg p-6 border border-border">
                  <p className="text-3xl text-accent mb-2">71,000</p>
                  <p className="text-sm text-muted-foreground">
                    Bags Procured This Month
                  </p>
                </div>
                <div className="bg-card rounded-lg p-6 border border-border">
                  <p className="text-3xl text-primary mb-2">97%</p>
                  <p className="text-sm text-muted-foreground">
                    Transport Success Rate
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden border-8 border-white shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1663003440160-423a0a4e057e?q=80&w=1200"
                  alt="Zambian farmers working in field"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-primary rounded-2xl opacity-10"></div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-accent rounded-2xl opacity-10"></div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-foreground text-background py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg mb-4">Food Reserve Agency</h3>
              <p className="text-background/70 text-sm">
                Ministry of Agriculture
                <br />
                Republic of Zambia
                <br />
                Lusaka, Zambia
              </p>
            </div>

            <div>
              <h3 className="text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
              
              
                <li>
                  <Link to="/login" className="text-background/70 hover:text-background">
                    Officer Login
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-background/70 hover:text-background">
                    Help & Support
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg mb-4">Contact</h3>
              <p className="text-background/70 text-sm">
                Email: info@fra.gov.zm
                <br />
                Phone: +260 211 123 456
                <br />
                Toll-Free: 5550
              </p>
            </div>
          </div>

          <div className="border-t border-background/20 mt-8 pt-8 text-center text-sm text-background/70">
            © 2026 Food Reserve Agency, Republic of Zambia. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
