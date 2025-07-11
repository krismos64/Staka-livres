import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: string;
  color?: string; // ex: "from-blue-500 to-cyan-400"
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = "from-gray-700 to-gray-800",
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-shadow duration-300 ease-in-out border border-gray-100">
      <div className="flex items-center gap-6">
        {/* Icône stylisée */}
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br ${color} text-white shadow-lg`}
        >
          <i className={`${icon} text-2xl`}></i>
        </div>

        {/* Contenu texte */}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-4xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
      </div>

      {/* Tendance (si fournie) */}
      {trend && <p className="text-sm text-gray-400 mt-4">{trend}</p>}
    </div>
  );
};

export default StatCard;
