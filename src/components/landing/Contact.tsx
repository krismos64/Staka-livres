import React, { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    sujet: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulation d'envoi du formulaire avec toast
    alert("Message envoyé avec succès ! Notre équipe vous répondra sous 24h.");
    setFormData({ nom: "", email: "", sujet: "", message: "" });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section id="contact" className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Une question ?{" "}
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Contactez-nous
            </span>
          </h2>
          <p className="text-lg text-gray-600">
            Notre équipe vous répond sous 24h
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-6">
              💬 Parlons de votre projet
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <i className="fas fa-envelope text-blue-600"></i>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Email</h4>
                  <a
                    href="mailto:contact@staka.fr"
                    className="text-blue-600 hover:underline"
                  >
                    contact@staka.fr
                  </a>
                  <p className="text-sm text-gray-500">
                    Réponse garantie sous 24h
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <i className="fas fa-phone text-green-600"></i>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Téléphone</h4>
                  <a
                    href="tel:+33615078152"
                    className="text-green-600 hover:underline"
                  >
                    06 15 07 81 52
                  </a>
                  <p className="text-sm text-gray-500">Lun-Ven 9h-18h</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <i className="fab fa-whatsapp text-green-600"></i>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">WhatsApp</h4>
                  <a
                    href="https://wa.me/33615078152?text=Bonjour,%20j'aimerais%20des%20informations%20sur%20vos%20services%20de%20correction%20de%20manuscrit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline"
                  >
                    06 15 07 81 52
                  </a>
                  <p className="text-sm text-gray-500">
                    Chat direct instantané
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <i className="fas fa-calendar text-purple-600"></i>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Consultation gratuite</h4>
                  <p className="text-gray-600">
                    Échange téléphonique de 30 min
                  </p>
                  <button className="text-purple-600 hover:underline text-sm font-medium">
                    Réserver un créneau →
                  </button>
                </div>
              </div>

              {/* Live chat status */}
              <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-green-800">
                    Expert en ligne
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Un de nos conseillers est disponible pour répondre à vos
                  questions
                </p>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
                  <i className="fas fa-comments mr-2"></i>
                  Démarrer le chat
                </button>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contact-nom"
                    className="block mb-2 font-semibold text-gray-700"
                  >
                    Nom *
                  </label>
                  <input
                    type="text"
                    id="contact-nom"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition"
                    required
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block mb-2 font-semibold text-gray-700"
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition"
                    required
                    placeholder="votre@email.com"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="contact-sujet"
                  className="block mb-2 font-semibold text-gray-700"
                >
                  Sujet
                </label>
                <select
                  id="contact-sujet"
                  name="sujet"
                  value={formData.sujet}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition"
                >
                  <option value="">Choisissez un sujet</option>
                  <option value="devis">Demande de devis</option>
                  <option value="question">Question générale</option>
                  <option value="rdv">Prise de rendez-vous</option>
                  <option value="suivi">Suivi de commande</option>
                  <option value="urgence">Correction urgente</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="contact-message"
                  className="block mb-2 font-semibold text-gray-700"
                >
                  Message *
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition"
                  required
                  placeholder="Décrivez votre projet ou posez votre question..."
                ></textarea>
              </div>

              {/* Rate limiting info */}
              <div className="text-xs text-gray-500">
                <i className="fas fa-info-circle mr-1"></i>
                Limité à 3 messages par heure pour éviter le spam
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-blue-600 transition"
              >
                <i className="fas fa-paper-plane mr-2"></i>
                Envoyer le message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
