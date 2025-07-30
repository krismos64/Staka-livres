import { useEffect, useRef } from 'react';

interface AuthorBubble {
  id: number;
  name: string;
  specialty: string;
  image: string;
  size: 'large' | 'medium' | 'small';
  position: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
}

const authors: AuthorBubble[] = [
  {
    id: 1,
    name: 'Correcteur Expérimenté',
    specialty: 'Romans contemporains',
    image: '/images/footer/Correcteur1-min.webp',
    size: 'large',
    position: { top: '20%', left: '15%' }
  },
  {
    id: 2,
    name: 'Expert Littéraire',
    specialty: 'Fiction littéraire',
    image: '/images/footer/Correcteur2-min.webp',
    size: 'medium',
    position: { top: '15%', right: '20%' }
  },
  {
    id: 3,
    name: 'Spécialiste SF',
    specialty: 'Science-fiction',
    image: '/images/footer/Correcteur3-min.webp',
    size: 'small',
    position: { top: '35%', left: '10%' }
  },
  {
    id: 4,
    name: 'Maître du Suspense',
    specialty: 'Thrillers',
    image: '/images/footer/Correcteur4-min.webp',
    size: 'large',
    position: { top: '50%', right: '10%' }
  },
  {
    id: 5,
    name: 'Noir & Mystère',
    specialty: 'Romans noirs',
    image: '/images/footer/Correcteur5-min.webp',
    size: 'medium',
    position: { top: '65%', left: '25%' }
  },
  {
    id: 6,
    name: 'Guide Personnel',
    specialty: 'Développement personnel',
    image: '/images/footer/Correcteur6-min.webp',
    size: 'large',
    position: { top: '25%', left: '45%' }
  },
  {
    id: 7,
    name: 'Créatrice Visuelle',
    specialty: 'Illustration & récits',
    image: '/images/footer/Correcteur7-min.webp',
    size: 'medium',
    position: { top: '70%', right: '25%' }
  },
  {
    id: 8,
    name: 'Cœur Romantique',
    specialty: 'Romance',
    image: '/images/footer/Correcteur8-min.webp',
    size: 'small',
    position: { top: '40%', right: '35%' }
  },
  {
    id: 9,
    name: 'Classique Éternelle',
    specialty: 'Littérature classique',
    image: '/images/footer/Correcteur9-min.webp',
    size: 'medium',
    position: { bottom: '10%', left: '40%' }
  }
];

export default function FloatingBubbles() {
  const containerRef = useRef<HTMLDivElement>(null);
  const particleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Animation d'entrée pour les bulles
    const animateEntry = () => {
      const bubbles = containerRef.current?.querySelectorAll('.bubble');
      if (bubbles) {
        bubbles.forEach((bubble, index) => {
          const htmlBubble = bubble as HTMLElement;
          htmlBubble.style.opacity = '0';
          htmlBubble.style.transform = 'scale(0)';
          
          setTimeout(() => {
            htmlBubble.style.transition = 'all 0.8s ease-out';
            htmlBubble.style.opacity = '1';
            htmlBubble.style.transform = 'scale(1)';
          }, index * 200);
        });
      }
    };

    // Création de particules flottantes
    const createParticle = () => {
      if (!containerRef.current) return;
      
      const particle = document.createElement('div');
      particle.className = 'floating-particle';
      
      const size = Math.random() * 10 + 5;
      particle.style.cssText = `
        position: absolute;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 50%;
        pointer-events: none;
        width: ${size}px;
        height: ${size}px;
        left: ${Math.random() * 100}%;
        animation: particleFloat ${Math.random() * 10 + 15}s linear infinite;
        animation-delay: ${Math.random() * 5}s;
      `;
      
      containerRef.current.appendChild(particle);
      
      // Supprime la particule après l'animation
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 25000);
    };

    // Démarre les animations
    setTimeout(animateEntry, 500);
    
    // Crée des particules périodiquement
    particleIntervalRef.current = setInterval(createParticle, 3000);

    // Nettoyage
    return () => {
      if (particleIntervalRef.current) {
        clearInterval(particleIntervalRef.current);
      }
    };
  }, []);

  const handleBubbleClick = (author: AuthorBubble, event: React.MouseEvent<HTMLDivElement>) => {
    const bubble = event.currentTarget;
    // Animation de pulse
    bubble.style.transform = 'scale(1.2)';
    setTimeout(() => {
      bubble.style.transform = '';
    }, 200);
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'large':
        return 'w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48';
      case 'medium':
        return 'w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36';
      case 'small':
        return 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-30 lg:h-30';
      default:
        return 'w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32';
    }
  };

  const getAnimationClass = (index: number) => {
    const animations = ['animate-float1', 'animate-float2', 'animate-float3'];
    return animations[index % 3];
  };

  return (
    <section 
      ref={containerRef}
      className="relative overflow-hidden py-20 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 min-h-screen"
    >
      {/* Titre de la section */}
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-center z-30">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
          Notre Équipe d'Experts
        </h2>
        <p className="text-lg md:text-xl text-white opacity-90 font-light">
          Des correcteurs qui excellent dans l'univers littéraire
        </p>
      </div>

      {/* Bulles des correcteurs */}
      {authors.map((author, index) => (
        <div
          key={author.id}
          className={`bubble absolute rounded-full cursor-pointer transition-all duration-300 hover:scale-110 ${getSizeClasses(author.size)} ${getAnimationClass(index)}`}
          style={{
            ...author.position,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: `
              0 20px 40px rgba(0, 0, 0, 0.1),
              inset 0 0 30px rgba(255, 255, 255, 0.1)
            `,
            animationDelay: `${index * 2}s`
          }}
          onClick={(e) => handleBubbleClick(author, e)}
        >
          {/* Reflet sur la bulle */}
          <div 
            className="absolute top-[10%] left-[10%] w-[40%] h-[40%] rounded-full pointer-events-none z-10"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.3) 0%, transparent 70%)'
            }}
          />
          
          {/* Image du correcteur */}
          <img
            src={author.image}
            alt={author.name}
            className="w-full h-full object-cover rounded-full transition-all duration-300 hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `data:image/svg+xml;base64,${btoa(`
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="100" cy="100" r="100" fill="url(#grad${author.id})"/>
                  <defs>
                    <linearGradient id="grad${author.id}" x2="1" y2="1">
                      <stop offset="0%" stop-color="#667eea"/>
                      <stop offset="100%" stop-color="#764ba2"/>
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="80" r="30" fill="rgba(255,255,255,0.4)"/>
                  <rect x="70" y="120" width="60" height="60" rx="8" fill="rgba(255,255,255,0.4)"/>
                  <text x="100" y="190" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${author.name.split(' ')[0]}</text>
                </svg>
              `)}`;
            }}
          />
          
          {/* Info bulle au survol */}
          <div 
            className="bubble-info absolute left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white px-4 py-2 rounded-full text-sm whitespace-nowrap opacity-0 transition-all duration-300 pointer-events-none z-20"
            style={{
              bottom: '-60px'
            }}
          >
            <div className="text-center">
              <div className="font-semibold">{author.name}</div>
              <div className="text-xs opacity-90">{author.specialty}</div>
            </div>
            {/* Flèche vers la bulle */}
            <div 
              className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2"
              style={{
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: '8px solid rgba(0, 0, 0, 0.8)'
              }}
            />
          </div>
        </div>
      ))}

      {/* Info en bas */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center z-30">
        <p className="text-white text-opacity-80 text-sm md:text-base font-light">
          Survolez les bulles pour découvrir nos experts • Animation interactive
        </p>
      </div>

      <style>{`
        @keyframes float1 {
          0%, 100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-15px) translateX(8px) rotate(0.5deg);
          }
          50% {
            transform: translateY(-10px) translateX(-3px) rotate(-0.5deg);
          }
          75% {
            transform: translateY(-18px) translateX(5px) rotate(0.3deg);
          }
        }

        @keyframes float2 {
          0%, 100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-20px) translateX(-10px) rotate(-0.8deg);
          }
          66% {
            transform: translateY(-8px) translateX(8px) rotate(0.6deg);
          }
        }

        @keyframes float3 {
          0%, 100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          20% {
            transform: translateY(-16px) translateX(3px) rotate(0.4deg);
          }
          40% {
            transform: translateY(-22px) translateX(-5px) rotate(-0.4deg);
          }
          60% {
            transform: translateY(-12px) translateX(10px) rotate(0.7deg);
          }
          80% {
            transform: translateY(-14px) translateX(-2px) rotate(-0.3deg);
          }
        }

        @keyframes particleFloat {
          0% {
            transform: translateY(100vh) scale(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-10vh) scale(1) rotate(360deg);
            opacity: 0;
          }
        }

        .animate-float1 {
          animation: float1 16s ease-in-out infinite;
        }

        .animate-float2 {
          animation: float2 18s ease-in-out infinite;
        }

        .animate-float3 {
          animation: float3 14s ease-in-out infinite;
        }

        .bubble:hover .bubble-info {
          opacity: 1 !important;
          bottom: -50px !important;
        }

        .bubble:hover {
          box-shadow: 
            0 30px 60px rgba(0, 0, 0, 0.2),
            inset 0 0 40px rgba(255, 255, 255, 0.2) !important;
          border-color: rgba(255, 255, 255, 0.4) !important;
          background: rgba(255, 255, 255, 0.15) !important;
        }

        /* Responsive adjustments for tablets */
        @media (max-width: 768px) {
          .bubble:nth-child(2) { top: 18% !important; left: 8% !important; right: auto !important; }
          .bubble:nth-child(3) { top: 25% !important; right: 8% !important; left: auto !important; }
          .bubble:nth-child(4) { top: 40% !important; left: 25% !important; right: auto !important; }
          .bubble:nth-child(5) { top: 50% !important; right: 15% !important; left: auto !important; }
          .bubble:nth-child(6) { top: 65% !important; left: 20% !important; right: auto !important; }
          .bubble:nth-child(7) { top: 32% !important; left: 45% !important; right: auto !important; }
          .bubble:nth-child(8) { top: 75% !important; right: 20% !important; left: auto !important; }
          .bubble:nth-child(9) { top: 48% !important; right: 35% !important; left: auto !important; }
          .bubble:nth-child(10) { bottom: 8% !important; left: 40% !important; top: auto !important; }
        }

        /* Mobile responsive - Better spacing */
        @media (max-width: 640px) {
          .bubble:nth-child(2) { top: 20% !important; left: 10% !important; right: auto !important; }
          .bubble:nth-child(3) { top: 30% !important; right: 10% !important; left: auto !important; }
          .bubble:nth-child(4) { top: 45% !important; left: 30% !important; right: auto !important; }
          .bubble:nth-child(5) { top: 55% !important; right: 20% !important; left: auto !important; }
          .bubble:nth-child(6) { top: 70% !important; left: 25% !important; right: auto !important; }
          .bubble:nth-child(7) { top: 35% !important; left: 50% !important; right: auto !important; }
          .bubble:nth-child(8) { top: 80% !important; right: 25% !important; left: auto !important; }
          .bubble:nth-child(9) { top: 50% !important; right: 40% !important; left: auto !important; }
          .bubble:nth-child(10) { bottom: 5% !important; left: 45% !important; top: auto !important; }
        }

        /* Small mobile adjustments */
        @media (max-width: 480px) {
          .bubble:nth-child(2) { top: 22% !important; left: 15% !important; }
          .bubble:nth-child(3) { top: 35% !important; right: 15% !important; }
          .bubble:nth-child(4) { top: 50% !important; left: 35% !important; }
          .bubble:nth-child(5) { top: 62% !important; right: 25% !important; }
          .bubble:nth-child(6) { top: 75% !important; left: 30% !important; }
          .bubble:nth-child(7) { top: 40% !important; left: 55% !important; }
          .bubble:nth-child(8) { top: 85% !important; right: 30% !important; }
          .bubble:nth-child(9) { top: 55% !important; right: 45% !important; }
          .bubble:nth-child(10) { bottom: 3% !important; left: 50% !important; }

          .bubble-info {
            font-size: 11px;
            padding: 4px 8px;
            max-width: 200px;
            white-space: normal;
            text-align: center;
          }
        }
      `}</style>
    </section>
  );
}