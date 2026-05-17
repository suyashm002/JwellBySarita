import multer from 'multer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import s3Client from '../config/s3';
import { config } from '../config';
import { sendSuccess, sendError } from '../utils/apiResponse';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

export async function uploadToS3(req: Request, res: Response, _next: NextFunction) {
  try {
    if (!req.file && (!req.files || (Array.isArray(req.files) && req.files.length === 0))) {
      return sendError(res, 'No file provided', 400);
    }

    const files = req.file ? [req.file] : (req.files as Express.Multer.File[]);
    const uploaded: { url: string; key: string; originalName: string }[] = [];

    for (const file of files) {
      const ext = path.extname(file.originalname);
      const key = `products/${uuid()}${ext}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: config.AWS_S3_BUCKET,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );

      const url = config.CLOUDFRONT_URL
        ? `${config.CLOUDFRONT_URL}/${key}`
        : `https://${config.AWS_S3_BUCKET}.s3.${config.AWS_REGION}.amazonaws.com/${key}`;

      uploaded.push({ url, key, originalName: file.originalname });
    }

    return sendSuccess(res, uploaded, 'Files uploaded successfully', 201);
  } catch (error) {
    return sendError(res, 'Upload failed', 500);
  }
}
