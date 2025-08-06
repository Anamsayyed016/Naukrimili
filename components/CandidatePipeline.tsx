'use client';
import React, { useState, useEffect } from "react";
import Image from 'next/image';
import { toast } from "sonner";
import { useCandidates } from "@/context/CandidateContext";
import type { ICandidate } from "@/types/candidate";

interface PipelineStage {
  id: ICandidate['status'];
  name: string;
  candidates: ICandidate[];
  limit?: number;
}

const CandidatePipeline: React.FC = () => {
  const { candidates, loading, error, refreshCandidates, updateCandidateStatus } = useCandidates();
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<{[key: string]: boolean}>({});
  
  const [stages] = useState<PipelineStage[]>([
    {
      id: "new",
      name: "New Applications",
      candidates: []
    },
    {
      id: "screening",
      name: "Under Review",
      candidates: []
    },
    {
      id: "interview",
      name: "Interview Stage",
      candidates: []
    },
    {
      id: "offer",
      name: "Offer Stage",
      candidates: []
    },
    {
      id: "hired",
      name: "Hired",
      candidates: []
    },
    {
      id: "rejected",
      name: "Rejected",
      candidates: []
    }
  ]);

  useEffect(() => {
    refreshCandidates();
  }, [refreshCandidates]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, candidateId: string, fromStage: ICandidate['status']): void => {
    try {
      e.dataTransfer.setData("application/json", JSON.stringify({
        candidateId,
        fromStage,
      }));
      setIsDragging(true);
    } catch (err) {
      toast.error("Failed to start drag operation");
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, toStage: ICandidate['status']): Promise<void> => {
    e.preventDefault();
    setIsDragging(false);
    
    try {
      const data = e.dataTransfer.getData("application/json");
      if (!data) {
        throw new Error("Missing drag data");
      }

      const { candidateId, fromStage } = JSON.parse(data) as {
        candidateId: string;
        fromStage: ICandidate['status'];
      };

      if (fromStage !== toStage) {
        setStatusUpdateLoading(prev => ({ ...prev, [candidateId]: true }));
        const loadingToast = toast.loading('Updating candidate status...');
        
        try {
          // Note: Optimistic update would require setCandidates from context
          // For now, we'll rely on the refresh after successful update

          await updateCandidateStatus(candidateId, toStage);
          toast.success('Candidate status updated successfully', {
            id: loadingToast,
          });
        } catch (error) {
          // Revert optimistic update on error
          await refreshCandidates();
          toast.error(error instanceof Error ? error.message : 'Failed to update candidate status', {
            id: loadingToast,
          });
          throw error; // Re-throw to be caught by the outer catch block
        } finally {
          setStatusUpdateLoading(prev => ({ ...prev, [candidateId]: false }));
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to move candidate');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
  };

  const stageCandidates = (stage: PipelineStage['id']) => {
    return candidates.filter(candidate => candidate.status === stage);
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

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {stages.map((stage) => (
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
                    {stageCandidates(stage.id).length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[150px]">
                  {stageCandidates(stage.id).map((candidate) => (
                    <div
                      key={candidate.email}
                      draggable
                      onDragStart={(e) => handleDragStart(e, candidate.email, stage.id)}
                      onDragEnd={handleDragEnd}
                      className={`group bg-white border border-gray-200 p-3 rounded-md 
                        hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-move
                        ${statusUpdateLoading[candidate.email] ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={candidate.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}`}
                          alt={candidate.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}`;
                          }}
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">
                            {candidate.name}
                          </h4>
                          <p className="text-sm text-gray-600">{candidate.currentPosition || 'Not specified'}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {candidate.experience && <span>{candidate.experience} years</span>}
                            {candidate.updatedAt && (
                              <>
                                <span>•</span>
                                <span>Updated {new Date(candidate.updatedAt).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {stageCandidates(stage.id).length === 0 && (
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

export default CandidatePipeline;