// src/routes/blockchainRoutes.ts

import express, { Request, Response } from 'express';
import { getBalance, getLatestBlock, getTransactionsByAddress, getContractABI } from '../blockchain';

const router = express.Router();

/**
 * @route GET /api/blockchain/balance/:address
 * @desc Get CRO balance of a specific address
 */
router.get('/balance/:address', async (req: Request, res: Response) => {
  const { address } = req.params;

  try {
    const balance = await getBalance(address);
    res.json({ balance });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/blockchain/latest-block
 * @desc Get the latest block information
 */
router.get('/latest-block', async (req: Request, res: Response) => {
  try {
    const latestBlock = await getLatestBlock();
    res.json(latestBlock);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/blockchain/transactions/:address
 * @desc Get recent transactions for a specific address
 */
router.get('/transactions/:address', async (req: Request, res: Response) => {
  const { address } = req.params;
  const limit = parseInt(req.query.limit as string, 10) || 5;

  try {
    const transactions = await getTransactionsByAddress(address, limit);
    res.json({ transactions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/blockchain/contract-abi/:address
 * @desc Get the ABI of a specific smart contract
 */
router.get('/contract-abi/:address', async (req: Request, res: Response) => {
  const { address } = req.params;

  try {
    const abi = await getContractABI(address);
    res.json({ abi });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
