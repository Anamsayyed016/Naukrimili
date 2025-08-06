import { DataTable } from "@/components/ui/DataTable";

export function UserManagementTable() {
  const users = [
    { id: 1, name: "John Doe", role: "job-seeker", status: "active" },
    { id: 2, name: "Acme Corp", role: "company", status: "pending" },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-red-700 mb-4">User Management</h2>
      <DataTable
        data={users}
        columns={[
          { key: "name", header: "Name" },
          { key: "role", header: "Role" },
          { key: "status", header: "Status" },
        ]}
        role="admin"
      />
      <div className="mt-4 space-x-2">
        <button className="bg-red-600 text-white px-4 py-2 rounded">
          Approve All
        </button>
        <button className="bg-red-800 text-white px-4 py-2 rounded">
          Export Data
        </button>
      </div>
    </div>)} 