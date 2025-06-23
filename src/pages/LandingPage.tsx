import React from "react";
import About from "../components/landing/About";
import Contact from "../components/landing/Contact";
import Hero from "../components/landing/Hero";
import Navigation from "../components/landing/Navigation";
import Packs from "../components/landing/Packs";
import PricingCalculator from "../components/landing/PricingCalculator";
import Services from "../components/landing/Services";
import Testimonials from "../components/landing/Testimonials";
import LayoutLanding from "../components/layout/LayoutLanding";

export default function LandingPage() {
  return (
    <LayoutLanding>
      <div className="bg-gray-50 text-gray-800 font-sans leading-relaxed">
        {/* Navigation */}
        <Navigation />

        <main id="main-content">
          {/* Hero Section */}
          <Hero />

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

          {/* Contact Section */}
          <Contact />

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
                      <li>• Trust Indicators</li>
                      <li>• Excellence Section</li>
                      <li>• Blog</li>
                      <li>• Free Sample Form</li>
                      <li>• FAQ</li>
                      <li>• Footer</li>
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
                        • <code>Contact.tsx</code> ✅
                      </li>
                      <li>
                        • <code>TrustIndicators.tsx</code>
                      </li>
                      <li>
                        • <code>Blog.tsx</code>
                      </li>
                      <li>
                        • <code>FAQ.tsx</code>
                      </li>
                      <li>
                        • <code>Footer.tsx</code>
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
                de contact !<br />✅ <strong>Contact.tsx</strong> : Formulaire
                de contact et coordonnées complètes !<br />
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
