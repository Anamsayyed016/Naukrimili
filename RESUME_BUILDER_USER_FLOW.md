# 📋 Resume Builder - Complete User Flow Documentation

**Generated:** Current Date  
**Purpose:** Comprehensive documentation of user journey through the resume builder

---

## 🎯 **Overview**

The Resume Builder is a multi-step application that allows users to create professional resumes by:
1. Selecting a template
2. Filling out a 6-step form
3. Previewing in real-time
4. Exporting as PDF/DOCX

---

## 🚀 **Complete User Journey**

### **PHASE 1: Entry & Template Selection**

#### **Step 1: Start Page**
**Route:** `/resume-builder/start`

**Page File:** `app/resume-builder/start/page.tsx`  
**Component:** `components/resume-builder/ResumeBuilderStart.tsx`

**User Actions:**
- Views hero section with CTA buttons
- Sees trust indicators (Free, No credit card, ATS compatible, Multiple formats)

**Navigation Options:**
1. **"Create New Resume" Button** 
   - → Navigates to `/resume-builder/templates`
   - Function: `handleCreateNew()` in `ResumeBuilderStart.tsx`

2. **"Import Resume" Button**
   - → Navigates to `/resumes/upload?intent=builder`
   - Function: `handleImport()` in `ResumeBuilderStart.tsx`

3. **"View Pricing" Button** (if exists)
   - → Navigates to `/pricing`
   - Function: `handlePricing()` in `ResumeBuilderStart.tsx`

**State:** No user data collected yet

---

#### **Step 2: Template Selection**
**Route:** `/resume-builder/templates`

**Page File:** `app/resume-builder/templates/page.tsx`

**Components Used:**
- `components/resume-builder/TemplateFilters.tsx` - Filter controls
- `components/resume-builder/TemplatePreviewGallery.tsx` - Template grid display
- `components/resume-builder/TemplateCard.tsx` - Individual template cards

**User Actions:**
1. Views grid of available templates
2. Can filter by:
   - Category (All Templates, Premium, ATS, Simple, Modern, Professional, Creative)
   - Layout (All, One Column, Two Column, Sidebar, Graphics, Headshot)
   - Color (if applicable)
3. Clicks on a template card to select it

**Data Loading:**
- Templates loaded from: `lib/resume-builder/templates.json`
- Lazy loaded via `useEffect` hook
- Templates stored in component state: `templates`

**Template Selection:**
```javascript
const handleTemplateSelect = (templateId: string) => {
  const prefillParam = source === 'import' ? '&prefill=true' : '';
  router.push(`/resume-builder/editor?template=${templateId}&type=${typeId}${prefillParam}`);
};
```

**URL Parameters:**
- `template` - Template ID (required)
- `type` - Experience type (experienced, fresher, etc.) - defaults to 'experienced'
- `source` - Optional: 'import' if coming from import flow
- `prefill` - Optional: 'true' if data should be pre-filled

**Navigation:**
- **Back Button** → `/resume-builder/start`
- **Template Selection** → `/resume-builder/editor?template={id}&type={type}`

**State:** Template ID and type selected, passed via URL params

---

### **PHASE 2: Resume Editing**

#### **Step 3: Resume Editor**
**Route:** `/resume-builder/editor?template={id}&type={type}`

**Page File:** `app/resume-builder/editor/page.tsx`

**Main Components:**
1. **Editor Stepper** - `components/resume-builder/EditorStepper.tsx` (if exists)
2. **Step Components** - 6 form steps
3. **Live Preview** - `components/resume-builder/ResumePreviewWrapper.tsx`
4. **Change Template Modal** - `components/resume-builder/ChangeTemplateModal.tsx`

**Step Flow (6 Steps):**

##### **Step 1: Personal Information**
**Component:** `components/resume-builder/steps/PersonalInfoStep.tsx`
- Name, Email, Phone, Location
- Professional Title/Headline
- Photo Upload (optional)
- Links (LinkedIn, Portfolio, etc.)
- ATS Suggestions for job title

##### **Step 2: Experience**
**Component:** `components/resume-builder/steps/ExperienceStep.tsx`
- Multiple job entries
- Company, Position, Dates, Location
- Job descriptions (bullet points)
- ATS Suggestions for descriptions

##### **Step 3: Skills**
**Component:** `components/resume-builder/steps/SkillsStep.tsx`
- Skill categories
- Individual skills with proficiency levels
- Auto-complete suggestions

##### **Step 4: Education**
**Component:** `components/resume-builder/steps/EducationStep.tsx`
- Multiple education entries
- Institution, Degree, Field, Dates
- GPA (optional)

##### **Step 5: Summary**
**Component:** `components/resume-builder/steps/SummaryStep.tsx`
- Professional summary/objective
- ATS Suggestions for summary

##### **Step 6: Additional Information**
**Component:** `components/resume-builder/steps/AdditionalStep.tsx`
- Projects, Certifications, Languages, Achievements, Hobbies (optional)
- Additional sections based on resume type

**State Management:**
- Form data stored in component state: `formData`
- Auto-saved to `localStorage` (key: `resume-builder-data`)
- Current step tracked: `currentStep`
- Template ID from URL params: `templateId`
- Selected color theme: `selectedColorId`

**Key Features:**
1. **Step Navigation**
   - Progress indicator
   - Previous/Next buttons
   - Step validation before proceeding

2. **Live Preview**
   - Real-time updates as user types
   - Template rendered in iframe
   - Color theme applied instantly
   - View Full Resume button (opens fullscreen modal)

3. **Template Switching**
   - Change Template button/modal
   - Preserves all form data
   - Instant preview update

4. **Auto-Save**
   - Saves to localStorage on changes
   - Restores data on page reload
   - Prevents data loss

5. **ATS Features**
   - Keyword suggestions
   - Auto-complete
   - Inline suggestions
   - Score calculation

**Navigation:**
- Step navigation (Previous/Next buttons)
- Back to templates (Change Template modal)
- Export buttons (PDF/DOCX) - in header/finalize step

**API Calls Made:**
- Template files: `/api/resume-builder/templates?templateId={id}&fileType={html|css}`
- ATS Suggestions: `/api/resume-builder/ats-suggestions`
- AI Enhance: `/api/resume-builder/ai-enhance`

---

### **PHASE 3: Finalization & Export**

#### **Step 4: Finalize Step** (Optional)
**Component:** `components/resume-builder/steps/FinalizeStep.tsx`

**Features:**
- Final review of resume
- ATS Score display
- Payment plan selection (if not paid user)
- Export options (PDF/DOCX)
- Save to database option

**Payment Integration:**
- Shows pricing plans if user not paid
- Payment via Razorpay
- Plan activation after payment
- Download restrictions based on plan

**Export Flow:**
1. User clicks "Download PDF" or "Download DOCX"
2. Plan/credit check performed
3. If allowed:
   - API call to `/api/resume-builder/export/pdf` or `/api/resume-builder/export/docx`
   - PDF/DOCX generated server-side (Puppeteer)
   - File downloaded to user's device
   - Usage counter incremented

**Save to Database:**
- API call to `/api/resume-builder/save`
- Resume saved with:
  - User ID
  - Template ID
  - Form data (JSON)
  - Selected color
  - ATS Score
- Returns resume ID for future editing

**State:** Resume data finalized, saved, and/or exported

---

## 📊 **Data Flow Diagram**

```
User Action → Component → State Update → API Call → Database/File System
     ↓            ↓            ↓            ↓              ↓
   Click      onChange    setState      fetch()      Save/Generate
     ↓            ↓            ↓            ↓              ↓
  Navigate   Re-render   localStorage   Response      Update UI
```

---

## 🔄 **State Management**

### **Client-Side State:**
1. **Form Data** (`formData`)
   - Stored in editor page component state
   - Auto-saved to localStorage
   - Structure matches resume schema

2. **UI State**
   - Current step: `currentStep`
   - Selected template: `templateId` (from URL)
   - Selected color: `selectedColorId`
   - Preview visibility: `showPreview`
   - Modal states: `showChangeTemplate`, `showPayment`

3. **Template Data**
   - Loaded from `lib/resume-builder/templates.json`
   - Cached in component state
   - Template HTML/CSS loaded via API

### **Server-Side State:**
1. **Saved Resumes**
   - Stored in database (`Resume` table)
   - Linked to user ID
   - Contains full form data as JSON

2. **User Credits/Plans**
   - Stored in `UserCredits` table
   - Tracks download limits
   - Tracks plan validity

---

## 🌐 **API Routes Used**

### **Template Routes:**
- `GET /api/resume-builder/templates?templateId={id}&fileType={html|css}`
  - Serves template HTML/CSS files
  - Used by preview system

### **ATS/AI Routes:**
- `POST /api/resume-builder/ats-suggestions`
  - Provides keyword suggestions
  - Used in step components

- `POST /api/resume-builder/ai-enhance`
  - Enhances resume content
  - Used for AI-powered suggestions

### **Save/Export Routes:**
- `POST /api/resume-builder/save`
  - Saves resume to database
  - Requires authentication
  - Returns resume ID

- `POST /api/resume-builder/export/pdf`
  - Generates PDF file
  - Requires payment/credits
  - Returns PDF blob

- `POST /api/resume-builder/export/docx`
  - Generates DOCX file (currently disabled)
  - Requires payment/credits

---

## 🔐 **Authentication & Authorization**

### **Public Access:**
- Start page
- Template selection
- Resume editor (form filling)

### **Authenticated Required:**
- Saving resume to database
- Exporting PDF/DOCX
- Viewing saved resumes

### **Payment Required:**
- PDF/DOCX downloads (based on plan)
- Premium templates (based on plan)
- Unlimited downloads (based on plan)

---

## 💾 **Persistence**

### **Client-Side (localStorage):**
- Key: `resume-builder-data`
- Contains: Full form data
- Purpose: Auto-save and restore on reload
- Lifetime: Until cleared by user or browser

### **Server-Side (Database):**
- Table: `Resume`
- Fields:
  - `id` - Resume ID
  - `userId` - User ID (foreign key)
  - `templateId` - Selected template
  - `parsedData` - Form data (JSON)
  - `atsScore` - Calculated ATS score
  - `isActive` - Active resume flag
  - `createdAt`, `updatedAt` - Timestamps

---

## 🎨 **Template System**

### **Template Structure:**
- Templates defined in: `lib/resume-builder/templates.json`
- Each template has:
  - `id` - Unique identifier
  - `name` - Display name
  - `html` - Path to HTML file
  - `css` - Path to CSS file
  - `categories` - Template categories
  - `colors` - Available color themes

### **Template Loading:**
1. Template metadata loaded from JSON
2. HTML/CSS files loaded via API
3. Data injected into template HTML
4. Color theme applied to CSS
5. Rendered in iframe for preview

### **Template Switching:**
- Change Template modal opens
- User selects new template
- Form data preserved
- Preview updates instantly
- URL params updated (template ID)

---

## ⚡ **Key Interactions**

### **Real-Time Preview:**
- Updates on every form field change
- Debounced for performance
- Uses iframe for isolation
- Template-specific rendering

### **Step Navigation:**
- Validation before next step
- Progress indicator
- Smooth transitions
- Data persistence between steps

### **Auto-Save:**
- Saves on field blur/change
- Saves on step change
- Restores on page reload
- Shows save indicator

### **Export Process:**
1. User clicks export button
2. Payment/credit check
3. If allowed:
   - Show loading state
   - Call export API
   - Generate file server-side
   - Download to device
   - Increment usage counter
4. If not allowed:
   - Show payment modal
   - Redirect to pricing
   - Block export

---

## 🚦 **Error Handling**

### **Template Loading Errors:**
- Fallback to default template
- Error message displayed
- User can retry

### **Save Errors:**
- Error message displayed
- Data remains in localStorage
- User can retry

### **Export Errors:**
- Error message displayed
- Payment/credit error handled
- User redirected to pricing if needed

### **Network Errors:**
- Retry mechanism
- Offline detection
- Data preservation

---

## 📱 **Responsive Behavior**

### **Mobile:**
- Stacked layout
- Single column form
- Collapsible preview
- Touch-optimized controls

### **Tablet:**
- Two-column layout
- Side-by-side form and preview
- Larger touch targets

### **Desktop:**
- Full layout
- Three-column (steps, form, preview)
- Hover states
- Keyboard shortcuts

---

## 🎯 **Exit Points**

Users can exit the resume builder at any point:

1. **Before Template Selection:**
   - Back button → Start page
   - Close browser → Data not saved

2. **After Template Selection (Before Saving):**
   - Data in localStorage
   - Can return later (if localStorage persists)
   - Data lost if localStorage cleared

3. **After Saving:**
   - Resume saved to database
   - Can return via dashboard
   - Resume accessible for editing

4. **After Export:**
   - Resume saved (if saved)
   - PDF/DOCX downloaded
   - Can re-export (if credits available)

---

## 📝 **Summary**

The Resume Builder flow is:
1. **Entry** → Start page (`/resume-builder/start`)
2. **Template Selection** → Templates page (`/resume-builder/templates`)
3. **Editing** → Editor page (`/resume-builder/editor`)
4. **Finalization** → Finalize step (within editor)
5. **Export/Save** → API calls for export/save

**Key Characteristics:**
- Multi-step form (6 steps)
- Real-time preview
- Auto-save to localStorage
- Template switching
- Payment-gated exports
- ATS optimization features
- Responsive design

---

**Document Version:** 1.0  
**Last Updated:** Current Date  
**Status:** Complete Flow Documentation

