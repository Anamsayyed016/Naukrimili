import React, { useState } from "react";

interface Candidate {
  id: string;
  name: string;
  role: string;
  stage: string;
  experience: string;
  avatar: string;
}

interface PipelineStage {
  id: string;
  name: string;
  candidates: Candidate[];
}

export default function CandidatePipeline() {
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

  const handleDragStart = (e: React.DragEvent, candidateId: string, fromStage: string) => {
    e.dataTransfer.setData("candidateId", candidateId);
    e.dataTransfer.setData("fromStage", fromStage);
  };

  const handleDrop = (e: React.DragEvent, toStage: string) => {
    e.preventDefault();
    const candidateId = e.dataTransfer.getData("candidateId");
    const fromStage = e.dataTransfer.getData("fromStage");

    if (fromStage !== toStage) {
      setStages(prevStages => {
        const newStages = [...prevStages];
        const fromStageIndex = newStages.findIndex(s => s.id === fromStage);
        const toStageIndex = newStages.findIndex(s => s.id === toStage);
        
        const candidateIndex = newStages[fromStageIndex].candidates.findIndex(c => c.id === candidateId);
        const [candidate] = newStages[fromStageIndex].candidates.splice(candidateIndex, 1);
        
        newStages[toStageIndex].candidates.push({ ...candidate, stage: toStage });
        return newStages;
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="p-6 bg-gray-50">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Recruitment Pipeline</h2>
      <div className="grid grid-cols-4 gap-4">
        {stages.map(stage => (
          <div
            key={stage.id}
            className="bg-white p-4 rounded-lg shadow"
            onDrop={(e) => handleDrop(e, stage.id)}
            onDragOver={handleDragOver}
          >
            <h3 className="font-semibold text-lg mb-4 text-gray-700">
              {stage.name} ({stage.candidates.length})
            </h3>
            <div className="space-y-3">
              {stage.candidates.map(candidate => (
                <div
                  key={candidate.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, candidate.id, stage.id)}
                  className="bg-white border border-gray-200 p-3 rounded-md shadow-sm hover:shadow cursor-move"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={candidate.avatar}
                      alt={candidate.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <h4 className="font-medium text-gray-800">{candidate.name}</h4>
                      <p className="text-sm text-gray-600">{candidate.role}</p>
                      <p className="text-xs text-gray-500">{candidate.experience}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 