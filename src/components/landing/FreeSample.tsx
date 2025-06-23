import React, { useState } from "react";

export default function FreeSample() {
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    genre: "",
    description: "",
    fichier: null as File | null,
  });

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation basique
    if (!formData.nom || !formData.email) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Simulation d'envoi
    setIsSubmitted(true);
    setTimeout(() => {
      alert(
        "🎉 Votre demande a été envoyée avec succès ! Nous vous recontacterons sous 48h avec vos 10 pages corrigées gratuitement."
      );
      setFormData({
        nom: "",
        email: "",
        telephone: "",
        genre: "",
        description: "",
        fichier: null,
      });
      setIsSubmitted(false);
    }, 1000);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validation taille fichier (5 Mo max)
      if (file.size > 5 * 1024 * 1024) {
        alert("Le fichier doit faire moins de 5 Mo");
        e.target.value = "";
        return;
      }

      setFormData({ ...formData, fichier: file });

      // Simulation progress upload
      setIsUploading(true);
      setUploadProgress(0);

      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            return 100;
          }
          return prev + Math.random() * 30;
        });
      }, 200);
    }
  };

  const triggerFileInput = () => {
    document.getElementById("fichier")?.click();
  };

  return (
    <section
      id="commande-gratuite"
      className="py-16 bg-gradient-to-r from-green-50 to-blue-50"
    >
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Testez notre expertise
            </span>{" "}
            gratuitement
          </h2>
          <p className="text-lg text-gray-600">
            Découvrez la qualité de notre travail avec 10 pages corrigées sans
            engagement
          </p>
          <div className="flex justify-center items-center gap-6 mt-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <i className="fas fa-clock text-blue-500"></i>
              <span>Réponse sous 48h</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-shield-alt text-green-500"></i>
              <span>Sans engagement</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-lock text-purple-500"></i>
              <span>100% confidentiel</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <form className="grid md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
            {/* CSRF Token */}
            <input
              type="hidden"
              name="csrf_token"
              value="csrf_token_placeholder"
            />

            <div>
              <label
                htmlFor="nom-gratuit"
                className="block mb-2 font-semibold text-gray-700"
              >
                Nom complet *
              </label>
              <input
                type="text"
                id="nom-gratuit"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-blue-500 focus:outline-none transition"
                required
                placeholder="Votre nom et prénom"
              />
              <div className="invalid-feedback text-red-500 text-sm mt-1 hidden">
                Veuillez entrer votre nom complet
              </div>
            </div>
            <div>
              <label
                htmlFor="email-gratuit"
                className="block mb-2 font-semibold text-gray-700"
              >
                Adresse email *
              </label>
              <input
                type="email"
                id="email-gratuit"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-blue-500 focus:outline-none transition"
                required
                placeholder="votre@email.com"
              />
              <div className="invalid-feedback text-red-500 text-sm mt-1 hidden">
                Veuillez entrer une adresse email valide
              </div>
            </div>
            <div>
              <label
                htmlFor="telephone"
                className="block mb-2 font-semibold text-gray-700"
              >
                Téléphone
              </label>
              <input
                type="tel"
                id="telephone"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-blue-500 focus:outline-none transition"
                placeholder="06 12 34 56 78"
              />
            </div>
            <div>
              <label
                htmlFor="genre"
                className="block mb-2 font-semibold text-gray-700"
              >
                Genre littéraire
              </label>
              <select
                id="genre"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-blue-500 focus:outline-none transition"
              >
                <option value="">Sélectionnez un genre</option>
                <option value="roman">Roman</option>
                <option value="nouvelle">Nouvelle</option>
                <option value="essai">Essai</option>
                <option value="biographie">Biographie</option>
                <option value="poesie">Poésie</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="block mb-2 font-semibold text-gray-700"
              >
                Décrivez brièvement votre projet
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-blue-500 focus:outline-none transition"
                placeholder="Parlez-nous de votre manuscrit, du nombre de pages, de vos objectifs..."
              ></textarea>
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="fichier"
                className="block mb-2 font-semibold text-gray-700"
              >
                Joindre vos 10 premières pages
              </label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition cursor-pointer"
                onClick={triggerFileInput}
              >
                <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-4"></i>
                <p className="text-gray-600 mb-2">
                  {formData.fichier
                    ? formData.fichier.name
                    : "Glissez votre fichier ici ou cliquez pour parcourir"}
                </p>
                <p className="text-sm text-gray-500">
                  Formats acceptés : .doc, .docx, .pdf (Max 5 Mo)
                </p>
                <input
                  type="file"
                  id="fichier"
                  name="fichier"
                  className="hidden"
                  accept=".doc,.docx,.pdf"
                  onChange={handleFileChange}
                />
                {isUploading && (
                  <div className="upload-progress mt-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      Upload en cours...
                    </div>
                  </div>
                )}
              </div>
              <div className="invalid-feedback text-red-500 text-sm mt-1 hidden">
                Le fichier doit faire moins de 5 Mo
              </div>
            </div>
            <div className="md:col-span-2 text-center">
              <button
                type="submit"
                disabled={isSubmitted}
                className="btn-primary text-white px-12 py-4 rounded-xl font-semibold text-lg inline-flex items-center gap-3"
              >
                <i className="fas fa-paper-plane"></i>
                {isSubmitted
                  ? "Envoi en cours..."
                  : "Recevoir ma correction gratuite"}
              </button>
              <p className="text-sm text-gray-500 mt-4">
                Réponse sous 48h • Sans engagement • Confidentiel
              </p>
            </div>
          </form>
        </div>

        {/* Success stories */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-bold mb-6">
            🎉 Ils ont commencé par 10 pages gratuites...
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-4xl mb-3">📚</div>
              <div className="font-semibold">Marie C.</div>
              <div className="text-sm text-gray-600">
                Roman 280 pages → Bestseller Amazon
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-4xl mb-3">✨</div>
              <div className="font-semibold">Pierre D.</div>
              <div className="text-sm text-gray-600">
                Essai 180 pages → Publié en librairie
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-4xl mb-3">🏆</div>
              <div className="font-semibold">Sophie L.</div>
              <div className="text-sm text-gray-600">
                Premier livre → Prix littéraire régional
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
