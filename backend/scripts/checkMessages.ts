import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkMessages() {
  try {
    console.log("📨 Vérification des messages récents...\n");

    const messages = await prisma.message.findMany({
      select: {
        id: true,
        conversationId: true,
        visitorEmail: true,
        visitorName: true,
        subject: true,
        content: true,
        createdAt: true,
        receiver: {
          select: {
            email: true,
            prenom: true,
            nom: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    if (messages.length === 0) {
      console.log("❌ Aucun message trouvé dans la base de données");
    } else {
      messages.forEach((message, index) => {
        console.log(`${index + 1}. 📧 Message ID: ${message.id}`);
        console.log(`   📮 De: ${message.visitorName} (${message.visitorEmail})`);
        console.log(`   👤 Pour: ${message.receiver?.prenom} ${message.receiver?.nom} (${message.receiver?.email})`);
        console.log(`   📋 Sujet: ${message.subject}`);
        console.log(`   📅 Créé: ${message.createdAt.toLocaleString('fr-FR')}`);
        console.log(`   💬 Conversation: ${message.conversationId}`);
        console.log(`   📝 Contenu: ${message.content.substring(0, 100)}...`);
        console.log("   ---");
      });
    }

    console.log(`\n📊 Total: ${messages.length} message(s) récent(s)`);

  } catch (error) {
    console.error("❌ Erreur lors de la vérification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMessages();