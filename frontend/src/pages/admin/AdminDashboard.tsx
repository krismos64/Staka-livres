import {
  DollarSign,
  FileText,
  HelpCircle,
  Mail,
  Receipt,
  ShoppingCart,
  Users,
} from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  const adminName = user?.prenom || "Admin";

  const menuItems = [
    {
      name: "Commandes",
      icon: ShoppingCart,
      path: "/admin/commandes",
      bgColor: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
    },
    {
      name: "Tarifs",
      icon: DollarSign,
      path: "/admin/tarifs",
      bgColor: "bg-green-500",
      hoverColor: "hover:bg-green-600",
    },
    {
      name: "FAQ",
      icon: HelpCircle,
      path: "/admin/faq",
      bgColor: "bg-yellow-500",
      hoverColor: "hover:bg-yellow-600",
    },
    {
      name: "Utilisateurs",
      icon: Users,
      path: "/admin/utilisateurs",
      bgColor: "bg-purple-500",
      hoverColor: "hover:bg-purple-600",
    },
    {
      name: "Pages",
      icon: FileText,
      path: "/admin/pages",
      bgColor: "bg-indigo-500",
      hoverColor: "hover:bg-indigo-600",
    },
    {
      name: "Factures",
      icon: Receipt,
      path: "/admin/factures",
      bgColor: "bg-red-500",
      hoverColor: "hover:bg-red-600",
    },
    {
      name: "Messagerie",
      icon: Mail,
      path: "/admin/messagerie",
      bgColor: "bg-pink-500",
      hoverColor: "hover:bg-pink-600",
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        Bonjour {adminName},
      </h1>
      <p className="text-lg text-gray-600 mb-10">
        Bienvenue dans votre espace d’administration Staka Livres !
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {menuItems.map((item, index) => (
          <Link
            to={item.path}
            key={item.name}
            className={`
              ${item.bgColor} 
              text-white 
              p-6 
              rounded-lg 
              shadow-lg 
              flex 
              flex-col 
              items-center 
              justify-center 
              transform 
              transition-all 
              duration-300 
              hover:scale-105 
              hover:shadow-xl
              focus:outline-none
              focus:ring-4
              focus:ring-offset-2
              focus:ring-offset-gray-100
              ${item.hoverColor.replace("hover:", "focus:")}
            `}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <item.icon className="w-12 h-12 mb-4" />
            <span className="text-xl font-semibold">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
