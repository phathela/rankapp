import { Router } from 'express';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  createRankingSchema,
  voteSchema,
  commentSchema,
  createCheckoutSchema,
  engagementScoreSchema,
} from '../middleware/validate';

// Auth
import * as authController from '../controllers/auth.controller';

// Categories
import * as categoryController from '../controllers/category.controller';

// Rankings
import * as rankingController from '../controllers/ranking.controller';

// Payments
import * as paymentController from '../controllers/payment.controller';

// Comments
import * as commentController from '../controllers/comment.controller';

// Admin
import * as adminController from '../controllers/admin.controller';

// Winners
import * as winnerController from '../controllers/winner.controller';

const router = Router();

// --- Auth Routes ---
router.post('/auth/register', validate(registerSchema), authController.register);
router.post('/auth/login', validate(loginSchema), authController.login);
router.get('/auth/profile', authenticate, authController.getProfile);

// --- Category Routes ---
router.get('/categories', categoryController.listCategories);
router.get('/categories/:slug', categoryController.getCategory);

// --- Ranking Routes ---
router.get('/rankings/trending', rankingController.listTrending);
router.get('/rankings', rankingController.listRankings);
router.get('/rankings/:id', optionalAuth, rankingController.getRanking);
router.post('/rankings', authenticate, validate(createRankingSchema), rankingController.createRanking);
router.post('/rankings/:id/vote', authenticate, validate(voteSchema), rankingController.vote);
router.post('/rankings/:id/close', authenticate, rankingController.closeRanking);

// --- Comment Routes ---
router.get('/rankings/:id/comments', optionalAuth, commentController.getComments);
router.post('/rankings/:id/comments', authenticate, validate(commentSchema), commentController.addComment);
router.post('/comments/:id/like', authenticate, commentController.likeComment);

// --- Payment Routes ---
router.post('/payments/create-checkout', authenticate, validate(createCheckoutSchema), paymentController.createCheckout);
router.get('/payments/transactions', authenticate, paymentController.transactionHistory);

// --- Winner Routes ---
router.get('/winners', winnerController.listWinners);
router.get('/winners/:id', winnerController.getWinnerDetail);
router.get('/winners/:id/certificate', winnerController.getCertificate);

// --- Admin Routes ---
router.post('/admin/engagement-scores', authenticate, requireAdmin, validate(engagementScoreSchema), adminController.setEngagementScore);
router.post('/admin/distributions/:id/complete', authenticate, requireAdmin, adminController.completeDistribution);
router.get('/admin/distributions', authenticate, requireAdmin, adminController.listPendingDistributions);
router.get('/admin/stats', authenticate, requireAdmin, adminController.getDashboardStats);

export default router;
