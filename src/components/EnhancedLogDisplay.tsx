import React from 'react';

interface LogEntry {
  message: string;
  matches?: number;
}

interface EnhancedLogDisplayProps {
  logs: LogEntry[];
}

const EnhancedLogDisplay: React.FC<EnhancedLogDisplayProps> = ({ logs }) => {
  const getLogColor = (matches: number | undefined) => {
    switch (matches) {
      case 13:
        return 'text-yellow-500';
      case 14:
        return 'text-orange-500';
      case 15:
        return 'text-green-500';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-2">Logs em Tempo Real</h3>
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg h-64 overflow-y-auto">
        {logs.map((log, index) => (
          <p key={index} className={`${getLogColor(log.matches)}`}>
            {log.message}
          </p>
        ))}
      </div>
    </div>
  );
};

export default EnhancedLogDisplay;