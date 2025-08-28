# 🔍 Google Custom Search Engine (CSE) Setup Guide

This guide will help you set up Google Custom Search Engine integration for your job portal.

## 🚀 **What This Integration Provides:**

1. **Your API jobs are always shown first** as the main results
2. **Google CSE results appear below** using the same search query
3. **CSE section is always visible** when there's a search query
4. **Script loads only once** (no duplicate injection)
5. **Search query is passed dynamically** to Google CSE
6. **Clean, minimal styling** that blends with your UI
7. **Seamless React/Next.js integration**

## 📋 **Prerequisites:**

- Google account
- Access to Google Cloud Console
- Access to Google Programmable Search Engine

## 🔧 **Step 1: Create Google Custom Search Engine**

1. Go to [Google Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click **"Create a search engine"**
3. Enter your website URL (e.g., `https://yourdomain.com`)
4. Choose **"Search the entire web"** for broader job results
5. Click **"Create"**
6. Note your **Search Engine ID** (cx parameter)

## 🔑 **Step 2: Get Google API Key**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Custom Search API**
4. Go to **APIs & Services > Credentials**
5. Click **"Create Credentials" > "API Key"**
6. Copy your **API Key**

## ⚙️ **Step 3: Configure Environment Variables**

Add these to your `.env.local` file:

```bash
# Google Custom Search Engine Configuration
GOOGLE_CSE_ID=your-custom-search-engine-id
GOOGLE_CSE_API_KEY=your-google-api-key

# Client-side CSE ID (must start with NEXT_PUBLIC_)
NEXT_PUBLIC_GOOGLE_CSE_ID=your-custom-search-engine-id
```

## 🎯 **Step 4: Customize Search Engine (Optional)**

1. Go back to your [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click on your search engine
3. Go to **"Setup"** tab
4. Configure:
   - **Search the entire web**: Enabled
   - **Sites to search**: Add job sites like LinkedIn, Indeed, etc.
   - **Search features**: Enable job search refinements
   - **Look and feel**: Customize appearance

## 🔍 **Step 5: Test the Integration**

1. Start your development server
2. Go to the jobs page
3. Enter a search query
4. You should see:
   - Your API jobs at the top
   - Google CSE results below
   - Clean, integrated styling

## 📱 **Features:**

### **Smart Loading:**
- Script loads only once per session
- Prevents duplicate injection
- Graceful fallback if CSE fails

### **Dynamic Search:**
- Automatically uses user's search query
- Includes location if specified
- Real-time results updates

### **Responsive Design:**
- Mobile-friendly layout
- Consistent with your existing UI
- Tailwind CSS styling

### **Error Handling:**
- Graceful degradation
- Fallback to direct Google search
- User-friendly error messages

## 🚨 **Troubleshooting:**

### **CSE Not Loading:**
- Check `NEXT_PUBLIC_GOOGLE_CSE_ID` is set
- Verify Search Engine ID is correct
- Check browser console for errors

### **No Results:**
- Ensure Custom Search API is enabled
- Check API key has proper permissions
- Verify search engine is configured for web search

### **Styling Issues:**
- Check Tailwind CSS is loaded
- Verify component CSS classes
- Check for CSS conflicts

## 🔒 **Security Notes:**

- `NEXT_PUBLIC_GOOGLE_CSE_ID` is safe to expose (public)
- `GOOGLE_CSE_API_KEY` should remain server-side only
- CSE results are from Google's trusted sources
- No user data is sent to Google

## 📊 **Performance:**

- Script loads asynchronously
- Results are cached by Google
- Minimal impact on page load
- Efficient React rendering

## 🎨 **Customization:**

You can customize the component by modifying:
- Colors and gradients
- Layout and spacing
- Number of results shown
- Search refinements
- Styling classes

## 📞 **Support:**

If you encounter issues:
1. Check browser console for errors
2. Verify environment variables
3. Test with a simple search query
4. Check Google CSE dashboard for status

---

**Happy searching! 🚀**
