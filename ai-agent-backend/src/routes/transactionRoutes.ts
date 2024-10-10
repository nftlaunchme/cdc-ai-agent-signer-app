// src/routes/transactionRoutes.ts

import express, { Request, Response } from 'express';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { getBalance } from '../blockchain';

dotenv.config();

const router = express.Router();

/**
 * @route POST /api/transaction/send
 * @desc Send a transaction
 * @body { to: string, value: string, data?: string }
 */
router.post('/send', async (req: Request, res: Response) => {
  const { to, value, data } = req.body;
  const fromPrivateKey = process.env.FROM_PRIVATE_KEY; // NEVER expose this in production

  if (!fromPrivateKey) {
    return res.status(500).json({ error: 'Transaction signing not configured.' });
  }

  if (!to || !value) {
    return res.status(400).json({ error: 'To address and value are required.' });
  }

  try {
    const wallet = new ethers.Wallet(fromPrivateKey, new ethers.JsonRpcProvider(process.env.CRONOS_RPC_URL));
    const tx = {
      to,
      value: ethers.parseEther(value), // Assuming value is in CRO
      data: data || '0x',
      gasLimit: 21000, // Adjust as needed
    };

    const transactionResponse = await wallet.sendTransaction(tx);
    await transactionResponse.wait(); // Wait for transaction confirmation

    res.json({ transactionHash: transactionResponse.hash });
  } catch (error: any) {
    console.error('Error sending transaction:', error);
    res.status(500).json({ error: 'Failed to send transaction.' });
  }
});

export default router;
