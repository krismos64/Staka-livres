import React from "react";

interface CorrectorBubblesProps {
  className?: string;
}

const correctors = [
  { id: 1, name: "Correcteur 1", image: "/images/footer/Correcteur1 .jpg" },
  { id: 2, name: "Correcteur 2", image: "/images/footer/Correcteur2.jpg" },
  { id: 3, name: "Correcteur 3", image: "/images/footer/Correcteur3.jpg" },
  { id: 4, name: "Correcteur 4", image: "/images/footer/Correcteur4.jpg" },
  { id: 5, name: "Correcteur 5", image: "/images/footer/Correcteur5.jpg" },
  { id: 6, name: "Correcteur 6", image: "/images/footer/Correcteur6.jpg" },
  { id: 7, name: "Correcteur 7", image: "/images/footer/Correcteur7.jpg" },
  { id: 8, name: "Correcteur 8", image: "/images/footer/Correcteur8.jpg" },
  { id: 9, name: "Correcteur 9", image: "/images/footer/Correcteur9 .jpg" },
];

export default function CorrectorBubbles({ className = "" }: CorrectorBubblesProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Bulles dispersées avec animations */}
        {correctors.map((corrector, index) => {
          const positions = [
            "top-4 left-8",      // Position 1
            "top-16 right-12",   // Position 2  
            "top-32 left-20",    // Position 3
            "top-48 right-24",   // Position 4
            "top-64 left-32",    // Position 5
            "top-80 right-8",    // Position 6
            "top-96 left-16",    // Position 7
            "top-[28rem] right-20", // Position 8
            "top-[32rem] left-24"   // Position 9
          ];
          
          const sizes = [
            "w-12 h-12",   // Petite
            "w-16 h-16",   // Moyenne
            "w-14 h-14",   // Petite-moyenne
            "w-18 h-18",   // Grande
            "w-12 h-12",   // Petite
            "w-16 h-16",   // Moyenne
            "w-14 h-14",   // Petite-moyenne
            "w-12 h-12",   // Petite
            "w-16 h-16"    // Moyenne
          ];

          const delays = [
            "delay-0",
            "delay-150",
            "delay-300",
            "delay-450",
            "delay-600",
            "delay-750",
            "delay-900",
            "delay-1000",
            "delay-1150"
          ];

          return (
            <div
              key={corrector.id}
              className={`absolute ${positions[index]} ${sizes[index]} ${delays[index]} animate-pulse opacity-0 hover:opacity-100 transition-all duration-300 hidden lg:block`}
              style={{
                animationDelay: `${index * 0.2}s`,
                animationDuration: "3s",
                animationIterationCount: "infinite"
              }}
            >
              <div className="relative group">
                {/* Bulle principale */}
                <div className="relative overflow-hidden rounded-full border-3 border-white/20 shadow-2xl backdrop-blur-sm bg-gradient-to-br from-blue-400/20 to-purple-500/20 hover:from-blue-400/40 hover:to-purple-500/40 transition-all duration-500 hover:scale-110">
                  <img
                    src={corrector.image}
                    alt={corrector.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Effet de brillance */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Particules flottantes */}
                <div className="absolute -inset-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute top-0 left-1/2 w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                  <div className="absolute top-1/2 right-0 w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <div className="absolute bottom-0 left-1/4 w-1 h-1 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>

                {/* Tooltip discret */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900/90 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap backdrop-blur-sm border border-white/10">
                  Expert littéraire
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-gray-900/90" />
                </div>
              </div>
            </div>
          );
        })}

        {/* Version mobile - bulles plus petites et moins nombreuses */}
        <div className="lg:hidden">
          {correctors.slice(0, 5).map((corrector, index) => {
            const mobilePositions = [
              "top-8 left-4",
              "top-20 right-6", 
              "top-36 left-8",
              "top-52 right-4",
              "top-68 left-12"
            ];

            return (
              <div
                key={`mobile-${corrector.id}`}
                className={`absolute ${mobilePositions[index]} w-8 h-8 animate-pulse opacity-60`}
                style={{
                  animationDelay: `${index * 0.3}s`,
                  animationDuration: "4s",
                  animationIterationCount: "infinite"
                }}
              >
                <div className="relative overflow-hidden rounded-full border-2 border-white/30 shadow-lg">
                  <img
                    src={corrector.image}
                    alt={corrector.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}