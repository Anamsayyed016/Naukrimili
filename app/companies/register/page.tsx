"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Step titles
const steps = ["Company Info", "User Info", "Documents", "Review & Submit"];

export default function CompanyRegisterPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [company, setCompany] = useState({
    name: "",
    industry: "",
    size: "",
    location: "",
    website: "",
    description: "",
  });
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [documents, setDocuments] = useState<File[]>([]);

  // Validation helpers
  const validateStep = () => {
    if (step === 0) {
      return company.name && company.industry && company.size && company.location}
    if (step === 1) {
      return user.name && user.email && user.password}
    if (step === 2) {
      return documents.length > 0}
    return true};

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files))}
  };

  // Submit handler
  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      Object.entries(company).forEach(([k, v]) => formData.append(`company[${k}]`, v));
      Object.entries(user).forEach(([k, v]) => formData.append(`user[${k}]`, v));
      documents.forEach((file, i) => formData.append("documents", file));

      const res = await fetch("/api/companies/register", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Registration failed");
      setSuccess(true)} catch (err: Record<string, unknown>) {
      setError(err.message || "Registration failed")} finally {
      setLoading(false)}
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Registration Successful</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Check your email to verify your company account. Once approved by admin, you can start posting jobs.</p>
            <Button onClick={() => window.location.href = "/"}>Go Home</Button>
          </CardContent>
        </Card>
      </div>)}

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 py-8">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>Company Registration</CardTitle>
          <Progress value={((step + 1) / steps.length) * 100} className="mt-2" />
          <div className="mt-2 text-sm text-gray-400">Step {step + 1} of {steps.length}: {steps[step]}</div>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 text-red-500">{error}</div>}
          {step === 0 && (
            <div className="space-y-4">
              <Input placeholder="Company Name" value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })} />
              <Input placeholder="Industry" value={company.industry} onChange={e => setCompany({ ...company, industry: e.target.value })} />
              <Input placeholder="Company Size (e.g. 10-50)" value={company.size} onChange={e => setCompany({ ...company, size: e.target.value })} />
              <Input placeholder="Location" value={company.location} onChange={e => setCompany({ ...company, location: e.target.value })} />
              <Input placeholder="Website (optional)" value={company.website} onChange={e => setCompany({ ...company, website: e.target.value })} />
              <Input placeholder="Description (optional)" value={company.description} onChange={e => setCompany({ ...company, description: e.target.value })} />
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <Input placeholder="Your Name" value={user.name} onChange={e => setUser({ ...user, name: e.target.value })} />
              <Input placeholder="Email" type="email" value={user.email} onChange={e => setUser({ ...user, email: e.target.value })} />
              <Input placeholder="Password" type="password" value={user.password} onChange={e => setUser({ ...user, password: e.target.value })} />
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Upload Company Documents (PDF, images)</label>
              <Input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
              <div className="mt-2 space-y-1">
                {documents.map((file, i) => (
                  <div key={i} className="text-xs text-gray-500">{file.name}</div>
                ))}
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <div className="font-semibold mb-1">Company Info</div>
                <div className="text-sm text-gray-600">{company.name}, {company.industry}, {company.size}, {company.location}</div>
                {company.website && <div className="text-sm text-gray-600">Website: {company.website}</div>}
                {company.description && <div className="text-sm text-gray-600">{company.description}</div>}
              </div>
              <div>
                <div className="font-semibold mb-1">User Info</div>
                <div className="text-sm text-gray-600">{user.name}, {user.email}</div>
              </div>
              <div>
                <div className="font-semibold mb-1">Documents</div>
                <ul className="text-sm text-gray-600 list-disc ml-5">
                  {documents.map((file, i) => <li key={i}>{file.name}</li>)}
                </ul>
              </div>
            </div>
          )}
          <div className="flex justify-between mt-8">
            <Button variant="outline" disabled={step === 0 || loading} onClick={() => setStep(s => s - 1)}>Back</Button>
            {step < steps.length - 1 ? (
              <Button disabled={!validateStep() || loading} onClick={() => setStep(s => s + 1)}>Next</Button>
            ) : (
              <Button disabled={!validateStep() || loading} onClick={handleSubmit}>{loading ? "Submitting..." : "Submit"}</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>)} 