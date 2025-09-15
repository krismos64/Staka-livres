import { useState, useEffect } from 'react';

export default function PromotionalBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 overflow-hidden shadow-2xl">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-40 h-40 bg-white opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-300 opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-20 w-40 h-40 bg-pink-300 opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <div className="relative container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-center text-center md:text-left gap-6">
          {/* Icon/Visual element */}
          <div className="flex-shrink-0">
            <div className={`w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transform transition-all duration-1000 ${isVisible ? 'scale-100 rotate-0' : 'scale-0 rotate-180'} hover:scale-110`}>
              <div className="relative">
                <i className="fas fa-credit-card text-3xl text-white"></i>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center animate-promotional-pulse">
                  <span className="text-xs font-bold text-white">10×</span>
                </div>
              </div>
            </div>
          </div>

          {/* Text content */}
          <div className="flex-1">
            <h2 className={`text-2xl md:text-3xl font-bold text-white transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <span className="inline-block animate-promotional-pulse mr-2">💳</span>
              Payez en 10 fois sans frais
            </h2>
          </div>
        </div>

        {/* Animated border effect */}
        <div className="absolute inset-2 border border-white/30 rounded-lg pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer rounded-lg"></div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-float"></div>
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-yellow-300/50 rounded-full animate-float animation-delay-1000"></div>
          <div className="absolute bottom-1/4 left-3/4 w-3 h-3 bg-pink-300/30 rounded-full animate-float animation-delay-2000"></div>
          <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-blue-200/40 rounded-full animate-float animation-delay-4000"></div>
        </div>
      </div>
    </div>
  );
}