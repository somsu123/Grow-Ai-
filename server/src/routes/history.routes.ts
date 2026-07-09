/**
 * History Routes
 * Mounts history endpoints at /api/history
 */

import { Router } from 'express';
import {
  listSessions,
  getSessionRecords,
  exportRecords,
  deleteImportSession,
  clearDatabase,
} from '../controllers/history.controller';

const router = Router();

// List all import sessions
router.get('/', listSessions);

// Export as CSV — must come before /:id to avoid route conflict
router.get('/export', exportRecords);

// Get records for a specific session
router.get('/:id/records', getSessionRecords);

// Delete a specific session
router.delete('/:id', deleteImportSession);

// Clear ALL data
router.delete('/', clearDatabase);

export default router;
