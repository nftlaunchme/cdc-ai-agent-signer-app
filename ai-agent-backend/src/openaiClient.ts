// src/openaiClient.ts

import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Validate that the API key is set
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not defined in environment variables.');
}

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: apiKey,
  // Optionally, specify the organization and project if needed
  // organization: 'org-your-organization-id',
  // project: 'your-project-id',
});

export default openai;
