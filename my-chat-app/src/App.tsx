// src/App.tsx

import React from 'react';
import Chat from './components/Chat';

const App: React.FC = () => {
  return (
    <div className="App">
      <h1>My Chat App</h1>
      <Chat />
    </div>
  );
};

export default App;
