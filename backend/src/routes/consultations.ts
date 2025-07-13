import express from 'express';
import { 
  bookConsultation, 
  getConsultationRequests, 
  markConsultationAsProcessed,
  getAvailableSlots 
} from '../controllers/consultationController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { Role } from '@prisma/client';

const router = express.Router();

/**
 * @route POST /api/consultations/book
 * @desc Réserver une consultation (public)
 * @access Public
 */
router.post('/book', bookConsultation);

/**
 * @route GET /api/consultations/available-slots
 * @desc Récupérer les créneaux disponibles (public)
 * @access Public
 */
router.get('/available-slots', getAvailableSlots);

/**
 * @route GET /api/consultations/requests
 * @desc Récupérer toutes les demandes de consultation (admin uniquement)
 * @access Admin
 */
router.get('/requests', authenticateToken, requireRole(Role.ADMIN), getConsultationRequests);

/**
 * @route PUT /api/consultations/requests/:messageId
 * @desc Marquer une demande comme traitée (admin uniquement)
 * @access Admin
 */
router.put('/requests/:messageId', authenticateToken, requireRole(Role.ADMIN), markConsultationAsProcessed);

export default router;