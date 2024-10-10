// src/blockchain.ts

import { ethers } from 'ethers';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const rpcUrl = process.env.CRONOS_RPC_URL;
const chainId = parseInt(process.env.CRONOS_CHAIN_ID || '25', 10);

if (!rpcUrl) {
  throw new Error('CRONOS_RPC_URL is not defined in environment variables.');
}

const provider = new ethers.JsonRpcProvider(rpcUrl);

export const getBalance = async (address: string): Promise<string> => {
  try {
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw new Error('Failed to fetch balance.');
  }
};

export const getLatestBlock = async (): Promise<{ number: number; timestamp: string; hash: string }> => {
  try {
    const block = await provider.getBlock('latest');
    if (!block) {
      throw new Error('Latest block not found.');
    }

    // Type assertion: Assuming block.hash is always a string when block is not null
    return {
      number: block.number,
      timestamp: new Date(block.timestamp * 1000).toISOString(),
      hash: block.hash as string, // Assert that block.hash is a string
    };
  } catch (error) {
    console.error('Error fetching latest block:', error);
    throw new Error('Failed to fetch latest block.');
  }
};

export const getTransactionsByAddress = async (address: string, limit: number = 5): Promise<any[]> => {
  try {
    const apiKey = process.env.EXPLORER_API_KEY;
    if (!apiKey) {
      throw new Error('EXPLORER_API_KEY is not defined in environment variables.');
    }

    const url = `https://api.cronoscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${apiKey}`;

    const response = await axios.get(url);

    if (response.data.status !== '1') {
      throw new Error(response.data.message || 'Failed to fetch transactions.');
    }

    return response.data.result;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw new Error('Failed to fetch transactions.');
  }
};

export const getContractABI = async (contractAddress: string): Promise<any> => {
  try {
    const apiKey = process.env.EXPLORER_API_KEY;
    if (!apiKey) {
      throw new Error('EXPLORER_API_KEY is not defined in environment variables.');
    }

    const url = `https://api.cronoscan.com/api?module=contract&action=getabi&address=${contractAddress}&apikey=${apiKey}`;

    const response = await axios.get(url);

    if (response.data.status !== '1') {
      throw new Error(response.data.message || 'Failed to fetch contract ABI.');
    }

    return JSON.parse(response.data.result);
  } catch (error) {
    console.error('Error fetching contract ABI:', error);
    throw new Error('Failed to fetch contract ABI.');
  }
};
