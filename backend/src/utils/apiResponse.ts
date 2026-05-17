import { Response } from 'express';

export function sendSuccess(res: Response, data: unknown = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

export function sendError(res: Response, message = 'Internal Server Error', statusCode = 500, errors?: unknown) {
  return res.status(statusCode).json({ success: false, message, errors });
}

export function sendPaginated(
  res: Response,
  data: unknown[],
  total: number,
  page: number,
  limit: number,
  message = 'Success'
) {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
}
