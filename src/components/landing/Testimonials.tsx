import React from "react";

export default function Testimonials() {
  return (
    <section
      id="temoignages"
      className="py-16 bg-gradient-to-br from-gray-50 to-blue-50"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ils nous font{" "}
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              confiance
            </span>
          </h2>
          <p className="text-lg text-gray-600">
            Plus de 1500 auteurs nous ont fait confiance pour leurs projets
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Testimonial 1 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 relative">
            <div className="absolute -top-4 left-6">
              <div className="flex text-yellow-400">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-6 mt-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">MC</span>
              </div>
              <div>
                <h4 className="font-bold">Marie Castello</h4>
                <p className="text-sm text-gray-500">Auteure de romans</p>
              </div>
            </div>
            <p className="text-gray-700 italic mb-4">
              "Une équipe exceptionnelle ! Ma correction était parfaite et la
              mise en page magnifique. Mon livre se vend très bien sur Amazon
              grâce à leur accompagnement."
            </p>
            <div className="text-sm text-gray-500">Romans - 280 pages</div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 relative">
            <div className="absolute -top-4 left-6">
              <div className="flex text-yellow-400">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-6 mt-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">PD</span>
              </div>
              <div>
                <h4 className="font-bold">Pierre Dubois</h4>
                <p className="text-sm text-gray-500">Auteur d'essais</p>
              </div>
            </div>
            <p className="text-gray-700 italic mb-4">
              "Professionnel, rapide et d'une qualité irréprochable. L'équipe
              Staka a transformé mon manuscrit brut en un livre digne d'une
              grande maison d'édition."
            </p>
            <div className="text-sm text-gray-500">Essai - 180 pages</div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 relative">
            <div className="absolute -top-4 left-6">
              <div className="flex text-yellow-400">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-6 mt-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-600">SL</span>
              </div>
              <div>
                <h4 className="font-bold">Sophie Laurent</h4>
                <p className="text-sm text-gray-500">Première publication</p>
              </div>
            </div>
            <p className="text-gray-700 italic mb-4">
              "En tant que débutante, j'avais peur de me lancer. L'équipe m'a
              accompagnée de A à Z avec patience et bienveillance. Mon rêve est
              devenu réalité !"
            </p>
            <div className="text-sm text-gray-500">Biographie - 220 pages</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-3xl font-bold text-blue-600 mb-2">4.9/5</div>
            <div className="text-sm text-gray-600">Note moyenne</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-3xl font-bold text-green-600 mb-2">127</div>
            <div className="text-sm text-gray-600">Avis clients</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-3xl font-bold text-purple-600 mb-2">98%</div>
            <div className="text-sm text-gray-600">Clients satisfaits</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-3xl font-bold text-orange-600 mb-2">1500+</div>
            <div className="text-sm text-gray-600">Livres publiés</div>
          </div>
        </div>
      </div>
    </section>
  );
}
