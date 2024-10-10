// src/types/global.d.ts

interface EthereumProvider {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: any[] | object }) => Promise<any>;
    on: (eventName: string, callback: (...args: any[]) => void) => void;
    removeListener: (eventName: string, callback: (...args: any[]) => void) => void;
    // Add any additional properties or methods you plan to use
  }
  
  interface Window {
    ethereum?: EthereumProvider;
  }
  