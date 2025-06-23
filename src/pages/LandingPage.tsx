import React from "react";
import About from "../components/landing/About";
import Contact from "../components/landing/Contact";
import FAQ from "../components/landing/FAQ";
import Footer from "../components/landing/Footer";
import FreeSample from "../components/landing/FreeSample";
import Hero from "../components/landing/Hero";
import Navigation from "../components/landing/Navigation";
import Packs from "../components/landing/Packs";
import PricingCalculator from "../components/landing/PricingCalculator";
import Services from "../components/landing/Services";
import Testimonials from "../components/landing/Testimonials";
import TrustIndicators from "../components/landing/TrustIndicators";
import LayoutLanding from "../components/layout/LayoutLanding";

interface LandingPageProps {
  onAccessApp?: () => void;
}

export default function LandingPage({ onAccessApp }: LandingPageProps) {
  return (
    <LayoutLanding>
      <div className="bg-gray-50 text-gray-800 font-sans leading-relaxed">
        {/* Navigation */}
        <Navigation />

        <main id="main-content">
          {/* Hero Section */}
          <Hero />

          {/* Trust Indicators Section */}
          <TrustIndicators />

          {/* Services Section */}
          <Services />

          {/* Testimonials Section */}
          <Testimonials />

          {/* Packs Section */}
          <Packs />

          {/* Pricing Calculator Section */}
          <PricingCalculator />

          {/* About Section */}
          <About />

          {/* Free Sample Section */}
          <FreeSample />

          {/* FAQ Section */}
          <FAQ />

          {/* Contact Section */}
          <Contact />

          {/* Footer Section */}
          <Footer />

          {/* Accès temporaire à l'application */}
          {onAccessApp && (
            <section className="py-8 bg-blue-600 text-white text-center">
              <div className="max-w-4xl mx-auto px-6">
                <h3 className="text-xl font-bold mb-4">Accès Espace Client</h3>
                <p className="mb-6">
                  Déjà client ? Accédez à votre espace personnel
                </p>
                <button
                  onClick={onAccessApp}
                  className="bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
                >
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Accéder à l'application
                </button>
              </div>
            </section>
          )}

          {/* Section temporaire indiquant que le reste sera découpé */}
          <section className="py-16 bg-white">
            <div className="max-w-4xl mx-auto px-6 text-center">
              <h2 className="text-3xl font-bold mb-6 text-gray-800">
                🚧 Landing Page en cours de construction
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <p className="text-blue-800 mb-4">
                  Cette page contient temporairement le HTML de la maquette. Les
                  prochaines étapes consisteront à découper le contenu en
                  composants React réutilisables.
                </p>
                <div className="grid md:grid-cols-2 gap-6 text-sm text-left">
                  <div>
                    <h3 className="font-semibold mb-3 text-blue-900">
                      Sections à migrer :
                    </h3>
                    <ul className="space-y-1 text-blue-700">
                      <li>• Excellence Section</li>
                      <li>• Blog</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 text-blue-900">
                      Futurs composants :
                    </h3>
                    <ul className="space-y-1 text-blue-700">
                      <li>
                        • <code>Hero.tsx</code> ✅
                      </li>
                      <li>
                        • <code>Navigation.tsx</code> ✅
                      </li>
                      <li>
                        • <code>Services.tsx</code> ✅
                      </li>
                      <li>
                        • <code>Testimonials.tsx</code> ✅
                      </li>
                      <li>
                        • <code>Packs.tsx</code> ✅
                      </li>
                      <li>
                        • <code>PricingCalculator.tsx</code> ✅
                      </li>
                      <li>
                        • <code>About.tsx</code> ✅
                      </li>
                      <li>
                        • <code>FreeSample.tsx</code> ✅
                      </li>
                      <li>
                        • <code>Contact.tsx</code> ✅
                      </li>
                      <li>
                        • <code>FAQ.tsx</code> ✅
                      </li>
                      <li>
                        • <code>Footer.tsx</code> ✅
                      </li>
                      <li>
                        • <code>TrustIndicators.tsx</code> ✅
                      </li>
                      <li>
                        • <code>Blog.tsx</code>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                ✅ <strong>Hero.tsx</strong> : Première section extraite
                <br />✅ <strong>Navigation.tsx</strong> : Menu responsive avec
                React hooks
                <br />✅ <strong>Services.tsx</strong> : Section services avec
                consultation gratuite !<br />✅{" "}
                <strong>Testimonials.tsx</strong> : Témoignages clients avec
                étoiles et stats !<br />✅ <strong>Packs.tsx</strong> : 3 packs
                d'édition avec tarifs et fonctionnalités !<br />✅{" "}
                <strong>PricingCalculator.tsx</strong> : Calculateur interactif
                avec tarification dégressive !<br />✅{" "}
                <strong>About.tsx</strong> : Présentation de l'équipe et moyens
                de contact !<br />✅ <strong>FreeSample.tsx</strong> :
                Formulaire "10 pages gratuites" avec upload et validation !
                <br />✅ <strong>Contact.tsx</strong> : Formulaire de contact et
                coordonnées complètes !<br />✅ <strong>FAQ.tsx</strong> :
                Questions fréquentes avec accordéon interactif !<br />✅{" "}
                <strong>Footer.tsx</strong> : Footer complet avec réseaux
                sociaux, liens et newsletter !<br />✅{" "}
                <strong>TrustIndicators.tsx</strong> : Badges de confiance avec
                6 indicateurs de qualité !<br />
                Le contenu complet de la maquette sera progressivement intégré
                dans des composants React modulaires.
              </p>
            </div>
          </section>
        </main>
      </div>
    </LayoutLanding>
  );
}
