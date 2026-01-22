import React from 'react';
import WordGame from './WordGame'; 
import './App.css'; 

function App() {
  return (
    <div className="App">
      <h1 style={{ textAlign: 'center', color: '#8bc34a' }}>
        Word Finder Game
      </h1>
      
      {/* عرض اللعبة */}
      <WordGame />
    </div>
  );
}

export default App;