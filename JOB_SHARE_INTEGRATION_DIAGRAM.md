# Job Share Feature Integration Diagram

## Job Detail Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    Job Detail Page                          │
│  app/jobs/[id]/page.tsx                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                Job Header Section                   │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  Job Title + Company + Location             │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │ Save Job    │ │ Bookmark    │ │ Share Job   │   │   │
│  │  │ (Heart)     │ │ (Bookmark)  │ │ (Share2)    │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Job Details Grid                       │   │
│  │  [Job Type] [Experience] [Remote] [Views] etc.      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Job Description                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              AI-Powered Insights                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Action Buttons Section                 │   │
│  │  ┌─────────────────┐ ┌─────────────┐ ┌───────────┐ │   │
│  │  │ Apply Now       │ │ Share Job   │ │ Back to   │ │   │
│  │  │ (or External)   │ │ (Share2)    │ │ Jobs      │ │   │
│  │  └─────────────────┘ └─────────────┘ └───────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## JobShare Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    JobShare Component                       │
│  components/JobShare.tsx                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                Share Button                         │   │
│  │  [Share2 Icon] Share Job                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                             │
│                              ▼                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                Share Modal                          │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ Header: "Share Job" + Close Button          │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │ Native  │ │WhatsApp │ │LinkedIn │ │Twitter  │   │   │
│  │  │ Share   │ │(Mobile) │ │         │ │/X       │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│  │                                                     │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐               │   │
│  │  │ Email   │ │Instagram│ │Copy Link│               │   │
│  │  │         │ │         │ │         │               │   │
│  │  └─────────┘ └─────────┘ └─────────┘               │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ Job Preview: Title + Company + Location     │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Share Flow

```
User clicks "Share Job"
         │
         ▼
┌─────────────────┐
│ Modal Opens     │
│ with Options    │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ User Selects    │
│ Platform        │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Action Executed │
│ • Open URL      │
│ • Copy to       │
│   Clipboard     │
│ • Native Share  │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Toast           │
│ Notification    │
│ (Success/Error) │
└─────────────────┘
```

## Integration Points

### 1. Header Section Integration
- **Location**: Next to "Save Job" and "Bookmark" buttons
- **Styling**: Matches existing button styles with backdrop blur
- **Responsive**: Stacks vertically on mobile, horizontally on desktop

### 2. Bottom Action Section Integration
- **Location**: Next to "Apply Now" and "Back to Jobs" buttons
- **Styling**: Consistent with action button styling
- **Layout**: Flexible layout that adapts to content

## Technical Features

### Web Share API Support
```
Mobile Device → Native Share Sheet
Desktop → Custom Share Modal
```

### Platform-Specific Handling
```
WhatsApp → wa.me with pre-filled text
LinkedIn → Professional sharing URL
Twitter → Tweet intent with job details
Email → mailto with formatted subject/body
Instagram → Copy link with guidance
Copy Link → Clipboard API with feedback
```

### Error Handling
```
Clipboard API fails → Fallback to manual copy
Network issues → Graceful error messages
Invalid URLs → Validation and sanitization
```

This integration provides a seamless, modern sharing experience that enhances user engagement and job visibility across the platform! 🚀
