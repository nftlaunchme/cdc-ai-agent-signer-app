// src/components/Chat.tsx

import React, { useState, useEffect } from 'react';
import { message as AntMessage, Spin } from 'antd';
import './Chat.css';
import { ethers } from 'ethers';

interface Message {
  sender: 'user' | 'agent';
  text: string;
  magicLink?: string;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isServiceAvailable, setIsServiceAvailable] = useState(true);

  useEffect(() => {
    if (window.ethereum) {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);
    } else {
      AntMessage.error('Please install MetaMask!');
    }
  }, []);

  const connectWallet = async () => {
    if (provider) {
      try {
        await provider.send('eth_requestAccounts', []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAddress(address);
        setMessages(prevMessages => [
          ...prevMessages,
          { sender: 'agent', text: `Wallet connected: ${address}` },
        ]);
      } catch (error) {
        console.error('User rejected wallet connection:', error);
        AntMessage.error('Failed to connect wallet. Please try again.');
      }
    } else {
      AntMessage.error('Please install MetaMask!');
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages(prevMessages => [...prevMessages, { sender: 'user', text: input }]);
    setIsLoading(true);

    try {
      // Send prompt to your custom AI API
      const aiResponse = await fetch('/api/ai/query', { // Proxy handles /api
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });

      if (!aiResponse.ok) {
        throw new Error('Failed to generate AI response.');
      }

      const aiData = await aiResponse.json();
      const aiMessage = aiData.message;

      setMessages(prevMessages => [
        ...prevMessages,
        { sender: 'agent', text: aiMessage },
      ]);

      // Handle specific actions if your AI response includes actionable commands
      // For example, parsing the AI message to determine if it includes a blockchain action
    } catch (error: any) {
      console.error('Error in sendMessage:', error);
      let errorMessage = 'Unable to connect to the AI service. Please try again later.';

      if (error.message.includes('Failed to generate AI response')) {
        errorMessage = 'The AI service encountered an error. Please try again later.';
      }

      setMessages(prevMessages => [
        ...prevMessages,
        { sender: 'agent', text: errorMessage },
      ]);
      AntMessage.error(errorMessage);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <div className="chat-container">
      {!address && (
        <div className="wallet-connect">
          <button onClick={connectWallet}>Connect Wallet</button>
        </div>
      )}
      <div className="chat-messages">
        {messages.map((message, idx) => (
          <div key={idx} className={`chat-message ${message.sender}`}>
            <div className="chat-message-content">{message.text}</div>
          </div>
        ))}
      </div>
      {address && (
        <div className="chat-input">
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !isLoading) {
                sendMessage();
              }
            }}
            disabled={isLoading}
          />
          <button onClick={sendMessage} disabled={isLoading}>
            {isLoading ? <Spin /> : 'Send'}
          </button>
        </div>
      )}
      {!isServiceAvailable && (
        <div className="service-status">
          AI service is currently unavailable. Responses are limited.
        </div>
      )}
    </div>
  );
};

export default Chat;
