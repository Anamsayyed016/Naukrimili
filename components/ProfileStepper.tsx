import React, { useState, useRef } from "react";
import Image from 'next/image';
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

// Step 1: Personal Info Schema
const personalInfoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").regex(/^[a-zA-Z\s]+$/, "No special characters allowed"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Invalid phone number"), // Add country code validation in UI
  location: z.string().min(2, "Location required"),
});

// Step 2: Professional Details Schema
const professionalDetailsSchema = z.object({
  resumeHeadline: z.string().min(1, "Headline required").max(100, "Max 100 characters"),
  keySkills: z.array(z.string()).min(3, "At least 3 skills required"),
  experience: z.enum(["fresher", "1-3", "4+"]),
  currentCompany: z.string().optional().refine((val) => {
    // This will be validated separately in the form
    return true;
  }, { message: "Current company required if experienced" }),
});

// Step 3: Photo/Portfolio Schema
const photoPortfolioSchema = z.object({
  profilePhoto: z
    .any()
    .nullable()
    .refine(
      (file) => !file || (file instanceof File && file.size <= 5 * 1024 * 1024), 
      "Max file size is 5MB"
    )
    .refine(
      (file) => !file || (file instanceof File && file.type.startsWith("image/")), 
      "Must be an image file"
    )
    .refine(
      async (file) => {
        if (!file || !(file instanceof File)) return true;
        try {
          return new Promise<boolean>((resolve) => {
            const img = new window.Image();
            img.onload = function () {
              const isSquare = Math.abs(img.width - img.height) <= 2; // Allow 2px difference
              URL.revokeObjectURL(img.src); // Clean up
              resolve(isSquare);
            };
            img.onerror = function () {
              URL.revokeObjectURL(img.src); // Clean up
              resolve(false);
            };
            img.src = URL.createObjectURL(file);
          });
        } catch (error) {
          return false;
        }
      },
      { message: "Image must be square (1:1 aspect ratio)", path: ["profilePhoto"] }
    ),
  portfolioLink: z
    .string()
    .url("Invalid URL")
    .refine(
      (val) =>
        !val ||
        /github\.com|behance\.net|dribbble\.com/.test(val),
      "Portfolio must be a GitHub, Behance, or Dribbble link"
    )
    .optional(),
});

// Step 4: Multilingual Schema
const languageOptions = [
  "English",
  "Hindi",
  "Spanish",
  "French",
  "German",
  "Mandarin",
  "Arabic",
  "Bengali",
  "Russian",
  "Portuguese",
  "Other",
];
const proficiencyOptions = ["Basic", "Conversational", "Fluent", "Native"];

const multilingualSchema = z.object({
  languages: z
    .array(
      z.object({
        language: z.string().min(1, "Language required"),
        proficiency: z.enum(["Basic", "Conversational", "Fluent", "Native"], { message: "Proficiency required" }),
      })
    )
    .optional(),
});

// Add review/confirmation step schema (no validation needed, just a placeholder)
const reviewSchema = z.object({});

const steps = [
  { label: "Personal Info", schema: personalInfoSchema },
  { label: "Professional Details", schema: professionalDetailsSchema },
  { label: "Photo/Portfolio", schema: photoPortfolioSchema },
  { label: "Multilingual", schema: multilingualSchema },
  { label: "Review", schema: reviewSchema },
];

export default function ProfileStepper({ defaultValues = {}, onComplete }: { defaultValues?: Record<string, unknown>, onComplete?: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(defaultValues);
  const methods = useForm({
    resolver: zodResolver(steps[currentStep].schema),
    defaultValues: formData,
    mode: "onChange",
  });

  const onSubmit = async (data: Record<string, unknown>) => {
    setFormData((prev: Record<string, unknown>) => ({ ...prev, ...data }));
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      // Final submit logic: update user profile in localStorage
      const token = localStorage.getItem('mock_token');
      if (token) {
        const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
        const decoded = JSON.parse(atob(token));
        const idx = users.findIndex((u: Record<string, unknown>) => u.email === decoded.email);
        if (idx !== -1) {
          users[idx] = { ...users[idx], ...formData, ...data };
          localStorage.setItem('mock_users', JSON.stringify(users));
        }
      }
      toast({ 
        title: 'Profile Completed!',
        description: 'Your profile is now complete. You can now access all job seeker features.'
      });
      if (onComplete) onComplete();
      else window.location.reload();
    }
  };

  // Key Skills chip input state (local, not in RHF)
  const [skillInput, setSkillInput] = useState("");
  const keySkills = methods.watch("keySkills") || [];

  const addSkill = () => {
    const val = skillInput.trim();
    if (val && !keySkills.includes(val)) {
      methods.setValue("keySkills", [...keySkills, val], { shouldValidate: true });
      setSkillInput("");
    }
  };
  const removeSkill = (skill: string) => {
    methods.setValue("keySkills", keySkills.filter((s: string) => s !== skill), { shouldValidate: true });
  };

  const experience = methods.watch("experience");

  // Profile photo preview
  const profilePhoto = methods.watch("profilePhoto");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (profilePhoto && profilePhoto instanceof File) {
      try {
        const url = URL.createObjectURL(profilePhoto);
        setPhotoPreview(url);
        setImageError(null);
        
        // Validate image dimensions
        const img = document.createElement('img');
        img.onload = () => {
          if (Math.abs(img.width - img.height) > 2) {
            setImageError("Image must be square (1:1 aspect ratio)");
            methods.setError("profilePhoto", { 
              type: "manual", 
              message: "Image must be square (1:1 aspect ratio)" 
            });
          }
          URL.revokeObjectURL(img.src);
        };
        img.onerror = () => {
          setImageError("Failed to load image");
          URL.revokeObjectURL(img.src);
        };
        img.src = url;

        return () => URL.revokeObjectURL(url);
      } catch (error) {
        setImageError("Failed to process image");
        setPhotoPreview(null);
      }
    } else {
      setPhotoPreview(null);
      setImageError(null);
    }
  }, [profilePhoto, methods]);

  // Multilingual step: manage language fields
  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: "languages",
  });

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
      {/* Stepper UI */}
      <div className="flex items-center mb-8">
        {steps.map((step, idx) => (
          <React.Fragment key={step.label}>
            <div className={`flex items-center ${idx === currentStep ? 'font-bold text-purple-600' : 'text-gray-400'}`}>{idx + 1}. {step.label}</div>
            {idx < steps.length - 1 && <div className="flex-1 h-0.5 bg-gray-200 mx-2" />}
          </React.Fragment>
        ))}
      </div>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input {...methods.register("name")}
                  id="name"
                  placeholder="Enter your full name"
                  aria-invalid={!!methods.formState.errors.name}
                  aria-describedby="name-error"
                />
                {methods.formState.errors.name && (
                  <div id="name-error" className="text-red-500 text-sm mt-1">{methods.formState.errors.name.message as string}</div>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input {...methods.register("email")}
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  aria-invalid={!!methods.formState.errors.email}
                  aria-describedby="email-error"
                />
                {methods.formState.errors.email && (
                  <div id="email-error" className="text-red-500 text-sm mt-1">{methods.formState.errors.email.message as string}</div>
                )}
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input {...methods.register("phone")}
                  id="phone"
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  aria-invalid={!!methods.formState.errors.phone}
                  aria-describedby="phone-error"
                />
                {methods.formState.errors.phone && (
                  <div id="phone-error" className="text-red-500 text-sm mt-1">{methods.formState.errors.phone.message as string}</div>
                )}
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input {...methods.register("location")}
                  id="location"
                  placeholder="City, State"
                  aria-invalid={!!methods.formState.errors.location}
                  aria-describedby="location-error"
                />
                {methods.formState.errors.location && (
                  <div id="location-error" className="text-red-500 text-sm mt-1">{methods.formState.errors.location.message as string}</div>
                )}
              </div>
            </div>
          )}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="resumeHeadline">Resume Headline</Label>
                <Textarea {...methods.register("resumeHeadline")}
                  id="resumeHeadline"
                  maxLength={100}
                  placeholder="e.g. Creative React Developer with 3+ years in AR design"
                  aria-invalid={!!methods.formState.errors.resumeHeadline}
                  aria-describedby="resumeHeadline-error"
                />
                <div className="text-xs text-gray-400 text-right">{methods.watch("resumeHeadline")?.length || 0}/100</div>
                {methods.formState.errors.resumeHeadline && (
                  <div id="resumeHeadline-error" className="text-red-500 text-sm mt-1">{methods.formState.errors.resumeHeadline.message as string}</div>
                )}
              </div>
              <div>
                <Label>Key Skills</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {keySkills.map((skill: string) => (
                    <span key={skill} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full flex items-center gap-1">
                      {skill}
                      <button type="button" className="ml-1 text-xs" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                    placeholder="Add a skill and press Enter"
                  />
                  <Button type="button" onClick={addSkill} disabled={!skillInput.trim()}>Add</Button>
                </div>
                {/* Placeholder for AI suggestions */}
                <div className="text-xs text-gray-400 mt-1">AI suggestions: AR Designer, React, ...</div>
                {methods.formState.errors.keySkills && (
                  <div className="text-red-500 text-sm mt-1">{methods.formState.errors.keySkills.message as string}</div>
                )}
              </div>
              {/* Profile Photo Upload */}
              <div className="space-y-4">
                <Label>Profile Photo</Label>
                <div className="flex items-start space-x-4">
                  <div className="relative w-32 h-32">
                    {photoPreview ? (
                      <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-purple-500">
                        <Image
                          src={photoPreview}
                          alt="Profile preview"
                          layout="fill"
                          objectFit="cover"
                          onError={() => {
                            setPhotoPreview(null);
                            setImageError("Failed to load image");
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            methods.setValue("profilePhoto", null);
                            setPhotoPreview(null);
                            setImageError(null);
                          }}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 m-1 hover:bg-red-600 transition-colors"
                          aria-label="Remove photo"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          methods.setValue("profilePhoto", file, { shouldValidate: true });
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      {photoPreview ? "Change Photo" : "Upload Photo"}
                    </Button>
                    <p className="text-xs text-gray-500">
                      Square image recommended, max 5MB
                    </p>
                    {imageError && (
                      <p className="text-red-500 text-sm">{imageError}</p>
                    )}
                    {methods.formState.errors.profilePhoto && (
                      <p className="text-red-500 text-sm">
                        {methods.formState.errors.profilePhoto.message as string}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="experience">Experience</Label>
                <select
                  {...methods.register("experience")}
                  id="experience"
                  className="w-full border rounded px-3 py-2"
                  aria-invalid={!!methods.formState.errors.experience}
                  aria-describedby="experience-error"
                  defaultValue=""
                >
                  <option value="" disabled>Select experience</option>
                  <option value="fresher">Fresher</option>
                  <option value="1-3">1-3 years</option>
                  <option value="4+">4+ years</option>
                </select>
                {methods.formState.errors.experience && (
                  <div id="experience-error" className="text-red-500 text-sm mt-1">{methods.formState.errors.experience.message as string}</div>
                )}
              </div>
              {experience && experience !== "fresher" && (
                <div>
                  <Label htmlFor="currentCompany">Current Company</Label>
                  <Input {...methods.register("currentCompany")}
                    id="currentCompany"
                    placeholder="Enter your current company"
                    aria-invalid={!!methods.formState.errors.currentCompany}
                    aria-describedby="currentCompany-error"
                  />
                  {methods.formState.errors.currentCompany && (
                    <div id="currentCompany-error" className="text-red-500 text-sm mt-1">{methods.formState.errors.currentCompany.message as string}</div>
                  )}
                </div>
              )}
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="profilePhoto">Profile Photo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border">
                    {photoPreview ? (
                      <Image 
                        src={photoPreview} 
                        alt="Profile Preview" 
                        width={96}
                        height={96}
                        className="object-cover" 
                      />
                    ) : (
                      <span className="text-gray-400">No photo</span>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id="profilePhoto"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        methods.setValue("profilePhoto", file, { shouldValidate: true });
                      }}
                    />
                    <Button type="button" onClick={() => fileInputRef.current?.click()}>Upload Photo</Button>
                    {profilePhoto && (
                      <Button type="button" variant="outline" className="ml-2" onClick={() => {
                        methods.setValue("profilePhoto", null, { shouldValidate: true });
                        setPhotoPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}>Remove</Button>
                    )}
                  </div>
                </div>
                {methods.formState.errors.profilePhoto && (
                  <div className="text-red-500 text-sm mt-1">{methods.formState.errors.profilePhoto.message as string}</div>
                )}
                <div className="text-xs text-gray-400 mt-1">Max 5MB, square image (1:1)</div>
              </div>
              <div>
                <Label htmlFor="portfolioLink">Portfolio Link</Label>
                <Input {...methods.register("portfolioLink")}
                  id="portfolioLink"
                  type="url"
                  placeholder="https://github.com/username or Behance/Dribbble"
                  aria-invalid={!!methods.formState.errors.portfolioLink}
                  aria-describedby="portfolioLink-error"
                />
                {methods.formState.errors.portfolioLink && (
                  <div id="portfolioLink-error" className="text-red-500 text-sm mt-1">{methods.formState.errors.portfolioLink.message as string}</div>
                )}
                <div className="text-xs text-gray-400 mt-1">GitHub, Behance, or Dribbble only</div>
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <Label>Languages</Label>
                <div className="flex flex-col gap-2">
                  {fields.map((field, idx) => {
                    const currentLanguage = methods.watch(`languages.${idx}.language`) || "";
                    const currentProficiency = methods.watch(`languages.${idx}.proficiency`) || "";
                    return (
                      <div key={field.id} className="flex items-center gap-2">
                        <select
                          {...methods.register(`languages.${idx}.language` as const)}
                          className="border rounded px-2 py-1"
                          defaultValue={currentLanguage}
                        >
                          <option value="" disabled>Select language</option>
                          {languageOptions.map((lang) => (
                            <option key={lang} value={lang}>{lang}</option>
                          ))}
                        </select>
                        <select
                          {...methods.register(`languages.${idx}.proficiency` as const)}
                          className="border rounded px-2 py-1"
                          defaultValue={currentProficiency}
                        >
                          <option value="" disabled>Proficiency</option>
                          {proficiencyOptions.map((prof) => (
                            <option key={prof} value={prof}>{prof}</option>
                          ))}
                        </select>
                        <Button type="button" variant="outline" size="sm" onClick={() => remove(idx)} aria-label="Remove language">Remove</Button>
                      </div>
                    );
                  })}
                  <Button type="button" className="mt-2 w-fit" onClick={() => append({ language: "", proficiency: "" })}>Add Language</Button>
                </div>
                {methods.formState.errors.languages && (
                  <div className="text-red-500 text-sm mt-1">{(methods.formState.errors.languages as any)?.message}</div>
                )}
                <div className="text-xs text-gray-400 mt-1">Optional but recommended. Add all languages you are comfortable with.</div>
              </div>
            </div>
          )}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-center mb-4">Review Your Profile</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Personal Info</h3>
                <div><b>Name:</b> {formData.name}</div>
                <div><b>Email:</b> {formData.email}</div>
                <div><b>Phone:</b> {formData.phone}</div>
                <div><b>Location:</b> {formData.location}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Professional Details</h3>
                <div><b>Resume Headline:</b> {formData.resumeHeadline}</div>
                <div><b>Key Skills:</b> {(formData.keySkills || []).join(", ")}</div>
                <div><b>Experience:</b> {formData.experience === 'fresher' ? 'Fresher' : formData.experience === '1-3' ? '1-3 years' : '4+ years'}</div>
                {formData.experience !== 'fresher' && <div><b>Current Company:</b> {formData.currentCompany}</div>}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Photo/Portfolio</h3>
                <div className="flex items-center gap-2">
                  <b>Profile Photo:</b>
                  {formData.profilePhoto ? (
                    <span className="inline-block w-12 h-12 rounded-full overflow-hidden border">
                      <Image 
                        src={formData.profilePhoto instanceof File ? URL.createObjectURL(formData.profilePhoto) : formData.profilePhoto} 
                        alt="Profile" 
                        width={48}
                        height={48}
                        className="object-cover w-full h-full" 
                      />
                    </span>
                  ) : <span className="text-gray-400">None</span>}
                </div>
                <div><b>Portfolio Link:</b> {formData.portfolioLink || <span className="text-gray-400">None</span>}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Languages</h3>
                {(formData.languages && formData.languages.length > 0) ? (
                  <ul className="list-disc ml-6">
                    {formData.languages.map((lang: Record<string, unknown>, idx: number) => (
                      <li key={idx}>{lang.language} ({lang.proficiency})</li>
                    ))}
                  </ul>
                ) : <span className="text-gray-400">None</span>}
              </div>
              <div className="text-center text-sm text-gray-500">Please review your information. You can go back to edit any section.</div>
            </div>
          )}
          <div className="flex justify-between mt-8">
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={() => setCurrentStep((s) => s - 1)}>
                Back
              </Button>
            )}
            <Button type="submit" className="ml-auto">
              {currentStep === steps.length - 1 ? "Finish" : "Next"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
} 