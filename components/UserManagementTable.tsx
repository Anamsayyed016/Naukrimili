"use client";
import React from 'react';

interface SimpleUser { id: number; name: string; role: string; status: string }

export function UserManagementTable() {
  const users: SimpleUser[] = [
    { id: 1, name: 'John Doe', role: 'job-seeker', status: 'active' },
    { id: 2, name: 'Acme Corp', role: 'company', status: 'pending' },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-red-700 mb-4">User Management</h2>
      <table className="w-full text-left border border-gray-200 mb-4">
        <thead>
          <tr className="bg-gray-50">
            <th className="p-2 border-b">Name</th>
            <th className="p-2 border-b">Role</th>
            <th className="p-2 border-b">Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="odd:bg-white even:bg-gray-50">
              <td className="p-2 border-b">{u.name}</td>
              <td className="p-2 border-b">{u.role}</td>
              <td className="p-2 border-b">{u.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 space-x-2">
        <button className="bg-red-600 text-white px-4 py-2 rounded">Approve All</button>
        <button className="bg-red-800 text-white px-4 py-2 rounded">Export Data</button>
      </div>
    </div>
  );
}