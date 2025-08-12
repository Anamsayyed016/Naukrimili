import React from 'react';

export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Job Details</h1>
      <p>Job ID: {id}</p>
    </div>
  );
}

