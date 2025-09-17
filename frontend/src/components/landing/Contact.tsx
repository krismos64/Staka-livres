import React, { useState } from "react";
import { debugLog, errorLog } from "../../utils/debug";

interface ContactProps {
  onChatClick?: () => void;
}

export default function Contact({ onChatClick }: ContactProps) {
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    sujet: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/public/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: result.message || 'Votre message a bien été envoyé à notre équipe.'
        });
        setFormData({ nom: "", email: "", telephone: "", sujet: "", message: "" });
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.details || result.error || 'Une erreur est survenue lors de l\'envoi.'
        });
      }
    } catch (error) {
      errorLog('Erreur lors de l\'envoi du formulaire:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Erreur de connexion. Veuillez vérifier votre connexion internet et réessayer.'
      });
    } finally {
      setIsSubmitting(false);
    }
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
          <div className="flex justify-center">
            <p className="text-lg text-gray-600 text-center">
              Notre équipe vous répond sous 24h
            </p>
          </div>
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
                <button
                  onClick={onChatClick}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
                >
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
                  htmlFor="contact-telephone"
                  className="block mb-2 font-semibold text-gray-700"
                >
                  Téléphone *
                </label>
                <input
                  type="tel"
                  id="contact-telephone"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition"
                  required
                  placeholder="06 12 34 56 78"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-sujet"
                  className="block mb-2 font-semibold text-gray-700"
                >
                  Sujet *
                </label>
                <input
                  type="text"
                  id="contact-sujet"
                  name="sujet"
                  value={formData.sujet}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition"
                  required
                  placeholder="Votre sujet"
                />
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
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition resize-none"
                  required
                  placeholder="Décrivez votre projet..."
                ></textarea>
              </div>
              
              {/* Message de statut */}
              {submitStatus.type && (
                <div
                  className={`p-4 rounded-xl border ${
                    submitStatus.type === 'success'
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <i
                      className={`fas ${
                        submitStatus.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'
                      }`}
                    ></i>
                    <span className="font-medium">{submitStatus.message}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 transform hover:scale-105'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Envoi en cours...</span>
                  </div>
                ) : (
                  'Envoyer le message'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
