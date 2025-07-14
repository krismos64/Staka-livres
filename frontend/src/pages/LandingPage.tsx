import { useRef } from "react";
import ChatWidget, { ChatWidgetRef } from "../components/common/ChatWidget";
import About from "../components/landing/About";
import Blog from "../components/landing/Blog";
import Contact from "../components/landing/Contact";
import Excellence from "../components/landing/Excellence";
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

interface LandingPageProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

export default function LandingPage({ onLoginClick, onSignupClick }: LandingPageProps) {
  const chatWidgetRef = useRef<ChatWidgetRef>(null);

  const handleChatButtonClick = () => {
    chatWidgetRef.current?.openChat();
  };

  return (
    <div className="bg-gray-50 text-gray-800 font-sans leading-relaxed">
      {/* Navigation */}
      <Navigation
        onLoginClick={onLoginClick}
        onChatClick={handleChatButtonClick}
      />

      <main id="main-content">
        {/* Hero Section */}
        <Hero />
        {/* Trust Indicators Section */}
        <TrustIndicators />
        {/* Testimonials Section */}
        <Testimonials />
        {/* Excellence Section */}
        <Excellence />
        {/* Services Section */}
        <Services />
        {/* Pricing Calculator Section */}
        <PricingCalculator 
          onChatClick={handleChatButtonClick} 
          onSignupClick={onSignupClick}
        />
        {/* Packs Section */}
        <Packs onSignupClick={onSignupClick} />
        {/* Blog Section */}
        <Blog />
        {/* Free Sample Section */}
        <FreeSample />
        {/* About Section */}
        <About onChatClick={handleChatButtonClick} />
        {/* FAQ Section */}
        <FAQ />
        {/* Contact Section */}
        <Contact onChatClick={handleChatButtonClick} />
        {/* Footer Section */}
        <Footer />
        <ChatWidget ref={chatWidgetRef} />
      </main>

      {/* Floating WhatsApp Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <a
          href="https://wa.me/33615078152?text=Bonjour,%20j'aimerais%20des%20informations%20sur%20vos%20services%20de%20correction%20de%20manuscrit"
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110 group relative"
        >
          <i className="fab fa-whatsapp text-2xl"></i>
          {/* Tooltip */}
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Chattez avec nous sur WhatsApp
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
          </div>
          {/* Pulse animation */}
          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-25"></div>
        </a>
      </div>
    </div>
  );
}
