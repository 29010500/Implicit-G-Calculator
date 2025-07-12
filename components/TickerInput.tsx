import React, { useState } from 'react';

interface TickerInputProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
}

const TickerInput: React.FC<TickerInputProps> = ({ onSubmit, isLoading }) => {
  const [query, setQuery] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter Ticker or Company Name (e.g., GOOGL, Apple Inc.)"
        className="flex-grow bg-gray-800 border border-gray-600 rounded-md px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
        disabled={isLoading}
        aria-label="Stock Ticker or Company Name Input"
      />
      <button
        type="submit"
        disabled={isLoading || !query}
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-md hover:from-blue-600 hover:to-purple-700 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
      >
        {isLoading ? 'Calculating...' : 'Calculate'}
      </button>
    </form>
  );
};

export default TickerInput;