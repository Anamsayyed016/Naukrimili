import React from 'react';

interface CircularProgressProps {
  value: number;
  maxValue?: number;
  className?: string;
  strokeWidth?: number;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  maxValue = 100,
  className = '',
  strokeWidth = 4
}) => {
  const normalizedValue = (value / maxValue) * 100;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  return (
    <div className={`relative ${className}`}>
      <svg
        className="transform -rotate-90"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="opacity-10"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
