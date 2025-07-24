import React, { useState } from 'react';
import Loader from './Loader';

const LoaderExample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Loader Examples</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg mb-2">Small Loader</h3>
          <Loader size="small" />
        </div>

        <div>
          <h3 className="text-lg mb-2">Medium Loader (Default)</h3>
          <Loader />
        </div>

        <div>
          <h3 className="text-lg mb-2">Large Loader</h3>
          <Loader size="large" />
        </div>

        <div>
          <h3 className="text-lg mb-2">Full Screen Loader (Click to see)</h3>
          <button
            onClick={simulateLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Show Full Screen Loader
          </button>
          {isLoading && <Loader fullScreen />}
        </div>
      </div>
    </div>
  );
};

export default LoaderExample; 