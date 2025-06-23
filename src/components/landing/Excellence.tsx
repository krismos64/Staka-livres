import React from "react";

interface ExcellenceStat {
  icon: string;
  iconColor: string;
  badgeColor: string;
  number: string;
  unit: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
}

interface ExcellenceGuarantee {
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
}

export default function Excellence() {
  const excellenceStats: ExcellenceStat[] = [
    {
      icon: "fas fa-award",
      iconColor: "text-yellow-300",
      badgeColor: "bg-yellow-400",
      number: "15",
      unit: "années",
      description: "d'expertise éditoriale reconnue",
      gradientFrom: "from-yellow-300",
      gradientTo: "to-orange-300",
    },
    {
      icon: "fas fa-users",
      iconColor: "text-green-300",
      badgeColor: "bg-green-400",
      number: "1500+",
      unit: "auteurs",
      description: "accompagnés avec succès",
      gradientFrom: "from-green-300",
      gradientTo: "to-emerald-300",
    },
    {
      icon: "fas fa-building",
      iconColor: "text-purple-300",
      badgeColor: "bg-purple-400",
      number: "Standard",
      unit: "professionnel",
      description: "des plus grandes maisons d'édition",
      gradientFrom: "from-purple-300",
      gradientTo: "to-pink-300",
    },
  ];

  const excellenceGuarantees: ExcellenceGuarantee[] = [
    {
      icon: "fas fa-medal",
      iconColor: "text-yellow-300",
      title: "Qualité certifiée",
      subtitle: "Niveau maison d'édition",
    },
    {
      icon: "fas fa-handshake",
      iconColor: "text-green-300",
      title: "Satisfait ou corrigé",
      subtitle: "Modifications illimitées",
    },
    {
      icon: "fas fa-clock",
      iconColor: "text-blue-300",
      title: "Délais respectés",
      subtitle: "Livraison garantie",
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            L'excellence éditoriale à votre portée
          </h2>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto leading-relaxed">
            Obtenez un manuscrit aux standards des plus grandes maisons
            d'édition
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {excellenceStats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
                  <i
                    className={`${stat.icon} text-4xl ${stat.iconColor}`}
                    aria-hidden="true"
                  ></i>
                </div>
                <div
                  className={`absolute -top-2 -right-2 w-8 h-8 ${stat.badgeColor} rounded-full flex items-center justify-center`}
                >
                  <span className="text-sm font-bold text-gray-800">✓</span>
                </div>
              </div>
              <div
                className={`${
                  stat.number === "Standard"
                    ? "text-3xl md:text-4xl"
                    : "text-5xl md:text-6xl"
                } font-bold mb-2 bg-gradient-to-r ${stat.gradientFrom} ${
                  stat.gradientTo
                } bg-clip-text text-transparent`}
              >
                {stat.number}
              </div>
              <div className="text-2xl font-semibold mb-2">{stat.unit}</div>
              <p className="text-blue-100 text-lg">{stat.description}</p>
            </div>
          ))}
        </div>

        {/* Excellence Guarantee */}
        <div className="bg-white/10 backdrop-blur rounded-3xl p-8 md:p-12 text-center">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold mb-6">
              🏆 Notre garantie qualité
            </h3>
            <p className="text-lg md:text-xl mb-8 opacity-90 leading-relaxed">
              Votre manuscrit sera traité selon les mêmes exigences que celles
              des plus prestigieuses maisons d'édition françaises. Correction
              rigoureuse, mise en page impeccable, et respect absolu des codes
              éditoriaux professionnels.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              {excellenceGuarantees.map((guarantee, index) => (
                <div key={index} className="bg-white/10 rounded-2xl p-6">
                  <i
                    className={`${guarantee.icon} text-3xl ${guarantee.iconColor} mb-3`}
                    aria-hidden="true"
                  ></i>
                  <div className="font-semibold">{guarantee.title}</div>
                  <div className="text-sm opacity-80">{guarantee.subtitle}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
