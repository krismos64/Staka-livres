-- MySQL dump 10.13  Distrib 8.4.5, for Linux (aarch64)
--
-- Host: localhost    Database: stakalivres
-- ------------------------------------------------------
-- Server version	8.4.5

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('026b7917-94b5-48cf-b85c-7987f8f440db','4ac73d9212b781eeca221c30e1956e588e4bd20aa90e25cb2a0f8704ae4324e5','2025-07-24 12:50:58.472','20250709133118_simplify_messaging_for_visitors',NULL,NULL,'2025-07-24 12:50:58.295',1),('0e00266a-674c-4ec6-9d93-df0e797317ec','f21162bc329063e3a2510bef63a8b47eda31c26d10a83c07775a311688e0d8d9','2025-07-24 16:00:07.141','20250724160007_add_user_bio',NULL,NULL,'2025-07-24 16:00:07.031',1),('1536c0e6-3114-4b5a-a846-0fdb73ab4ae5','6388de34464dc280d8ffb7d1a2ca3452eb257decf01bba993e8f8822f411ee77','2025-07-24 12:50:57.276','20250624201851_add_stripe_fields',NULL,NULL,'2025-07-24 12:50:57.223',1),('1b306b1f-1361-4eac-89d9-9998f4caf2bd','b45c4bbbc70d3bcca55aa965e404466eec2ce88f77561ab776fbdff11366af22','2025-07-24 12:50:58.165','20250627085927_add_complete_data_model',NULL,NULL,'2025-07-24 12:50:57.279',1),('1e4e45bc-e4e1-47cc-abde-e30107bf8b9a','1554678ebadbe8b85335399a31af5a8310bc82c198b55f88097b8e35461ae7db','2025-07-24 12:50:58.294','20250703134452_add_tarif_model',NULL,NULL,'2025-07-24 12:50:58.280',1),('268a9f49-f607-47f5-b39d-c1b954a30a0c','67e7da03d9af80722c64482a7390d35c94bceb4ad2fedde7ab46dec3edad316d','2025-07-24 12:50:58.279','20250703100651_add_faq_model',NULL,NULL,'2025-07-24 12:50:58.258',1),('8ada628b-70e6-4903-b70b-4fd3d9df10c3','607948e86b0e18f7848bd675b17f6260c29599d6a4af319f5fc1dbcb7bfe5776','2025-07-24 12:50:57.220','20250624124656_add_user_authentication',NULL,NULL,'2025-07-24 12:50:57.199',1),('966c276a-1af4-4806-8fe7-45b00e0d7a04','e9b08e703b41f7f3b46c2a926b953a0f5f1249f03eb2443d4c0dc69b30a18edb','2025-07-24 12:50:58.703','20250714203422_add_user_preferences',NULL,NULL,'2025-07-24 12:50:58.654',1),('9bb896f6-ebca-4c26-99af-ab5dbb536dff','4cda2310471dbdd72825db33af9b50b344a660cbde392f9b337e57170234c12f','2025-07-28 15:38:27.171','20250728171600_add_pending_commande',NULL,NULL,'2025-07-28 15:38:27.099',1),('a7a5d8dd-6bf7-44b0-b3a4-04b8de92dfa0','f319ce5556c8beafdcc2a755713bcf6857a95aaae15f03a0502a0f3a03bcb284','2025-07-24 12:50:58.653','20250714131722_add_password_reset',NULL,NULL,'2025-07-24 12:50:58.591',1),('ae3c62dc-80b8-40f8-8df5-e3537e0e226b','a62cdc3cdcaa40b5c167ef2a795d0d170ce8e4965fa35c028d9d902352566abc','2025-07-24 12:50:58.590','20250711150638_add_stripe_fields_to_tarifs',NULL,NULL,'2025-07-24 12:50:58.524',1),('b2113a89-b640-48f1-8385-8d3707aa9f7f','4f0e31b408792690273c7fca13798da7f178afde47b1b22d716d13911816a018','2025-07-24 12:50:58.844','99999999999999_add_audit_log',NULL,NULL,'2025-07-24 12:50:58.704',1),('b43b4fda-e4ef-4337-9730-bdddaa5d9e16','f04cad1fa72fd6d26e91a3d2b47f1001bf40ffe19c6346fe355af627e15fbb12','2025-07-24 12:50:58.257','20250630160952_add_support_request_to_messages',NULL,NULL,'2025-07-24 12:50:58.167',1),('c57916f8-939f-4366-9d29-889524958cbc','bfa5c69e83af860bcc2fc64bbec869506ed7c5f59095d4f1f2c15d1aa4d491c0','2025-07-24 12:50:58.523','20250711040843_add_display_role',NULL,NULL,'2025-07-24 12:50:58.503',1),('c7d7653a-2637-44db-983f-69ae334f472d','fcc818d45a537ee1b611d7cc29153ca794faf8988feccbb09da691a46e24ac7e','2025-07-24 12:50:58.502','20250710201758_add_display_name_fields',NULL,NULL,'2025-07-24 12:50:58.474',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `adminEmail` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `targetType` enum('user','command','invoice','payment','file','auth','system') COLLATE utf8mb4_unicode_ci NOT NULL,
  `targetId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `ipAddress` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userAgent` text COLLATE utf8mb4_unicode_ci,
  `severity` enum('LOW','MEDIUM','HIGH','CRITICAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MEDIUM',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `audit_logs_adminEmail_idx` (`adminEmail`),
  KEY `audit_logs_action_idx` (`action`),
  KEY `audit_logs_targetType_idx` (`targetType`),
  KEY `audit_logs_severity_idx` (`severity`),
  KEY `audit_logs_timestamp_idx` (`timestamp`),
  KEY `audit_logs_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES ('008414ea-2b4c-460c-a2cf-4e1a125bbb76','2025-07-25 10:30:34.482','admin@staka-editions.com','AUDIT_STATS_ACCESSED','system',NULL,'{\"action\":\"VIEW_AUDIT_STATS\"}','172.18.0.4','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','MEDIUM','2025-07-25 10:30:34.484'),('0617a667-229e-4e30-b600-c15f8014cb00','2025-07-28 10:34:17.073','contact@staka.fr','AUDIT_LOGS_ACCESSED','system',NULL,'{\"action\":\"LIST_AUDIT_LOGS\",\"filters\":{\"page\":\"1\",\"limit\":\"50\",\"sortBy\":\"timestamp\",\"sortOrder\":\"desc\"}}','172.19.0.4','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','HIGH','2025-07-28 10:34:17.078'),('06a002ee-bbc4-419f-8227-2928d48eacbf','2025-07-28 05:29:35.049','admin@staka-editions.com','AUDIT_LOGS_ACCESSED','system',NULL,'{\"action\":\"LIST_AUDIT_LOGS\",\"filters\":{\"page\":\"1\",\"limit\":\"50\",\"sortBy\":\"timestamp\",\"sortOrder\":\"desc\"}}','172.19.0.4','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','HIGH','2025-07-28 05:29:35.058'),('073d337a-8b24-410b-8f38-57700a406620','2025-07-25 10:30:34.479','admin@staka-editions.com','AUDIT_LOGS_ACCESSED','system',NULL,'{\"action\":\"LIST_AUDIT_LOGS\",\"filters\":{\"page\":\"1\",\"limit\":\"50\",\"sortBy\":\"timestamp\",\"sortOrder\":\"desc\"}}','172.18.0.4','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','HIGH','2025-07-25 10:30:34.483'),('1a4e7f8b-1e0a-4ce0-b595-741d39c1d6bd','2025-07-28 11:03:05.917','test.bienvenue@example.com','USER_UPDATED','user','ef3a8d24-47b3-4920-ab14-7f484ac2c12a','{\"fields_updated\":[\"prenom\",\"nom\",\"telephone\",\"adresse\",\"bio\"],\"method\":\"profile_update\"}','192.168.65.1','curl/8.7.1','LOW','2025-07-28 11:03:05.929'),('40ecac02-0b9a-43dc-81e0-a977b0a519d7','2025-07-28 05:36:08.033','admin@staka-editions.com','AUDIT_STATS_ACCESSED','system',NULL,'{\"action\":\"VIEW_AUDIT_STATS\"}','172.19.0.4','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','MEDIUM','2025-07-28 05:36:08.040'),('519a997d-7c63-4c91-ab3b-e2241887805c','2025-07-25 10:35:31.084','admin@staka-editions.com','AUDIT_STATS_ACCESSED','system',NULL,'{\"action\":\"VIEW_AUDIT_STATS\"}','172.18.0.4','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','MEDIUM','2025-07-25 10:35:31.086'),('5af96bc0-dad0-4d38-b498-905f7a53d042','2025-07-25 10:16:03.642','admin@staka-editions.com','AUDIT_STATS_ACCESSED','system',NULL,'{\"action\":\"VIEW_AUDIT_STATS\"}','172.18.0.4','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','MEDIUM','2025-07-25 10:16:03.667'),('5e34e72e-8979-40a1-8d07-754a833c9410','2025-07-28 05:36:08.029','admin@staka-editions.com','AUDIT_LOGS_ACCESSED','system',NULL,'{\"action\":\"LIST_AUDIT_LOGS\",\"filters\":{\"page\":\"1\",\"limit\":\"50\",\"sortBy\":\"timestamp\",\"sortOrder\":\"desc\"}}','172.19.0.4','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','HIGH','2025-07-28 05:36:08.040'),('6b0c4f56-fcd7-44a8-9198-03a365e19071','2025-07-28 05:29:35.053','admin@staka-editions.com','AUDIT_STATS_ACCESSED','system',NULL,'{\"action\":\"VIEW_AUDIT_STATS\"}','172.19.0.4','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','MEDIUM','2025-07-28 05:29:35.058'),('aefb9810-9b51-4cef-8c62-40b438203963','2025-07-28 10:52:10.915','c.mostefaoui@yahoo.fr','USER_UPDATED','user','f637a04a-be4b-4459-9f9a-04a6770d248b','{\"fields_updated\":[\"prenom\",\"nom\",\"telephone\",\"adresse\",\"bio\"],\"method\":\"profile_update\"}','172.19.0.4','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','LOW','2025-07-28 10:52:10.923'),('ba2e3c26-4f65-43ff-8977-f2421fe53f39','2025-07-25 10:35:31.086','admin@staka-editions.com','AUDIT_LOGS_ACCESSED','system',NULL,'{\"action\":\"LIST_AUDIT_LOGS\",\"filters\":{\"page\":\"1\",\"limit\":\"50\",\"sortBy\":\"timestamp\",\"sortOrder\":\"desc\"}}','172.18.0.4','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','HIGH','2025-07-25 10:35:31.087'),('c4912ac9-e359-41c5-9e95-5e25eae60e23','2025-07-25 10:16:03.651','admin@staka-editions.com','AUDIT_LOGS_ACCESSED','system',NULL,'{\"action\":\"LIST_AUDIT_LOGS\",\"filters\":{\"page\":\"1\",\"limit\":\"50\",\"sortBy\":\"timestamp\",\"sortOrder\":\"desc\"}}','172.18.0.4','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','HIGH','2025-07-25 10:16:03.667'),('d1fe71fb-d371-4b8f-8722-a5379432f9a7','2025-07-28 10:31:48.726','admin@staka-editions.com','AUDIT_STATS_ACCESSED','system',NULL,'{\"action\":\"VIEW_AUDIT_STATS\"}','172.19.0.4','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','MEDIUM','2025-07-28 10:31:48.808'),('e99dfda7-ef16-45ca-9c21-159777b75adc','2025-07-28 10:34:17.063','contact@staka.fr','AUDIT_STATS_ACCESSED','system',NULL,'{\"action\":\"VIEW_AUDIT_STATS\"}','172.19.0.4','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','MEDIUM','2025-07-28 10:34:17.072'),('eef72534-cf59-4211-955b-556a7c35fbe3','2025-07-28 10:31:48.794','admin@staka-editions.com','AUDIT_LOGS_ACCESSED','system',NULL,'{\"action\":\"LIST_AUDIT_LOGS\",\"filters\":{\"page\":\"1\",\"limit\":\"50\",\"sortBy\":\"timestamp\",\"sortOrder\":\"desc\"}}','172.19.0.4','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','HIGH','2025-07-28 10:31:48.810');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commandes`
--

DROP TABLE IF EXISTS `commandes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commandes` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `titre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `fichierUrl` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut` enum('EN_ATTENTE','EN_ATTENTE_VERIFICATION','EN_ATTENTE_CONSULTATION','ESTIMATION_ENVOYEE','PAYEE','EN_COURS','TERMINE','ANNULEE','SUSPENDUE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EN_ATTENTE',
  `noteClient` text COLLATE utf8mb4_unicode_ci,
  `noteCorrecteur` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `paymentStatus` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripeSessionId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` int DEFAULT NULL,
  `dateEcheance` datetime(3) DEFAULT NULL,
  `dateFinition` datetime(3) DEFAULT NULL,
  `priorite` enum('FAIBLE','NORMALE','HAUTE','URGENTE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NORMALE',
  `packType` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pagesDeclarees` int DEFAULT NULL,
  `pagesVerifiees` int DEFAULT NULL,
  `prixEstime` int DEFAULT NULL,
  `prixFinal` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `commandes_userId_idx` (`userId`),
  KEY `commandes_statut_idx` (`statut`),
  KEY `commandes_priorite_idx` (`priorite`),
  KEY `commandes_createdAt_idx` (`createdAt`),
  CONSTRAINT `commandes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commandes`
--

LOCK TABLES `commandes` WRITE;
/*!40000 ALTER TABLE `commandes` DISABLE KEYS */;
INSERT INTO `commandes` VALUES ('7ce67e3d-645b-4caa-80d1-65168b6256f7','4ce9ce71-c022-44d2-ba01-aa1cf79e1b3d','Correction Standard','Correction orthographique, grammaticale et typographique de votre manuscrit',NULL,'PAYEE',NULL,NULL,'2025-07-29 09:08:41.888','2025-07-29 09:08:41.888','paid','cs_test_a1WxpopjcUmHDWx7EV7csUFsV6O48TsduEOWCztw7wdIM3anfXqe4M45II',48000,NULL,NULL,'NORMALE','6b7cb642-0d8d-4ed8-97fb-4e25f1044f05',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `commandes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faqs`
--

DROP TABLE IF EXISTS `faqs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faqs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `question` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `answer` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `ordre` int NOT NULL DEFAULT '0',
  `visible` tinyint(1) NOT NULL DEFAULT '1',
  `categorie` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `faqs_visible_idx` (`visible`),
  KEY `faqs_ordre_idx` (`ordre`),
  KEY `faqs_categorie_idx` (`categorie`),
  KEY `faqs_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faqs`
--

LOCK TABLES `faqs` WRITE;
/*!40000 ALTER TABLE `faqs` DISABLE KEYS */;
INSERT INTO `faqs` VALUES ('1a6e20c5-2237-4803-9a73-a6646d812c7d','Puis-je parler à un conseiller avant de commander ?','Bien sûr ! Contactez-nous via le formulaire, par email ou WhatsApp pour organiser un échange téléphonique gratuit avec un membre de notre équipe éditoriale. Nous répondons à toutes vos questions et vous conseillons le pack le plus adapté.',NULL,6,1,'Général','2025-07-28 10:33:13.245','2025-07-28 10:33:13.245'),('5de54ea3-837f-4dd9-ad8b-990174494007','Mes données sont-elles protégées ?','Vos manuscrits et données personnelles sont protégés selon le RGPD. Nous signons un accord de confidentialité et ne partageons jamais vos contenus. Vos fichiers sont stockés de manière sécurisée et supprimés après le projet.',NULL,5,1,'Général','2025-07-28 10:33:13.239','2025-07-28 10:33:13.239'),('7406a9a4-16e0-407c-a4bd-9344d136148e','Quels sont vos délais de livraison ?','Le délai moyen est de 7 à 15 jours selon la longueur du manuscrit et le pack choisi. Pour le Pack Intégral, comptez 15 jours pour un manuscrit de 200 pages. Une estimation précise vous est donnée dès réception de votre fichier.','Délais par service : Correction seule : 7-10 jours • Design + mise en page : 5-7 jours • Pack complet : 10-15 jours • Urgence (48h) : +50% du tarif',2,1,'Délais','2025-07-28 10:33:13.208','2025-07-28 10:33:13.208'),('75610879-e04d-44ac-bcb5-2fb891db06fd','Comment fonctionne la tarification du Pack Intégral ?','Le Pack Intégral suit notre tarification dégressive : 10 premières pages gratuites, puis 2€ par page jusqu\'à 300 pages, et 1€ par page au-delà. Si votre livre fait 150 pages, le total sera de 280€ (10 gratuites + 140 × 2€).','Exemple concret : 100 pages : 180€ (90 pages payantes) • 200 pages : 380€ (190 pages payantes) • 400 pages : 780€ (290 + 100 pages payantes)',3,1,'Tarifs','2025-07-28 10:33:13.220','2025-07-28 10:33:13.220'),('91422782-ef70-4148-8ec4-02e266de3a6e','FAQ cachée pour tests admin','Cette FAQ n\'est pas visible publiquement et sert uniquement aux tests administrateurs.',NULL,8,0,'Test','2025-07-28 10:33:13.258','2025-07-28 10:33:13.258'),('97d12530-8dac-49c2-8be5-af62ea0ae048','Puis-je demander des modifications après livraison ?','Oui, absolument ! Nous offrons des modifications illimitées jusqu\'à votre entière satisfaction. C\'est notre garantie \"Satisfait ou corrigé\". Vous pouvez demander autant de retouches que nécessaire sans frais supplémentaires.',NULL,4,1,'Correction','2025-07-28 10:33:13.231','2025-07-28 10:33:13.231'),('97d1637a-f498-4289-b21d-ca9bd6fec263','Quels types de manuscrits acceptez-vous ?','Nous travaillons avec tous les genres littéraires : romans, nouvelles, essais, biographies, mémoires, poésie, guides pratiques, etc. Nous acceptons les fichiers Word (.doc, .docx) et PDF dans toutes les langues avec caractères latins.',NULL,1,1,'Général','2025-07-28 10:33:13.192','2025-07-28 10:33:13.192'),('c6bf8766-f291-4ed2-8cb6-6ad42a6908a7','Quelle est la différence entre correction et relecture ?','La correction traite l\'orthographe, la grammaire, la conjugaison et la syntaxe. La relecture va plus loin avec l\'amélioration du style, de la cohérence narrative et de la fluidité. Notre Pack Intégral combine les deux pour un résultat optimal.',NULL,7,1,'Correction','2025-07-28 10:33:13.251','2025-07-28 10:33:13.251');
/*!40000 ALTER TABLE `faqs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `files`
--

DROP TABLE IF EXISTS `files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `files` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `storedName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mimeType` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` int NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('DOCUMENT','IMAGE','AUDIO','VIDEO','ARCHIVE','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DOCUMENT',
  `uploadedById` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `commandeId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `isPublic` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `files_uploadedById_idx` (`uploadedById`),
  KEY `files_commandeId_idx` (`commandeId`),
  KEY `files_type_idx` (`type`),
  KEY `files_createdAt_idx` (`createdAt`),
  CONSTRAINT `files_commandeId_fkey` FOREIGN KEY (`commandeId`) REFERENCES `commandes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `files_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `files`
--

LOCK TABLES `files` WRITE;
/*!40000 ALTER TABLE `files` DISABLE KEYS */;
INSERT INTO `files` VALUES ('3313e1cd-cd2b-4183-a718-3242ac6866a5','QCM_Depistage_Correcteur_Complet (1).docx','1d9fc8d6-e0a8-411c-a89f-b92c43291a40-1753714443174.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',39564,'/uploads/messages/1d9fc8d6-e0a8-411c-a89f-b92c43291a40-1753714443174.docx','DOCUMENT','fb1d4b5f-7edc-4742-bcbc-4934277cfe39',NULL,NULL,0,'2025-07-28 14:54:03.208','2025-07-28 14:54:03.208'),('f23ffb01-6e94-4ca7-8c9b-315ed6d81283','QCM_Depistage_Correcteur.docx','QCM_Depistage_Correcteur_1753780089503-721124774.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',37133,'/uploads/orders/QCM_Depistage_Correcteur_1753780089503-721124774.docx','DOCUMENT','4ce9ce71-c022-44d2-ba01-aa1cf79e1b3d','7ce67e3d-645b-4caa-80d1-65168b6256f7',NULL,0,'2025-07-29 09:08:11.037','2025-07-29 09:08:43.393');
/*!40000 ALTER TABLE `files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `commandeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` int NOT NULL,
  `taxAmount` int NOT NULL DEFAULT '0',
  `pdfUrl` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('GENERATED','SENT','PAID','OVERDUE','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GENERATED',
  `issuedAt` datetime(3) DEFAULT NULL,
  `dueAt` datetime(3) DEFAULT NULL,
  `paidAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoices_number_key` (`number`),
  KEY `invoices_commandeId_idx` (`commandeId`),
  KEY `invoices_status_idx` (`status`),
  KEY `invoices_number_idx` (`number`),
  KEY `invoices_createdAt_idx` (`createdAt`),
  CONSTRAINT `invoices_commandeId_fkey` FOREIGN KEY (`commandeId`) REFERENCES `commandes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES ('a0b8d714-c69f-4c62-a542-b9d5db14b2a0','7ce67e3d-645b-4caa-80d1-65168b6256f7','FACT-2025-123156',48000,0,'/uploads/invoices/INV-8B6256F7-1753780123152.pdf','GENERATED','2025-07-29 09:08:43.156',NULL,NULL,'2025-07-29 09:08:43.202','2025-07-29 09:08:43.202');
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message_attachments`
--

DROP TABLE IF EXISTS `message_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_attachments` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `messageId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `message_attachments_messageId_fileId_key` (`messageId`,`fileId`),
  KEY `message_attachments_messageId_idx` (`messageId`),
  KEY `message_attachments_fileId_idx` (`fileId`),
  CONSTRAINT `message_attachments_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `files` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `message_attachments_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `messages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_attachments`
--

LOCK TABLES `message_attachments` WRITE;
/*!40000 ALTER TABLE `message_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `message_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `senderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receiverId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('USER_MESSAGE','SYSTEM_MESSAGE','NOTIFICATION','SUPPORT_MESSAGE','ADMIN_MESSAGE','CONSULTATION_REQUEST') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER_MESSAGE',
  `statut` enum('BROUILLON','ENVOYE','DELIVRE','LU','ARCHIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ENVOYE',
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `isArchived` tinyint(1) NOT NULL DEFAULT '0',
  `isPinned` tinyint(1) NOT NULL DEFAULT '0',
  `parentId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `conversationId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `visitorEmail` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visitorName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deletedByAdmin` tinyint(1) NOT NULL DEFAULT '0',
  `displayFirstName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `displayLastName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `displayRole` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isFromVisitor` tinyint(1) NOT NULL DEFAULT '0',
  `metadata` json DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `messages_senderId_idx` (`senderId`),
  KEY `messages_receiverId_idx` (`receiverId`),
  KEY `messages_conversationId_idx` (`conversationId`),
  KEY `messages_visitorEmail_idx` (`visitorEmail`),
  KEY `messages_parentId_fkey` (`parentId`),
  CONSTRAINT `messages_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `messages` (`id`),
  CONSTRAINT `messages_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES ('7b2eecc1-39a0-4c7a-a0cb-458c421577db',NULL,'4ce9ce71-c022-44d2-ba01-aa1cf79e1b3d','🎉 Bienvenue chez Staka Livres !','Bonjour Chris,\n\n🎉 **Félicitations !** Votre paiement a été confirmé avec succès et votre projet de correction \"Correction Standard\" est maintenant en cours de traitement.\n\n## ✅ Ce qui vient d\'être fait :\n- ✅ Votre paiement a été validé\n- ✅ Votre compte client a été créé\n- ✅ Votre projet a été assigné à notre équipe de correcteurs professionnels\n- ✅ Votre facture a été générée et envoyée par email\n\n## 📊 Suivez votre projet :\nDepuis votre espace client, vous pouvez maintenant :\n- 📋 Consulter le statut de votre correction en temps réel\n- 💬 Échanger directement avec nos correcteurs\n- 📄 Télécharger vos documents une fois la correction terminée\n- 🧾 Accéder à vos factures et historique\n\n## 🚀 Prochaines étapes :\nNotre équipe va maintenant :\n1. **Analyser votre document** et définir la stratégie de correction\n2. **Assigner un correcteur spécialisé** dans votre domaine\n3. **Commencer la correction** selon nos standards de qualité\n4. **Vous tenir informé** de l\'avancement via cette messagerie\n\n## ❓ Questions ou besoins spécifiques ?\nN\'hésitez pas à nous écrire directement dans cette conversation. Notre équipe support vous répondra dans les plus brefs délais.\n\n**Merci de nous faire confiance pour votre projet !**\n\nL\'équipe Staka Livres 📚','SYSTEM_MESSAGE','ENVOYE',1,0,0,NULL,'2025-07-29 09:08:43.358','2025-07-29 09:10:59.981','703dff1f-4a43-49b3-8776-0c5e84049f95',NULL,NULL,0,'Équipe','Staka Livres','Support',0,'\"{\\\"isWelcomeMessage\\\":true,\\\"commandeId\\\":\\\"7ce67e3d-645b-4caa-80d1-65168b6256f7\\\",\\\"welcomeType\\\":\\\"post_payment\\\",\\\"createdBySystem\\\":true}\"',NULL),('7e54d9d1-a3b3-446b-9bd3-39b202941704',NULL,'4ce9ce71-c022-44d2-ba01-aa1cf79e1b3d','📋 Prochaines étapes de votre projet','Chris, voici ce qu\'il faut savoir sur votre projet :\n\n## ⏱️ Délais indicatifs :\n- **Analyse initiale** : 24-48h après validation du paiement\n- **Début de correction** : 2-5 jours ouvrés\n- **Livraison finale** : Selon la complexité de votre document\n\n## 📧 Notifications automatiques :\nVous recevrez un email à chaque étape importante :\n- 🔍 Début d\'analyse de votre document\n- ✏️ Début de la correction\n- 📝 Demandes de précisions si nécessaires\n- ✅ Correction terminée et document disponible\n\n## 💡 Conseils pour optimiser votre correction :\n- **Soyez disponible** pour répondre aux questions de nos correcteurs\n- **Précisez vos attentes** si vous avez des exigences particulières\n- **Consultez régulièrement** votre espace client pour les mises à jour\n\n## 🎯 Objectif qualité :\nNotre engagement : vous livrer un document parfaitement corrigé, respectant les règles de :\n- ✅ Orthographe et grammaire\n- ✅ Style et cohérence\n- ✅ Structure et lisibilité\n- ✅ Respect de vos spécificités\n\n**À bientôt dans votre espace client !** 👋','SYSTEM_MESSAGE','ENVOYE',1,0,0,NULL,'2025-07-29 09:08:43.376','2025-07-29 09:10:59.981','703dff1f-4a43-49b3-8776-0c5e84049f95',NULL,NULL,0,'Équipe','Staka Livres','Support',0,'\"{\\\"isFollowUpMessage\\\":true,\\\"commandeId\\\":\\\"7ce67e3d-645b-4caa-80d1-65168b6256f7\\\",\\\"messageType\\\":\\\"next_steps\\\",\\\"createdBySystem\\\":true}\"',NULL);
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('INFO','SUCCESS','WARNING','ERROR','PAYMENT','ORDER','MESSAGE','SYSTEM','CONSULTATION') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INFO',
  `priority` enum('FAIBLE','NORMALE','HAUTE','URGENTE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NORMALE',
  `data` text COLLATE utf8mb4_unicode_ci,
  `actionUrl` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `readAt` datetime(3) DEFAULT NULL,
  `expiresAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_userId_idx` (`userId`),
  KEY `notifications_type_idx` (`type`),
  KEY `notifications_isRead_idx` (`isRead`),
  KEY `notifications_isDeleted_idx` (`isDeleted`),
  KEY `notifications_createdAt_idx` (`createdAt`),
  CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES ('23e458dc-7ab9-451c-953e-d22a0cbca6b0','fb1d4b5f-7edc-4742-bcbc-4934277cfe39','Nouvelle inscription','Chris Moss (c.mostefaoui@yahoo.fr) s\'est inscrit sur la plateforme.','INFO','NORMALE',NULL,'/admin/users',1,1,'2025-07-28 11:02:53.191','2025-08-27 10:51:20.961','2025-07-28 10:51:20.962','2025-07-29 04:56:43.482'),('2a4dda2a-439e-428d-80a4-4256dec28aa5','fb1d4b5f-7edc-4742-bcbc-4934277cfe39','Nouvelle inscription','Chris Moss (c.mostefaoui@yahoo.fr) s\'est inscrit sur la plateforme.','INFO','NORMALE',NULL,'/admin/users',1,1,'2025-07-29 04:56:19.803','2025-08-27 11:46:12.224','2025-07-28 11:46:12.226','2025-07-29 04:56:42.602'),('2dfe9676-52af-40b2-9d03-5cb0dbd8b60f','fb1d4b5f-7edc-4742-bcbc-4934277cfe39','Nouveau message client','Chris Moss vous a envoyé un message : \"voila\"','MESSAGE','NORMALE',NULL,'/admin/messagerie',1,1,'2025-07-29 04:56:19.803','2025-08-27 14:54:52.904','2025-07-28 14:54:52.905','2025-07-29 04:56:39.647'),('334b2bd1-6a29-4abd-a9db-1ddcc1d6752a','fb1d4b5f-7edc-4742-bcbc-4934277cfe39','Nouvelle commande reçue','User Test (usertest@test.com) a créé une nouvelle commande : \"hello\".','ORDER','HAUTE','{\"customerName\":\"User Test\",\"customerEmail\":\"usertest@test.com\",\"commandeTitle\":\"hello\",\"commandeId\":\"baa4a435-ed2b-485a-82b3-5bf7764fda7a\"}','/admin/commandes?id=baa4a435-ed2b-485a-82b3-5bf7764fda7a',1,1,'2025-07-29 04:56:19.803','2025-08-27 10:36:11.673','2025-07-28 10:36:11.675','2025-07-29 04:56:43.688'),('39ea9532-976e-4ab0-83a8-8677c21cd8a7','fb1d4b5f-7edc-4742-bcbc-4934277cfe39','Nouvelle commande reçue','Chris Moss (c.mostefaoui@yahoo.fr) a créé une nouvelle commande : \"hello\".','ORDER','HAUTE','{\"customerName\":\"Chris Moss\",\"customerEmail\":\"c.mostefaoui@yahoo.fr\",\"commandeTitle\":\"hello\",\"commandeId\":\"cf35b630-de5f-48ce-95f7-d85b377a661e\"}','/admin/commandes?id=cf35b630-de5f-48ce-95f7-d85b377a661e',1,1,'2025-07-29 04:56:19.803','2025-08-27 12:11:10.116','2025-07-28 12:11:10.118','2025-07-29 04:56:42.104'),('3e6e0171-6cf9-4970-a73f-7c2558aa5486','fb1d4b5f-7edc-4742-bcbc-4934277cfe39','Nouvelle inscription','Test Bienvenue (test.bienvenue@example.com) s\'est inscrit sur la plateforme.','INFO','NORMALE',NULL,'/admin/users',1,1,'2025-07-29 04:56:19.803','2025-08-27 10:57:20.232','2025-07-28 10:57:20.233','2025-07-29 04:56:43.299'),('5027c3bf-6871-43a8-a477-59c88d471443','fb1d4b5f-7edc-4742-bcbc-4934277cfe39','Nouveau paiement reçu','Chris Moss a effectué un paiement de 480.00€ pour \"Pack Rédaction Complète\".','PAYMENT','HAUTE',NULL,'/admin/factures',1,0,'2025-07-29 08:58:41.983','2025-08-28 05:00:45.208','2025-07-29 05:00:45.210','2025-07-29 08:58:41.984'),('725fcf09-6012-4d7a-acfb-0c30be7c5b4d','fb1d4b5f-7edc-4742-bcbc-4934277cfe39','Nouveau paiement reçu','Chris Moss a effectué un paiement de 480.00€ pour \"Correction Standard\".','PAYMENT','HAUTE',NULL,'/admin/factures',0,0,NULL,'2025-08-28 09:08:43.298','2025-07-29 09:08:43.300','2025-07-29 09:08:43.300'),('99f925c6-f56a-476b-8827-93176a10cb72','fb1d4b5f-7edc-4742-bcbc-4934277cfe39','Nouvelle inscription','Chris Moss (c.mostefaoui@yahoo.fr) s\'est inscrit sur la plateforme.','INFO','NORMALE',NULL,'/admin/users',0,0,NULL,'2025-08-28 09:09:57.677','2025-07-29 09:09:57.679','2025-07-29 09:09:57.679'),('c5cc2023-0a0e-4d61-a6a4-7630bbf88685','fb1d4b5f-7edc-4742-bcbc-4934277cfe39','Nouvelle inscription','UserToDelete TestDelete (user.to.delete@example.com) s\'est inscrit sur la plateforme.','INFO','NORMALE',NULL,'/admin/users',1,1,'2025-07-29 04:56:19.803','2025-08-27 11:07:55.137','2025-07-28 11:07:55.138','2025-07-29 04:56:42.920'),('d3af72c9-a051-481b-846e-3cef1d9461fb','603f635a-c1ae-40b9-8755-77b995bc4d3c','Projet créé avec succès','Votre projet \"hello\" a été créé et est en attente de vérification. Notre équipe vous contactera sous 24h pour valider le nombre de pages.','SUCCESS','HAUTE','{\"commandeTitle\":\"hello\",\"commandeId\":\"baa4a435-ed2b-485a-82b3-5bf7764fda7a\",\"packType\":\"pack-integral-default\",\"needsVerification\":true}','/app/projects/baa4a435-ed2b-485a-82b3-5bf7764fda7a',1,0,'2025-07-28 10:36:26.788','2025-08-27 10:36:11.743','2025-07-28 10:36:11.744','2025-07-28 10:36:26.789'),('d3d1d451-1e1c-4cc7-9308-f4f79e9a86c6','fb1d4b5f-7edc-4742-bcbc-4934277cfe39','Nouvelle commande reçue','Chris Moss (c.mostefaoui@yahoo.fr) a créé une nouvelle commande : \"hello\".','ORDER','HAUTE','{\"customerName\":\"Chris Moss\",\"customerEmail\":\"c.mostefaoui@yahoo.fr\",\"commandeTitle\":\"hello\",\"commandeId\":\"d83a1073-93e9-45c5-8ad9-6cd6751f205e\"}','/admin/commandes?id=d83a1073-93e9-45c5-8ad9-6cd6751f205e',1,1,'2025-07-29 04:56:19.803','2025-08-27 11:49:43.114','2025-07-28 11:49:43.115','2025-07-29 04:56:42.441'),('d3ddcfe0-b26f-45d7-a03f-86eea5be0da9','fb1d4b5f-7edc-4742-bcbc-4934277cfe39','Nouvelle commande reçue','Chris Moss (c.mostefaoui@yahoo.fr) a créé une nouvelle commande : \"Roman1\".','ORDER','HAUTE','{\"customerName\":\"Chris Moss\",\"customerEmail\":\"c.mostefaoui@yahoo.fr\",\"commandeTitle\":\"Roman1\",\"commandeId\":\"3d7ff3b8-e925-442c-8bbb-46ddff68d71f\"}','/admin/commandes?id=3d7ff3b8-e925-442c-8bbb-46ddff68d71f',1,1,'2025-07-29 04:56:19.803','2025-08-27 14:42:34.469','2025-07-28 14:42:34.471','2025-07-29 04:56:41.434'),('df64eef6-a307-41e8-992f-fdd7cce2889d','fb1d4b5f-7edc-4742-bcbc-4934277cfe39','Nouvelle commande reçue','Chris Moss (c.mostefaoui@yahoo.fr) a créé une nouvelle commande : \"aaaa\".','ORDER','HAUTE','{\"customerName\":\"Chris Moss\",\"customerEmail\":\"c.mostefaoui@yahoo.fr\",\"commandeTitle\":\"aaaa\",\"commandeId\":\"4317b812-ecee-4e77-bd65-b2076f657ea3\"}','/admin/commandes?id=4317b812-ecee-4e77-bd65-b2076f657ea3',1,1,'2025-07-29 04:56:19.803','2025-08-27 14:19:55.348','2025-07-28 14:19:55.349','2025-07-29 04:56:41.883');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pages`
--

DROP TABLE IF EXISTS `pages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pages` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `excerpt` text COLLATE utf8mb4_unicode_ci,
  `type` enum('PAGE','FAQ','BLOG','LEGAL','HELP','LANDING') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PAGE',
  `status` enum('DRAFT','PUBLISHED','ARCHIVED','SCHEDULED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `metaTitle` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metaDescription` text COLLATE utf8mb4_unicode_ci,
  `metaKeywords` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tags` text COLLATE utf8mb4_unicode_ci,
  `sortOrder` int NOT NULL DEFAULT '0',
  `isPublic` tinyint(1) NOT NULL DEFAULT '1',
  `requireAuth` tinyint(1) NOT NULL DEFAULT '0',
  `publishedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pages_slug_key` (`slug`),
  KEY `pages_slug_idx` (`slug`),
  KEY `pages_type_idx` (`type`),
  KEY `pages_status_idx` (`status`),
  KEY `pages_category_idx` (`category`),
  KEY `pages_isPublic_idx` (`isPublic`),
  KEY `pages_publishedAt_idx` (`publishedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pages`
--

LOCK TABLES `pages` WRITE;
/*!40000 ALTER TABLE `pages` DISABLE KEYS */;
INSERT INTO `pages` VALUES ('0d0fd12f-980e-4cf5-8bfb-c6fe688c2f86','Mentions légales','mentions-legales','<p>Mentions légales à compléter...</p>',NULL,'PAGE','PUBLISHED','Mentions légales','Mentions légales du site Staka.',NULL,NULL,NULL,1,1,0,NULL,'2025-07-28 10:33:13.355','2025-07-28 10:33:13.355'),('8c5e5adc-2f3c-422e-a587-f5763343046f','RGPD','rgpd','<p>RGPD à compléter...</p>',NULL,'PAGE','PUBLISHED','RGPD','Informations RGPD du site Staka.',NULL,NULL,NULL,4,1,0,NULL,'2025-07-28 10:33:13.394','2025-07-28 10:33:13.394'),('c8015e95-dec7-4751-83a0-8f5f97db8a3a','Politique de confidentialité','politique-confidentialite','<p>Politique de confidentialité à compléter...</p>',NULL,'PAGE','PUBLISHED','Politique de confidentialité','Politique de confidentialité du site Staka.',NULL,NULL,NULL,2,1,0,NULL,'2025-07-28 10:33:13.374','2025-07-28 10:33:13.374'),('ef850276-3ddf-4e86-b638-c78db6eebc46','Conditions Générales de Vente','cgv','<p>CGV à compléter...</p>',NULL,'PAGE','PUBLISHED','CGV','Conditions Générales de Vente du site Staka.',NULL,NULL,NULL,3,1,0,NULL,'2025-07-28 10:33:13.383','2025-07-28 10:33:13.383');
/*!40000 ALTER TABLE `pages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenHash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `password_resets_tokenHash_key` (`tokenHash`),
  KEY `password_resets_userId_idx` (`userId`),
  KEY `password_resets_expiresAt_idx` (`expiresAt`),
  CONSTRAINT `password_resets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_methods`
--

DROP TABLE IF EXISTS `payment_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_methods` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stripePaymentMethodId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last4` varchar(4) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expMonth` int NOT NULL,
  `expYear` int NOT NULL,
  `isDefault` tinyint(1) NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `fingerprint` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_methods_stripePaymentMethodId_key` (`stripePaymentMethodId`),
  KEY `payment_methods_userId_idx` (`userId`),
  KEY `payment_methods_stripePaymentMethodId_idx` (`stripePaymentMethodId`),
  KEY `payment_methods_isDefault_idx` (`isDefault`),
  CONSTRAINT `payment_methods_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_methods`
--

LOCK TABLES `payment_methods` WRITE;
/*!40000 ALTER TABLE `payment_methods` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_methods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pending_commandes`
--

DROP TABLE IF EXISTS `pending_commandes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pending_commandes` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telephone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adresse` text COLLATE utf8mb4_unicode_ci,
  `serviceId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `consentementRgpd` tinyint(1) NOT NULL DEFAULT '0',
  `stripeSessionId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activationToken` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tokenExpiresAt` datetime(3) DEFAULT NULL,
  `isProcessed` tinyint(1) NOT NULL DEFAULT '0',
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `commandeId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pending_commandes_stripeSessionId_key` (`stripeSessionId`),
  UNIQUE KEY `pending_commandes_activationToken_key` (`activationToken`),
  KEY `pending_commandes_email_idx` (`email`),
  KEY `pending_commandes_stripeSessionId_idx` (`stripeSessionId`),
  KEY `pending_commandes_activationToken_idx` (`activationToken`),
  KEY `pending_commandes_isProcessed_idx` (`isProcessed`),
  KEY `pending_commandes_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pending_commandes`
--

LOCK TABLES `pending_commandes` WRITE;
/*!40000 ALTER TABLE `pending_commandes` DISABLE KEYS */;
INSERT INTO `pending_commandes` VALUES ('5c6753e0-cb7e-4078-a8a1-313c344792cd','Chris','Moss','c.mostefaoui@yahoo.fr','$2b$12$J7hw9Cl/SsTu0I01YiJdoOPNUG3lJOLQeTpJuFHmyxqCa9srqjJqm','+33679088845','4 avenue Edmond Rostand','6b7cb642-0d8d-4ed8-97fb-4e25f1044f05',1,'cs_test_a1A3m0f3foUSWtHFRjL7AWvVvcTLnHpNco4Y7ZhJWjAuS04pSQyQODvXzY',NULL,NULL,0,NULL,NULL,'2025-07-29 09:02:41.113','2025-07-29 09:02:41.737'),('83bccb04-824c-4390-9e5c-cd60f68489c7','Chris','Moss','c.mostefaoui@yahoo.fr','$2b$12$1zsu20AzjqRukVjcg7NEAeumPLGz3EBkvzqQFeRscbfgP3QzBKJ2S','+33679088845','4 avenue Edmond Rostand','2ee2b788-5611-4248-a736-593bf1c8eab9',1,'cs_test_a16NQ7kEoQcnjJNofgOotxjAhuFmwQszHgOM4hv0dKmEfWVJqOMcpvPzfI','b413604a-677c-40d8-9d4c-34b57053b41f','2025-07-31 05:00:43.643',1,'ee27973a-1dc2-4f4d-ae31-fad057a96edc','e1c937b8-ce97-4727-b2a4-baf370e83e3d','2025-07-29 04:57:49.164','2025-07-29 05:00:43.649'),('a6ed536f-e455-4c07-b7f3-dfb5fa64fc2f','Chris','Moss','c.mostefaoui@yahoo.fr','$2b$12$Ipf347Ixm0THwkAz/7gZqOFblEl84Y4zk8Iyc2R9NuzZ1iZss7X4i','+33679088845','4 avenue Edmond Rostand','6b7cb642-0d8d-4ed8-97fb-4e25f1044f05',1,'cs_test_a1usL2hWWbtoVdhAvMbhRNdzuUwSM8MaOsim4Y8K2O99kygDazIF8M1XuF',NULL,NULL,0,NULL,NULL,'2025-07-29 08:57:21.734','2025-07-29 08:57:22.701'),('b82f16ae-2da6-413c-82d0-615f7bfa3c05','Chris','Moss','c.mostefaoui@yahoo.fr','$2b$12$tMAW8G9ywfcYSWMAKqtA2Ov878llfTWRrSD789ERnc5hyuEjQA7m2','+33679088845','4 avenue Edmond Rostand','6b7cb642-0d8d-4ed8-97fb-4e25f1044f05',1,'cs_test_a1WxpopjcUmHDWx7EV7csUFsV6O48TsduEOWCztw7wdIM3anfXqe4M45II',NULL,NULL,1,'4ce9ce71-c022-44d2-ba01-aa1cf79e1b3d','7ce67e3d-645b-4caa-80d1-65168b6256f7','2025-07-29 09:08:09.990','2025-07-29 09:09:57.660'),('e2534c02-ed28-4a49-9bc2-e4003a212a67','Chris','Moss','c.mostefaoui@yahoo.fr','$2b$12$PMGD8l.KE0DUAwC7YkBDpO5xeNnmYUwTkV/zCaW4sdPGGqtQZz1SK','+33679088845','4 avenue Edmond Rostand','6b7cb642-0d8d-4ed8-97fb-4e25f1044f05',1,'cs_test_a1Hk2elkSEVKXOAVX78KqTVpQmWKDm702sPQk6lmJSsY3WoVjrIymt4mPT',NULL,NULL,0,NULL,NULL,'2025-07-29 08:59:33.445','2025-07-29 08:59:34.024'),('fe0cd7e8-83e7-4873-8131-5d49367aa3d3','Chris','Moss','c.mostefaoui@yahoo.fr','$2b$12$UUnHmMAef0tKkwYpIUWHXO/9rfw3cC8StAbCM/xt/o1C1J85d86Dq','+33679088845','4 avenue Edmond Rostand','70eaff05-05cf-4f82-a7cc-f231aeae4494',1,'cs_test_a1AE0nnrvX4D1JS7T3xt1gCUMgU2Zytr6IBewXNxDpJOsUxTi7RSbiW5qd',NULL,NULL,0,NULL,NULL,'2025-07-29 09:05:04.483','2025-07-29 09:05:05.006');
/*!40000 ALTER TABLE `pending_commandes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_requests`
--

DROP TABLE IF EXISTS `support_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `support_requests` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('GENERAL','TECHNIQUE','FACTURATION','COMMANDE','COMPTE','AUTRE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GENERAL',
  `priority` enum('FAIBLE','NORMALE','HAUTE','URGENTE','CRITIQUE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NORMALE',
  `status` enum('OUVERT','EN_COURS','EN_ATTENTE','RESOLU','FERME','ANNULE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OUVERT',
  `assignedToId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tags` text COLLATE utf8mb4_unicode_ci,
  `firstResponseAt` datetime(3) DEFAULT NULL,
  `resolvedAt` datetime(3) DEFAULT NULL,
  `closedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `support_requests_userId_idx` (`userId`),
  KEY `support_requests_assignedToId_idx` (`assignedToId`),
  KEY `support_requests_status_idx` (`status`),
  KEY `support_requests_priority_idx` (`priority`),
  KEY `support_requests_category_idx` (`category`),
  KEY `support_requests_createdAt_idx` (`createdAt`),
  CONSTRAINT `support_requests_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `support_requests_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_requests`
--

LOCK TABLES `support_requests` WRITE;
/*!40000 ALTER TABLE `support_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `support_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tarifs`
--

DROP TABLE IF EXISTS `tarifs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tarifs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `prix` int NOT NULL,
  `prixFormate` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `typeService` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dureeEstimee` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `ordre` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `stripePriceId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripeProductId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tarifs_actif_idx` (`actif`),
  KEY `tarifs_ordre_idx` (`ordre`),
  KEY `tarifs_typeService_idx` (`typeService`),
  KEY `tarifs_createdAt_idx` (`createdAt`),
  KEY `tarifs_stripeProductId_idx` (`stripeProductId`),
  KEY `tarifs_stripePriceId_idx` (`stripePriceId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tarifs`
--

LOCK TABLES `tarifs` WRITE;
/*!40000 ALTER TABLE `tarifs` DISABLE KEYS */;
INSERT INTO `tarifs` VALUES ('2ee2b788-5611-4248-a736-593bf1c8eab9','Pack Rédaction Complète','Coaching rédactionnel + correction + mise en forme + couverture',145000,'1450€','Rédaction','3-6 semaines',1,3,'2025-07-28 10:33:13.319','2025-07-28 10:34:52.887','price_1RpoOOIxxWvUprbExKuocyy7','prod_SlL4LinqAuq7NT'),('6b7cb642-0d8d-4ed8-97fb-4e25f1044f05','Correction Standard','Correction orthographique, grammaticale et typographique de votre manuscrit',200,'2€','Correction','7-10 jours',1,2,'2025-07-28 10:33:13.288','2025-07-28 10:34:49.764','price_1RpoO8IxxWvUprbEGgWYMoah','prod_SlL4R6SZyq058H'),('70eaff05-05cf-4f82-a7cc-f231aeae4494','Pack KDP Autoédition','Maquette intérieure + couverture + formats ePub/Mobi pour Amazon KDP',35000,'350€','Mise en forme','5-7 jours',1,1,'2025-07-28 10:33:13.304','2025-07-28 10:34:42.967','price_1RpoOEIxxWvUprbEPsKBhYuq','prod_SlL41bJBCctiWi');
/*!40000 ALTER TABLE `tarifs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('USER','ADMIN','CORRECTOR') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `adresse` text COLLATE utf8mb4_unicode_ci,
  `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferences` json DEFAULT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  KEY `users_email_idx` (`email`),
  KEY `users_role_idx` (`role`),
  KEY `users_isActive_idx` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('4ce9ce71-c022-44d2-ba01-aa1cf79e1b3d','Chris','Moss','c.mostefaoui@yahoo.fr','$2b$12$tMAW8G9ywfcYSWMAKqtA2Ov878llfTWRrSD789ERnc5hyuEjQA7m2','USER',1,'2025-07-29 09:08:41.868','2025-07-29 09:09:57.622','4 avenue Edmond Rostand',NULL,'+33679088845',NULL,NULL),('603f635a-c1ae-40b9-8755-77b995bc4d3c','User','Test','usertest@test.com','$2a$10$yUDHU7kr0emoRUwf8pg5COp3xeVjWhosGADPrfEYJNaTWvwHWTfcq','USER',1,'2025-07-28 10:33:37.272','2025-07-28 10:33:37.272',NULL,NULL,NULL,NULL,NULL),('90cc85ea-8ca1-4b4b-9777-b300ac82f39b','TEMP','UPLOAD_USER','__temp_upload_user__@staka.internal','$2b$12$aXsAHklywr.iGkpoKZb4uOba//tpZTT4nUy19pH95JhKwJx2oUmL2','USER',0,'2025-07-29 09:08:11.028','2025-07-29 09:08:11.028',NULL,NULL,NULL,NULL,NULL),('fb1d4b5f-7edc-4742-bcbc-4934277cfe39','Admin','Staka','contact@staka.fr','$2a$10$eZbOAfwajDd18fUQNEGgDuTrQsUJC3mf8EH/wh447mUWZKy3eHAnO','ADMIN',1,'2025-07-28 10:33:37.244','2025-07-28 10:33:37.244',NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'stakalivres'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-29 14:59:28
