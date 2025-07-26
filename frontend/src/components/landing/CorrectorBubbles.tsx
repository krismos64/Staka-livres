interface CorrectorBubblesProps {
  className?: string;
}

const correctors = [
  { id: 1, name: "Correcteur 1", image: "/images/footer/Correcteur1-min.webp", fallback: "#ef4444" },
  { id: 2, name: "Correcteur 2", image: "/images/footer/Correcteur2-min.webp", fallback: "#3b82f6" },
  { id: 3, name: "Correcteur 3", image: "/images/footer/Correcteur3-min.webp", fallback: "#10b981" },
  { id: 4, name: "Correcteur 4", image: "/images/footer/Correcteur4-min.webp", fallback: "#f59e0b" },
  { id: 5, name: "Correcteur 5", image: "/images/footer/Correcteur5-min.webp", fallback: "#8b5cf6" },
  { id: 6, name: "Correcteur 6", image: "/images/footer/Correcteur6-min.webp", fallback: "#ec4899" },  
  { id: 7, name: "Correcteur 7", image: "/images/footer/Correcteur7-min.webp", fallback: "#06b6d4" },
  { id: 8, name: "Correcteur 8", image: "/images/footer/Correcteur8-min.webp", fallback: "#84cc16" },
  { id: 9, name: "Correcteur 9", image: "/images/footer/Correcteur9-min.webp", fallback: "#f97316" },
];

// Disposition professionnelle : 4 à gauche, 5 à droite - mieux dispersées
const positions = [
  // 4 bulles côté gauche - plus dispersées
  "top-8 left-4", // Gauche très haut
  "top-36 left-20", // Gauche milieu-haut (plus espacé)
  "top-64 left-8", // Gauche milieu-bas
  "top-92 left-24", // Gauche bas

  // 5 bulles côté droite - mieux dispersées
  "top-12 right-20", // Droite haut
  "top-32 right-6", // Droite milieu-haut
  "top-60 right-24", // Droite milieu
  "top-80 right-10", // Droite milieu-bas
  "top-104 right-18", // Droite bas
];

export default function CorrectorBubbles({
  className = "",
}: CorrectorBubblesProps) {
  console.log("CorrectorBubbles rendering...");

  return (
    <div className={`relative ${className}`}>
      {correctors.map((corrector, index) => (
        <div
          key={corrector.id}
          className={`absolute ${positions[index]} w-16 h-16 opacity-80 hover:opacity-100 transition-opacity duration-300 animate-pulse`}
          style={{
            animationDelay: `${index * 0.3}s`,
            animationDuration: "4s",
          }}
        >
          <div className="relative group overflow-hidden rounded-full border-2 border-white/60 shadow-lg bg-gradient-to-br from-blue-400/30 to-purple-500/30 hover:border-white/80 hover:shadow-xl transition-all duration-300">
            <img
              src={corrector.image}
              alt={corrector.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="eager"
              onError={(e) => {
                console.log("Image failed to load:", corrector.image);
                // Afficher directement le placeholder coloré
                const target = e.currentTarget;
                target.style.display = "none";
                const parent = target.parentElement as HTMLElement;
                if (parent) {
                  parent.style.backgroundColor = corrector.fallback;
                  parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-sm">C${corrector.id}</div>`;
                }
              }}
              onLoad={() =>
                console.log("Image loaded successfully:", corrector.image)
              }
            />

            {/* Tooltip */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Expert littéraire
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
