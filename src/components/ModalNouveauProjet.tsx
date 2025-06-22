import React, { useState } from "react";

interface ModalNouveauProjetProps {
  open: boolean;
  onClose: () => void;
}

export default function ModalNouveauProjet({
  open,
  onClose,
}: ModalNouveauProjetProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Correction de manuscrit");
  const [desc, setDesc] = useState("");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={onClose}
          aria-label="Fermer"
        >
          <i className="fas fa-times"></i>
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Nouveau projet
        </h2>
        <p className="text-gray-600 mb-6">
          Décrivez votre projet pour obtenir une correction sur-mesure.
        </p>
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            // ... envoie à ton backend ici ...
            onClose();
          }}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre du projet
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Ex : Mon roman de science-fiction"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de projet
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option>Correction de manuscrit</option>
              <option>Relecture simple</option>
              <option>Lettre d’intention</option>
              <option>Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
              rows={4}
              placeholder="Décrivez ici votre projet, vos attentes, vos besoins…"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold rounded-xl text-base py-3 hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <i className="fas fa-paper-plane"></i>
            Créer le projet
          </button>
        </form>
      </div>
    </div>
  );
}
