import React from "react";

interface TrustBadge {
  icon: string;
  iconColor: string;
  text: string;
}

export default function TrustIndicators() {
  const trustBadges: TrustBadge[] = [
    {
      icon: "fas fa-shield-alt",
      iconColor: "text-green-500",
      text: "Service 100% français",
    },
    {
      icon: "fas fa-robot",
      iconColor: "text-red-500",
      text: "Sans IA",
    },
    {
      icon: "fas fa-lock",
      iconColor: "text-blue-500",
      text: "Données RGPD",
    },
    {
      icon: "fas fa-sync-alt",
      iconColor: "text-blue-500",
      text: "Corrections illimitées",
    },
    {
      icon: "fas fa-clock",
      iconColor: "text-purple-500",
      text: "Livraison sous 15 jours",
    },
    {
      icon: "fas fa-award",
      iconColor: "text-yellow-500",
      text: "Garantie qualité",
    },
  ];

  return (
    <section className="py-8 bg-white border-b">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500 text-sm">
          {trustBadges.map((badge, index) => (
            <div
              key={index}
              className="flex items-center gap-2 hover:text-gray-700 transition-colors duration-200"
            >
              <i className={`${badge.icon} ${badge.iconColor}`}></i>
              <span>{badge.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
