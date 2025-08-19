"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Shape returned by /api/admin/users/moderation
export interface UserModerationItem {
  id: string;
  name: string;
  email: string;
  type: string; // e.g. "jobseeker" | "employer" | etc.
  status: "active" | "suspended" | "warning" | string;
  reportCount: number;
  lastActivity: string; // ISO date string
}

const STATUS_CLASS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
  warning: "bg-amber-100 text-amber-800",
};

const statusBadgeClass = (status: string) => STATUS_CLASS[status] || "bg-gray-100 text-gray-800";

const UserModerationTable: React.FC = () => {
  const [users, setUsers] = useState<UserModerationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users/moderation", { cache: "no-store" });
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
      const data: unknown = await res.json();
      if (Array.isArray(data)) setUsers(data as UserModerationItem[]); else setUsers([]);
    } catch (e: any) {
      setError(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleAction = async (userId: string, action: "suspend" | "activate" | "warn") => {
    setActionBusy((p) => ({ ...p, [userId]: true }));
    try {
      const res = await fetch(`/api/admin/users/${userId}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error(`Action failed (${res.status})`);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setActionBusy((p) => ({ ...p, [userId]: false }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">User Moderation</h2>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>Refresh</Button>
      </div>
      {error && (
        <div className="border border-red-300 bg-red-50 text-red-700 text-sm px-4 py-2 rounded">
          {error}
        </div>
      )}
      {loading ? (
        <div className="flex justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-800" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-sm text-muted-foreground">No users found.</div>
      ) : (
        <Table className="w-full text-sm">
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reports</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="w-[220px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const busy = !!actionBusy[u.id];
              return (
                <TableRow key={u.id} className="align-middle">
                  <TableCell>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell className="capitalize">{u.type}</TableCell>
                  <TableCell>
                    <Badge className={statusBadgeClass(u.status)}>{u.status}</Badge>
                  </TableCell>
                  <TableCell>{u.reportCount}</TableCell>
                  <TableCell>{new Date(u.lastActivity).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {u.status !== "suspended" && (
                        <Button size="sm" variant="destructive" disabled={busy} onClick={() => handleAction(u.id, "suspend")}>Suspend</Button>
                      )}
                      {u.status !== "active" && (
                        <Button size="sm" disabled={busy} onClick={() => handleAction(u.id, "activate")}>Activate</Button>
                      )}
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => handleAction(u.id, "warn")}>Warn</Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export { UserModerationTable };
export default UserModerationTable;
