import React, { useState } from "react";

export default function JobPostForm() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    salary: "",
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-green-700 mb-6">Post New Job</h2>
      <form className="space-y-4">
        <div>
          <label className="block text-green-600">Job Title</label>
          <input
            type="text"
            className="w-full p-2 border border-green-300 rounded"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-green-600">Description</label>
          <textarea
            className="w-full p-2 border border-green-300 rounded"
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>
        <button
          type="button"
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          Publish Job
        </button>
      </form>
    </div>
  );
} 