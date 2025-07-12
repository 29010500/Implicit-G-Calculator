import React, { useState, useCallback, useEffect } from 'react';
import { fetchFinancialData } from './services/geminiService';
import TickerInput from './components/TickerInput';
import ResultsDisplay from './components/ResultsDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import { FinancialData, GroundingSource } from './types';
import { LogoIcon } from './components/Icon';

const App: React.FC = () => {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [growthRate, setGrowthRate] = useState<number | null>(null);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [ticker, setTicker] = useState<string>('');

  const handleCalculate = useCallback(async (searchQuery: string) => {
    if (!searchQuery) {
      setError('Please enter a stock ticker or company name.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setFinancialData(null);
    setGrowthRate(null);
    setSources([]);
    setTicker(searchQuery);

    try {
      const { data, sources: apiSources } = await fetchFinancialData(searchQuery);
      
      if (data.stockPrice === undefined || data.fcfPerShare === undefined || data.wacc === undefined) {
        throw new Error("Missing critical financial data from the API response.");
      }
      
      setFinancialData(data);
      setSources(apiSources);

    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to fetch or process data: ${err.message}`);
      } else {
        setError('An unknown error occurred.');
      }
      setFinancialData(null);
      setGrowthRate(null);
      setSources([]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleDataChange = useCallback((field: keyof FinancialData, value: number) => {
    setFinancialData(prevData => {
        if (!prevData) return null;
        return { ...prevData, [field]: value };
    });
  }, []);

  useEffect(() => {
    if (financialData) {
        const { stockPrice, fcfPerShare, wacc } = financialData;
        
        if (stockPrice <= 0) {
            setGrowthRate(null); // Avoid division by zero and nonsensical results
            return;
        }

        // g = WACC - (FCF per Share / Price)
        const waccDecimal = wacc / 100;
        const calculatedGrowth = waccDecimal - (fcfPerShare / stockPrice);
        setGrowthRate(calculatedGrowth);
    }
  }, [financialData]);


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <LogoIcon />
            <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-blue-400 to-purple-500">
              Implicit Growth Calculator
            </h1>
          </div>
          <p className="text-gray-400 text-sm sm:text-base">
            Enter a stock ticker or company name to estimate its implicit growth rate.
          </p>
        </header>

        <main>
          <TickerInput onSubmit={handleCalculate} isLoading={isLoading} />

          <div className="mt-8">
            {isLoading && <LoadingSpinner />}
            {error && (
              <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-lg text-center">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            )}
            {financialData && growthRate !== null && (
              <ResultsDisplay
                ticker={ticker}
                data={financialData}
                growthRate={growthRate}
                sources={sources}
                onDataChange={handleDataChange}
              />
            )}
             {financialData && growthRate === null && financialData.stockPrice <= 0 && (
                <div className="bg-yellow-900/50 border border-yellow-600 text-yellow-200 px-4 py-3 rounded-lg text-center mt-4">
                    <p className="font-bold">Invalid Input</p>
                    <p>Stock Price must be greater than zero to calculate growth.</p>
                </div>
             )}
          </div>
        </main>
        
        <footer className="text-center mt-12 text-xs text-gray-500">
            <p>Calculations are based on the formula: g = WACC - (FCF per Share / Stock Price).</p>
            <p>Data is retrieved using Google's Gemini API with Search grounding and may not be 100% accurate. For informational purposes only.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;