import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkNotifications() {
  try {
    console.log("🔔 Vérification des notifications récentes...\n");

    const notifications = await prisma.notification.findMany({
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        isRead: true,
        createdAt: true,
        userId: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Récupérer les informations des utilisateurs
    const userIds = [...new Set(notifications.map(n => n.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        prenom: true,
        nom: true,
        role: true
      }
    });

    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, any>);

    if (notifications.length === 0) {
      console.log("❌ Aucune notification trouvée dans la base de données");
    } else {
      notifications.forEach((notification, index) => {
        const user = userMap[notification.userId];
        console.log(`${index + 1}. 🔔 Notification ID: ${notification.id}`);
        console.log(`   👤 Pour: ${user?.prenom} ${user?.nom} (${user?.email}) - ${user?.role}`);
        console.log(`   📋 Titre: ${notification.title}`);
        console.log(`   💬 Message: ${notification.message}`);
        console.log(`   📈 Type: ${notification.type}`);
        console.log(`   👁️ Lu: ${notification.isRead ? 'Oui' : 'Non'}`);
        console.log(`   📅 Créé: ${notification.createdAt.toLocaleString('fr-FR')}`);
        console.log("   ---");
      });
    }

    console.log(`\n📊 Total: ${notifications.length} notification(s) récente(s)`);

  } catch (error) {
    console.error("❌ Erreur lors de la vérification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNotifications();