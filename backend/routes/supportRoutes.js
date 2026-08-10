import express from 'express';
import {
    createTicket,
    getTickets,
    getTicketById,
    updateTicket,
    getTicketReplies,
    addTicketReply,
    markRepliesAsRead,
    rateTicket,
    getSupportAgents,
    updateSupportAgent,
    getKnowledgeBase,
    getKnowledgeBaseArticle,
    createKnowledgeBaseArticle,
    updateKnowledgeBaseArticle,
    deleteKnowledgeBaseArticle,
    getAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    getSupportAnalytics,
    upload
} from '../controllers/supportController.js';
import { protect, authorize, checkFeature } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication to all endpoints
router.use(protect);

// Support Analytics route
router.route('/analytics').get(checkFeature('Advanced Support'), getSupportAnalytics);

// Support Tickets endpoints
router.route('/tickets')
    .get(getTickets)
    .post(upload.array('attachments', 5), createTicket);

router.route('/tickets/:id')
    .get(getTicketById)
    .put(updateTicket);

router.route('/tickets/:id/replies')
    .get(getTicketReplies)
    .post(upload.array('attachments', 5), addTicketReply);

router.route('/tickets/:id/read')
    .post(markRepliesAsRead);

router.route('/tickets/:id/rate')
    .post(rateTicket);

// Support Agents endpoints
router.route('/agents')
    .get(authorize('SuperAdmin', 'SupportAgent'), getSupportAgents)
    .post(authorize('SuperAdmin'), updateSupportAgent);

// Knowledge Base endpoints
router.route('/knowledge-base')
    .get(getKnowledgeBase)
    .post(authorize('SuperAdmin', 'SupportAgent'), createKnowledgeBaseArticle);

router.route('/knowledge-base/:id')
    .get(getKnowledgeBaseArticle)
    .put(authorize('SuperAdmin', 'SupportAgent'), updateKnowledgeBaseArticle)
    .delete(authorize('SuperAdmin', 'SupportAgent'), deleteKnowledgeBaseArticle);

// Announcements endpoints
router.route('/announcements')
    .get(getAnnouncements)
    .post(authorize('SuperAdmin', 'SupportAgent'), createAnnouncement);

router.route('/announcements/:id')
    .put(authorize('SuperAdmin', 'SupportAgent'), updateAnnouncement);

export default router;
