import { StatutCommande } from "@shared/index";
import React from "react";

interface CommandeStatusSelectProps {
  currentStatus: StatutCommande;
  onStatusChange: (status: StatutCommande) => void;
  disabled?: boolean;
}

const CommandeStatusSelect: React.FC<CommandeStatusSelectProps> = ({
  currentStatus,
  onStatusChange,
  disabled = false,
}) => {
  const statusOptions = [
    {
      value: StatutCommande.EN_ATTENTE,
      label: "En Attente",
      color: "text-yellow-600 bg-yellow-50 border-yellow-200",
    },
    {
      value: StatutCommande.EN_COURS,
      label: "En Cours",
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      value: StatutCommande.TERMINE,
      label: "Terminé",
      color: "text-green-600 bg-green-50 border-green-200",
    },
    {
      value: StatutCommande.ANNULEE,
      label: "Annulé",
      color: "text-red-600 bg-red-50 border-red-200",
    },
  ];

  const getCurrentStatusColor = () => {
    const status = statusOptions.find((s) => s.value === currentStatus);
    return status?.color || "text-gray-600 bg-gray-50 border-gray-200";
  };

  return (
    <select
      value={currentStatus}
      onChange={(e) => onStatusChange(e.target.value as StatutCommande)}
      disabled={disabled}
      className={`px-3 py-2 rounded-lg border font-medium text-sm transition-colors ${getCurrentStatusColor()} ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:opacity-80"
      }`}
    >
      {statusOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default CommandeStatusSelect;
