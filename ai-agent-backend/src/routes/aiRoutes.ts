import express, { Request, Response } from 'express';
import { OpenAI } from 'openai'; // Update this import
import { body, validationResult } from 'express-validator';
import axios from 'axios';
import redisClient from '../cache';
import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Define the type for function schemas
type FunctionSchema = {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
};

// Function Schemas
const functions: FunctionSchema[] = [
  {
    name: "SendTransaction",
    description: "Send a transaction from one address to another",
    parameters: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "The recipient's address"
        },
        amount: {
          type: "number",
          description: "The amount to send"
        },
        symbol: {
          type: "string",
          description: "The token symbol (e.g., 'CRO')"
        }
      },
      required: ["to", "amount", "symbol"]
    }
  },
  // Add other function schemas here...
];

/**
 * @route POST /api/ai/query
 * @desc Generate AI response based on user prompt
 */
router.post(
  '/query',
  body('prompt').notEmpty().withMessage('Prompt is required.'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { prompt } = req.body;
    const cacheKey = `ai_response:${prompt}`;

    try {
      const cachedResponse = await redisClient.get(cacheKey);
      if (cachedResponse) {
        console.log('Serving from cache');
        return res.json({ message: cachedResponse });
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4', // Update this to the correct model name
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        functions: functions,
        function_call: 'auto'
      });

      const choice = response.choices[0];

      if (choice.finish_reason === 'function_call' && choice.message.function_call) {
        const { name, arguments: args } = choice.message.function_call;

        let parsedArgs: any = {};
        try {
          parsedArgs = args ? JSON.parse(args) : {};
        } catch (parseError) {
          console.error('Error parsing function arguments:', parseError);
          return res.status(500).json({ error: 'Invalid function arguments.' });
        }

        console.log(`Function called: ${name} with arguments: ${JSON.stringify(parsedArgs)}`);

        let functionResponse = {};

        switch (name) {
          case 'SendTransaction':
            functionResponse = await SendTransaction(parsedArgs);
            break;
          case 'GetBalance':
            functionResponse = await GetBalance(parsedArgs);
            break;
          case 'GetLatestBlock':
            functionResponse = await GetLatestBlock(parsedArgs);
            break;
          case 'GetTransactionsByAddress':
            functionResponse = await GetTransactionsByAddress(parsedArgs);
            break;
          case 'GetContractABI':
            functionResponse = await GetContractABI(parsedArgs);
            break;
          case 'GetTransactionByHash':
            functionResponse = await GetTransactionByHash(parsedArgs);
            break;
          case 'GetBlocksByNumber':
            functionResponse = await GetBlocksByNumber(parsedArgs);
            break;
          case 'GetTransactionStatus':
            functionResponse = await GetTransactionStatus(parsedArgs);
            break;
          case 'WrapToken':
            functionResponse = await WrapToken(parsedArgs);
            break;
          case 'SwapToken':
            functionResponse = await SwapToken(parsedArgs);
            break;
          default:
            throw new Error(`Function ${name} not implemented.`);
        }

        console.log(`Function response: ${JSON.stringify(functionResponse)}`);

        const secondResponse = await openai.chat.completions.create({
          model: 'gpt-4', // Update this to the correct model name
          messages: [
            { role: 'user', content: prompt },
            choice.message,
            { role: 'function', name, content: JSON.stringify(functionResponse) }
          ],
          temperature: 0.7,
        });

        const aiMessage = secondResponse.choices[0].message.content?.trim() || 'No response from AI.';
        await redisClient.setEx(cacheKey, 3600, aiMessage);
        res.json({ message: aiMessage });
      } else {
        const aiMessage = choice.message.content?.trim() || 'No response from AI.';
        await redisClient.setEx(cacheKey, 3600, aiMessage);
        res.json({ message: aiMessage });
      }
    } catch (error: unknown) {
      let errorMessage = 'Failed to generate AI response.';

      if (axios.isAxiosError(error)) {
        if (error.response && error.response.data) {
          console.error('OpenAI API Error Response:', error.response.data);
          errorMessage = (error.response.data as any).error?.message || errorMessage;
        } else {
          console.error('OpenAI API Axios Error:', error.message);
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        console.error('General Error:', error.message);
        errorMessage = error.message;
      } else {
        console.error('Unknown Error:', error);
        errorMessage = String(error);
      }

      res.status(500).json({ error: errorMessage });
    }
  }
);

// Function Implementations

async function SendTransaction(args: { to: string; amount: number; symbol: string }) {
  const { to, amount, symbol } = args;
  try {
    const transactionId = 'unique_transaction_id';
    const token = 'unique_token';
    const magicLink = `http://localhost:5173/sign-transaction/${transactionId}?token=${token}`;

    return {
      status: 'Success',
      action: 'SendTransaction',
      message: 'Signature URL created successfully. Please sign the transaction on this link.',
      data: {
        magicLink: magicLink
      }
    };
  } catch (error: any) {
    console.error('Error in SendTransaction:', error.message);
    return { error: 'Failed to send transaction.' };
  }
}

async function GetBalance(args: { walletAddresses: string[] }) {
  const { walletAddresses } = args;
  try {
    const addresses = walletAddresses.join(',');
    const url = `${process.env.CRONOS_API_URL}?module=account&action=balancemulti&address=${addresses}`;

    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.CRONOS_API_KEY
      }
    });

    const data = response.data;

    if (data.status !== '1') {
      throw new Error(data.message || 'Failed to fetch balances.');
    }

    return {
      status: 'Success',
      action: 'GetBalance',
      message: 'Balances fetched successfully.',
      data: {
        balances: data.result.map((item: any) => ({
          address: item.account,
          balanceWei: item.balance,
          balanceEth: ethers.formatEther(item.balance), // Updated ethers function call
          balanceVUsd: parseFloat(item.balance) * 2 // Placeholder conversion rate
        }))
      }
    };
  } catch (error: any) {
    console.error('Error in GetBalance:', error.message);
    return { error: 'Failed to fetch balances.' };
  }
}

async function GetLatestBlock(args: {}) {
  try {
    const url = `${process.env.CRONOS_API_URL}?module=block&action=eth_block_number`;

    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.CRONOS_API_KEY
      }
    });

    const data = response.data;

    if (data.status !== '1') {
      throw new Error(data.message || 'Failed to fetch latest block.');
    }

    const latestBlockNumberHex = data.result;
    const latestBlockNumber = parseInt(latestBlockNumberHex, 16);

    const blockDetailsUrl = `${process.env.CRONOS_API_URL}?module=block&action=getblockreward&blockno=${latestBlockNumber}`;
    const blockResponse = await axios.get(blockDetailsUrl, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.CRONOS_API_KEY
      }
    });

    const blockData = blockResponse.data;

    if (blockData.status !== '1') {
      throw new Error(blockData.message || 'Failed to fetch block details.');
    }

    return {
      status: 'Success',
      action: 'GetLatestBlock',
      message: `Latest block height: ${latestBlockNumber}`,
      data: {
        blockHeight: latestBlockNumber,
        timestamp: new Date(parseInt(blockData.result.timeStamp, 16) * 1000).toISOString()
      }
    };
  } catch (error: any) {
    console.error('Error in GetLatestBlock:', error.message);
    return { error: 'Failed to fetch the latest block from Cronos Chain.' };
  }
}

async function GetTransactionsByAddress(args: { address: string; session: string; limit: number }) {
  const { address, session, limit } = args;
  try {
    const url = `${process.env.CRONOS_API_URL}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=asc`;

    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.CRONOS_API_KEY
      }
    });

    const data = response.data;

    if (data.status !== '1') {
      throw new Error(data.message || 'Failed to fetch transactions.');
    }

    return {
      status: 'Success',
      action: 'GetTransactionsByAddress',
      message: `Retrieved ${limit} transactions for ${address}`,
      data: {
        transactions: data.result,
        pagination: {
          nextPage: 2,
          hasMore: data.result.length === limit
        }
      }
    };
  } catch (error: any) {
    console.error('Error in GetTransactionsByAddress:', error.message);
    return { error: 'Failed to fetch transactions.' };
  }
}

async function GetContractABI(args: { address: string }) {
  const { address } = args;
  try {
    const url = `${process.env.CRONOS_API_URL}?module=contract&action=getabi&address=${address}`;

    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.CRONOS_API_KEY
      }
    });

    const data = response.data;

    if (data.status !== '1') {
      throw new Error(data.message || 'Failed to fetch contract ABI.');
    }

    return {
      status: 'Success',
      action: 'GetContractABI',
      message: `Fetched ABI for contract at ${address}`,
      data: {
        abi: JSON.parse(data.result)
      }
    };
  } catch (error: any) {
    console.error('Error in GetContractABI:', error.message);
    return { error: 'Failed to fetch contract ABI.' };
  }
}

async function GetTransactionByHash(args: { txHash: string }) {
  const { txHash } = args;
  try {
    const url = `${process.env.CRONOS_API_URL}?module=transaction&action=gettxinfo&txhash=${txHash}`;

    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.CRONOS_API_KEY
      }
    });

    const data = response.data;

    if (data.status !== '1') {
      throw new Error(data.message || 'Failed to fetch transaction details.');
    }

    return {
      status: 'Success',
      action: 'GetTransactionByHash',
      message: `Retrieved details for transaction ${txHash}`,
      data: {
        transaction: data.result
      }
    };
  } catch (error: any) {
    console.error('Error in GetTransactionByHash:', error.message);
    return { error: 'Failed to fetch transaction details.' };
  }
}

async function GetBlocksByNumber(args: { blockNumbers: string[]; txDetail: boolean }) {
  const { blockNumbers, txDetail } = args;
  try {
    const processedBlockNumbers = blockNumbers.map(block => block.toLowerCase() === 'latest' ? 'latest' : block);

    const url = `${process.env.CRONOS_API_URL}?module=block&action=getblockreward&blockno=${processedBlockNumbers[0]}`;

    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.CRONOS_API_KEY
      }
    });

    const data = response.data;

    if (data.status !== '1') {
      throw new Error(data.message || 'Failed to fetch block details.');
    }

    return {
      status: 'Success',
      action: 'GetBlocksByNumber',
      message: 'Retrieved information for blocks',
      data: {
        blocks: data.result
      }
    };
  } catch (error: any) {
    console.error('Error in GetBlocksByNumber:', error.message);
    return { error: 'Failed to fetch block details.' };
  }
}

async function GetTransactionStatus(args: { txHash: string }) {
  const { txHash } = args;
  try {
    const url = `${process.env.CRONOS_API_URL}?module=transaction&action=getstatus&txhash=${txHash}`;

    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.CRONOS_API_KEY
      }
    });

    const data = response.data;

    if (data.status !== '1') {
      throw new Error(data.message || 'Failed to fetch transaction status.');
    }

    return {
      status: 'Success',
      action: 'GetTransactionStatus',
      message: `Transaction status: ${data.result.status}`,
      data: {
        status: data.result.status
      }
    };
  } catch (error: any) {
    console.error('Error in GetTransactionStatus:', error.message);
    return { error: 'Failed to fetch transaction status.' };
  }
}
async function WrapToken(args: { amount: number }) {
  const { amount } = args;
  try {
    // Implement the logic to wrap zkCRO tokens
    // This might involve interacting with Cronos API or your own backend services

    // Example: Creating a wrap transaction (placeholder logic)
    const transactionId = 'unique_wrap_transaction_id'; // Replace with actual transaction ID
    const token = 'unique_wrap_token'; // Replace with actual token

    // Generate Magic Link
    const magicLink = `http://localhost:5173/sign-wrap-token/${transactionId}?token=${token}`;

    return {
      status: 'Success',
      action: 'WrapToken',
      message: 'Signature URL created successfully. Please sign the transaction on this link.',
      data: {
        magicLink: magicLink
      }
    };
  } catch (error: any) {
    console.error('Error in WrapToken:', error.message);
    return { error: 'Failed to wrap tokens.' };
  }
}

async function SwapToken(args: { amount: number }) {
  const { amount } = args;
  try {
    // Implement the logic to swap tokens
    // This might involve interacting with Cronos API or your own backend services

    // Example: Creating a swap transaction (placeholder logic)
    const transactionId = 'unique_swap_transaction_id'; // Replace with actual transaction ID
    const token = 'unique_swap_token'; // Replace with actual token

    // Generate Magic Link
    const magicLink = `http://localhost:5173/sign-swap-token/${transactionId}?token=${token}`;

    return {
      status: 'Success',
      action: 'SwapToken',
      message: 'Signature URL created successfully. Please sign the transaction on this link.',
      data: {
        magicLink: magicLink
      }
    };
  } catch (error: any) {
    console.error('Error in SwapToken:', error.message);
    return { error: 'Failed to swap tokens.' };
  }
}

export default router;