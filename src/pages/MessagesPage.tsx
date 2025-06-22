import React from "react";

// --- Données statiques exemple ---
const conversations = [
  {
    id: 1,
    initials: "SM",
    color: "bg-blue-600",
    name: "Sarah Martin",
    lastMessage: "La correction de votre roman est terminée...",
    project: "L'Écho du Temps",
    time: "14:30",
    unread: true,
  },
  {
    id: 2,
    initials: "MD",
    color: "bg-green-600",
    name: "Marc Dubois",
    lastMessage: "J'ai quelques questions sur votre biographie...",
    project: "Mémoires d'une Vie",
    time: "Hier",
    unread: false,
  },
  {
    id: 3,
    initials: "ES",
    color: "bg-purple-600",
    name: "Équipe Support",
    lastMessage: "Merci pour votre évaluation 5 étoiles !",
    project: "Support général",
    time: "2 jours",
    unread: false,
  },
];

const messages = [
  {
    id: 1,
    from: "SM",
    type: "left",
    text: `Bonjour Marie ! J'ai terminé la correction de votre roman "L'Écho du Temps". Le travail est vraiment excellent !`,
    time: "Aujourd'hui 14:25",
  },
  {
    id: 2,
    from: "SM",
    type: "left",
    text: `J'ai apporté quelques améliorations stylistiques et corrigé les quelques coquilles. Vous pouvez télécharger le fichier final depuis votre espace projet.`,
    time: "Aujourd'hui 14:26",
  },
  {
    id: 3,
    from: "MC",
    type: "right",
    text: `Merci beaucoup Sarah ! Je suis très satisfaite de votre travail. Pouvez-vous me dire quand vous pourrez commencer "Mémoires d'une Vie" ?`,
    time: "Aujourd'hui 14:30",
  },
  {
    id: 4,
    from: "SM",
    type: "left",
    text: `Avec plaisir ! Je peux commencer dès demain matin. Est-ce que vous avez des instructions particulières pour ce projet ?`,
    time: "Aujourd'hui 14:32",
  },
];

function MessagesPage() {
  return (
    <section className="w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Messages</h2>
        <p className="text-gray-600">
          Communiquez avec votre équipe éditoriale
        </p>
      </div>
      <div className="flex gap-8">
        {/* Colonne conversations */}
        <div className="bg-white rounded-2xl border border-gray-100 w-[340px] min-w-[300px] max-w-[380px] flex-shrink-0 flex flex-col overflow-hidden">
          <div className="font-semibold text-gray-900 text-base px-6 pt-6 pb-4">
            Conversations
          </div>
          <div className="flex-1 divide-y divide-gray-50">
            {conversations.map((c, i) => (
              <div
                key={c.id}
                className={`flex items-center px-6 py-4 gap-4 cursor-pointer group transition ${
                  i === 0
                    ? "bg-blue-50 border-l-4 border-blue-600"
                    : "hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold text-base ${c.color}`}
                >
                  {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold text-gray-900 truncate">
                      {c.name}
                    </div>
                    <div className="text-xs text-gray-400 ml-4 flex-shrink-0">
                      {c.time}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {c.lastMessage}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {c.project}
                  </div>
                </div>
                {c.unread && (
                  <span className="w-2 h-2 bg-blue-600 rounded-full ml-2"></span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Colonne messages */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
          {/* Header de la conversation */}
          <div className="flex items-center px-8 pt-6 pb-4 border-b border-gray-50 gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-base">
              SM
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">Sarah Martin</div>
              <div className="text-xs text-gray-500">
                Correctrice senior · En ligne
              </div>
            </div>
            {/* Actions: phone, video, more */}
            <div className="flex items-center gap-4 text-gray-400">
              <button className="hover:text-blue-600 transition">
                <i className="fas fa-phone"></i>
              </button>
              <button className="hover:text-blue-600 transition">
                <i className="fas fa-video"></i>
              </button>
              <button className="hover:text-blue-600 transition">
                <i className="fas fa-ellipsis-h"></i>
              </button>
            </div>
          </div>
          {/* Messages */}
          <div className="flex-1 px-8 py-6 overflow-y-auto flex flex-col gap-5">
            {messages.map((msg) =>
              msg.type === "left" ? (
                <div
                  key={msg.id}
                  className="flex items-start gap-3 max-w-[65%]"
                >
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm flex-shrink-0">
                    SM
                  </div>
                  <div>
                    <div className="bg-gray-100 rounded-2xl px-5 py-3 text-gray-900 text-sm max-w-[360px]">
                      {msg.text}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 ml-1">
                      {msg.time}
                    </div>
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex justify-end">
                  <div className="flex flex-col items-end max-w-[65%] ml-auto">
                    <div className="bg-blue-600 rounded-2xl px-5 py-3 text-white text-sm max-w-[360px]">
                      {msg.text}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 text-right">
                      {msg.time}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
          {/* Input */}
          <div className="border-t border-gray-50 px-8 py-4 flex items-center gap-3 bg-white rounded-b-2xl">
            {/* Icône trombone pièce jointe */}
            <button
              type="button"
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition"
              disabled
              tabIndex={-1}
              aria-label="Joindre un fichier"
            >
              <i className="fas fa-paperclip text-lg"></i>
            </button>
            <input
              type="text"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Tapez votre message…"
              disabled
            />
            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition"
              disabled
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MessagesPage;
