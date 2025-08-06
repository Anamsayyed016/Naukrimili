import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./table";

// Map roles to Tailwind color names
const roleColorMap = {
  "job-seeker": "blue",
  company: "green",
  admin: "red",
} as const;

type Role = keyof typeof roleColorMap;

type DataTableProps<T> = {
  data: T[];
  columns: { key: keyof T; header: string }[];
  role: Role};

export function DataTable<T>({ data, columns, role }: DataTableProps<T>) {
  const color = roleColorMap[role];
  return (
    <div className={`overflow-x-auto rounded-lg border border-${color}-200`}>
      <Table>
        <TableHeader className={`bg-${color}-100`}>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={String(col.key)} className="px-4 py-2 text-left">
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, idx) => (
            <TableRow key={idx} className="hover:bg-gray-50">
              {columns.map((col) => (
                <TableCell key={String(col.key)} className="px-4 py-2">
                  {String(item[col.key])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>)} 