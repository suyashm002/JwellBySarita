import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { upload, uploadToS3 } from '../../middleware/upload';

const router = Router();

router.post(
  '/upload',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  upload.array('files', 10),
  uploadToS3
);

router.post(
  '/upload/single',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  upload.single('file'),
  uploadToS3
);

export default router;
