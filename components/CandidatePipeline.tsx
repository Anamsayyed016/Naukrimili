'use client';

import React, { useState, useEffect } from "react";
import { toast } from "sonner";

// Ensure strict type checking
declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // extend if needed
  }
}

interface Candidate {
  id: string;
  name: string;
  role: string;
  stage: string;
  experience: string;
  avatar: string;
  status?: 'active' | 'inactive';
  lastUpdated?: string;
}

interface PipelineStage {
  id: string;
  name: string;
  candidates: Candidate[];
  limit?: number;
}

const CandidatePipeline: React.FC = () => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const [stages, setStages] = useState<PipelineStage[]>([
    {
      id: "new",
      name: "New Applications",
      candidates: [
        {
          id: "1",
          name: "John Doe",
          role: "Frontend Developer",
          stage: "new",
          experience: "3 years",
          avatar: "https://ui-avatars.com/api/?name=John+Doe"
        }
      ]
    },
    {
      id: "screening",
      name: "Screening",
      candidates: []
    },
    {
      id: "interview",
      name: "Interview",
      candidates: []
    },
    {
      id: "offer",
      name: "Offer",
      candidates: []
    }
  ]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, candidateId: string, fromStage: string): void => {
    try {
      e.dataTransfer.setData("candidateId", candidateId);
      e.dataTransfer.setData("fromStage", fromStage);
      setIsDragging(true);
      setError(null);
    } catch (err) {
      setError("Failed to start drag operation");
      console.error(err);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, toStage: string): void => {
    e.preventDefault();
    setIsDragging(false);
    
    try {
      const candidateId = e.dataTransfer.getData("candidateId");
      const fromStage = e.dataTransfer.getData("fromStage");
      
      if (!candidateId || !fromStage) {
        throw new Error("Missing drag data");

    if (fromStage !== toStage) {
      try {
        setStages((prevStages: PipelineStage[]) => {
          const newStages = [...prevStages];
          const fromStageIndex = newStages.findIndex(s => s.id === fromStage);
          const toStageIndex = newStages.findIndex(s => s.id === toStage);
          
          if (fromStageIndex === -1 || toStageIndex === -1) {
            throw new Error("Invalid stage");
        
        const candidateIndex = newStages[fromStageIndex].candidates.findIndex(c => c.id === candidateId);
        const [candidate] = newStages[fromStageIndex].candidates.splice(candidateIndex, 1);
        
        newStages[toStageIndex].candidates.push({ 
          ...candidate, 
          stage: toStage,
          lastUpdated: new Date().toLocaleDateString()
        });
        
        toast.success(`Moved ${candidate.name} to ${toStage}`);
        return newStages;
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to move candidate";
    toast.error(message);
    setError(message);
  }
};

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
  };

  const handleDragEnd = (): void => {
    setIsDragging(false);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Recruitment Pipeline</h2>
          <div className="flex gap-2">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-md">
                {error}
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stages.map((stage: PipelineStage) => (
              <div
                key={stage.id}
                className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 ${
                  isDragging ? 'ring-2 ring-blue-100' : ''
                }`}
                onDrop={(e) => handleDrop(e, stage.id)}
                onDragOver={handleDragOver}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-700">{stage.name}</h3>
                  <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {stage.candidates.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[150px]">
                  {stage.candidates.map((candidate: Candidate) => (
                    <div
                      key={candidate.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, candidate.id, stage.id)}
                      className={`group bg-white border border-gray-200 p-3 rounded-md 
                        ${candidate.status === 'inactive' ? 'opacity-60' : ''}
                        hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-move`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={candidate.avatar}
                          alt={candidate.name}
                          className="w-10 h-10 rounded-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              candidate.name
                            )}&size=40`;
                          }}
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 flex items-center gap-2">
                            {candidate.name}
                            {candidate.status === 'inactive' && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                Inactive
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">{candidate.role}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{candidate.experience}</span>
                            {candidate.lastUpdated && (
                              <>
                                <span>•</span>
                                <span>Updated {candidate.lastUpdated}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {stage.candidates.length === 0 && (
                    <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-200 rounded-lg">
                      <p className="text-gray-400 text-sm">Drop candidates here</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 