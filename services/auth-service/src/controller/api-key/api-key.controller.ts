import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from "../../services/api-key.service.js";
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createApiKey = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, scopes } = req.body;
  
  // Assuming req.user is populated by your auth middleware
  if (!req.user) {
    return res.status(401).json({ status: 'error', message: 'User not authenticated' });
  }

  const result = await ApiKeyService.createApiKey({
    name,
    description,
    scopes: scopes || ['read:basic'], // Default scope
    createdBy: req.user.id,
    createdByType: req.user.role, // e.g., 'admin', 'college_admin'
  });

  res.status(201).json({
    status: 'success',
    data: result,
  });
});

export const listApiKeys = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ status: 'error', message: 'User not authenticated' });
  }

  const keys = await ApiKeyService.listApiKeys(req.user.id);
  
  res.status(200).json({
    status: 'success',
    results: keys.length,
    data: keys,
  });
});

export const revokeApiKey = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ status: 'error', message: 'User not authenticated' });
  }

  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ status: 'error', message: 'API key ID is required' });
  }

  await ApiKeyService.revokeApiKey(id, req.user.id);
  
  res.status(204).json({
    status: 'success',
    data: null,
  });
});