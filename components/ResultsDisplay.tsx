
import React from 'react';
import { FinancialData, GroundingSource } from '../types';
import { PriceIcon, FCFIcon, WACCIcon, LinkIcon } from './Icon';

interface ResultsDisplayProps {
  ticker: string;
  data: FinancialData;
  growthRate: number;
  sources: GroundingSource[];
  onDataChange: (field: keyof FinancialData, value: number) => void;
}

const EditableStatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  field: keyof FinancialData;
  onChange: (field: keyof FinancialData, value: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
}> = ({ icon, label, value, field, onChange, prefix, suffix, step = 0.01 }) => (
    <div className="bg-gray-800/50 p-4 rounded-lg flex flex-col gap-2 border border-gray-700 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500">
        <div className="flex items-center gap-3">
            <div className="text-blue-400">{icon}</div>
            <p className="text-sm font-semibold text-gray-300">{label}</p>
        </div>
        <div className="relative flex items-center bg-gray-900 border border-gray-600 rounded-md">
            {prefix && <span className="absolute left-3 inset-y-0 flex items-center text-md text-gray-400 pointer-events-none">{prefix}</span>}
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(field, parseFloat(e.target.value) || 0)}
                step={step}
                className={`w-full bg-transparent p-2 text-xl font-semibold text-white focus:outline-none ${prefix ? 'pl-14' : 'pl-3'} ${suffix ? 'pr-8' : 'pr-3'}`}
                aria-label={label}
            />
            {suffix && <span className="absolute right-3 inset-y-0 flex items-center text-lg text-gray-400 pointer-events-none">{suffix}</span>}
        </div>
    </div>
);


const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ ticker, data, growthRate, sources, onDataChange }) => {
  const growthPercentage = (growthRate * 100).toFixed(2);
  const growthColorClass = growthRate >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-2xl space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Implicit Growth Rate for {ticker}</h2>
        <p className={`text-5xl font-bold my-3 ${growthColorClass}`}>{growthPercentage}%</p>
        <p className="text-gray-400 text-sm">This is the market-implied long-term growth rate.</p>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-300 border-b border-gray-600 pb-2">Adjust Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <EditableStatCard
                icon={<PriceIcon />}
                label="Stock Price"
                value={data.stockPrice}
                field="stockPrice"
                onChange={onDataChange}
                prefix={data.currency}
                step={0.01}
            />
            <EditableStatCard
                icon={<FCFIcon />}
                label="FCF per Share"
                value={data.fcfPerShare}
                field="fcfPerShare"
                onChange={onDataChange}
                prefix={data.currency}
                step={0.01}
            />
            <EditableStatCard
                icon={<WACCIcon />}
                label="WACC"
                value={data.wacc}
                field="wacc"
                onChange={onDataChange}
                suffix="%"
                step={0.1}
            />
        </div>
      </div>


      {sources.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-300 border-b border-gray-600 pb-2">Original Data Sources</h3>
          <ul className="space-y-2">
            {sources.map((source, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="text-gray-500 mt-1"><LinkIcon /></div>
                <a
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 hover:underline break-all"
                  title={source.title}
                >
                  {source.title || source.uri}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;