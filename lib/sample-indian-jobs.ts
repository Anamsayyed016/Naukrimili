// Sample Indian job data for demonstration
export const sampleIndianJobs = [
  {
    id: "1",
    title: "Senior Software Engineer - Full Stack",
    company: { display_name: "TCS (Tata Consultancy Services)" },
    location: { display_name: "Bangalore, Karnataka" },
    salary_min: 800000,
    salary_max: 1500000,
    description: "We are seeking a skilled Senior Software Engineer to join our team in Bangalore. You will work on cutting-edge web applications using React, Node.js, and cloud technologies. Strong problem-solving skills and 5+ years of experience required.",
    created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    redirect_url: "https://careers.tcs.com",
    adref: "tcs001",
    contract_type: "Full-time",
    category: { label: "IT & Software", tag: "it-jobs" },
    isUrgent: true,
    isRemote: false
  },
  {
    id: "2",
    title: "Product Manager - Fintech",
    company: { display_name: "Paytm" },
    location: { display_name: "Noida, Uttar Pradesh" },
    salary_min: 1200000,
    salary_max: 2500000,
    description: "Join India's leading fintech company as a Product Manager. Lead product strategy, work with cross-functional teams, and drive innovation in digital payments. MBA preferred with 3-7 years product management experience.",
    created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    redirect_url: "https://jobs.paytm.com",
    adref: "paytm001",
    contract_type: "Full-time",
    category: { label: "Banking & Finance", tag: "banking-financial-services-jobs" },
    isUrgent: false,
    isRemote: true
  },
  {
    id: "3",
    title: "Data Scientist - Machine Learning",
    company: { display_name: "Flipkart" },
    location: { display_name: "Hyderabad, Telangana" },
    salary_min: 1000000,
    salary_max: 1800000,
    description: "Exciting opportunity for a Data Scientist to work on recommendation systems and ML models at India's largest e-commerce platform. Experience with Python, TensorFlow, and big data technologies required.",
    created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    redirect_url: "https://www.flipkartcareers.com",
    adref: "flipkart001",
    contract_type: "Full-time",
    category: { label: "IT & Software", tag: "it-jobs" },
    isUrgent: false,
    isRemote: false
  },
  {
    id: "4",
    title: "Digital Marketing Manager",
    company: { display_name: "Byju's" },
    location: { display_name: "Mumbai, Maharashtra" },
    salary_min: 600000,
    salary_max: 1200000,
    description: "Lead digital marketing initiatives for India's top edtech company. Manage social media campaigns, SEO/SEM, and growth marketing. 4+ years experience in digital marketing required.",
    created: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    redirect_url: "https://byjus.com/careers",
    adref: "byjus001",
    contract_type: "Full-time",
    category: { label: "Sales & Marketing", tag: "sales-jobs" },
    isUrgent: true,
    isRemote: true
  },
  {
    id: "5",
    title: "Frontend Developer - React.js",
    company: { display_name: "Zomato" },
    location: { display_name: "Gurgaon, Haryana" },
    salary_min: 500000,
    salary_max: 900000,
    description: "Join Zomato's frontend team to build amazing user experiences. Work with React.js, Next.js, and modern web technologies. 2-4 years of frontend development experience needed.",
    created: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    redirect_url: "https://www.zomato.com/careers",
    adref: "zomato001",
    contract_type: "Full-time",
    category: { label: "IT & Software", tag: "it-jobs" },
    isUrgent: false,
    isRemote: false
  },
  {
    id: "6",
    title: "Business Analyst - Banking",
    company: { display_name: "HDFC Bank" },
    location: { display_name: "Chennai, Tamil Nadu" },
    salary_min: 700000,
    salary_max: 1100000,
    description: "Opportunity to work with India's largest private bank as a Business Analyst. Analyze business processes, gather requirements, and support digital transformation initiatives.",
    created: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    redirect_url: "https://www.hdfcbank.com/careers",
    adref: "hdfc001",
    contract_type: "Full-time",
    category: { label: "Banking & Finance", tag: "banking-financial-services-jobs" },
    isUrgent: false,
    isRemote: false
  },
  {
    id: "7",
    title: "DevOps Engineer - Cloud",
    company: { display_name: "Infosys" },
    location: { display_name: "Pune, Maharashtra" },
    salary_min: 800000,
    salary_max: 1400000,
    description: "Join Infosys as a DevOps Engineer working with AWS, Docker, Kubernetes, and CI/CD pipelines. Help modernize enterprise applications for global clients. 3+ years DevOps experience required.",
    created: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    redirect_url: "https://www.infosys.com/careers",
    adref: "infosys001",
    contract_type: "Full-time",
    category: { label: "IT & Software", tag: "it-jobs" },
    isUrgent: true,
    isRemote: true
  },
  {
    id: "8",
    title: "UX/UI Designer",
    company: { display_name: "Ola" },
    location: { display_name: "Bangalore, Karnataka" },
    salary_min: 600000,
    salary_max: 1000000,
    description: "Design intuitive user experiences for millions of Ola users. Work on mobile apps, web platforms, and new product features. Portfolio showcasing mobile and web design required.",
    created: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    redirect_url: "https://www.olacabs.com/careers",
    adref: "ola001",
    contract_type: "Full-time",
    category: { label: "IT & Software", tag: "it-jobs" },
    isUrgent: false,
    isRemote: false
  },
  {
    id: "9",
    title: "HR Manager - Talent Acquisition",
    company: { display_name: "Wipro" },
    location: { display_name: "Kolkata, West Bengal" },
    salary_min: 650000,
    salary_max: 950000,
    description: "Lead talent acquisition efforts for Wipro's growing team. Manage recruitment processes, build hiring strategies, and work with business leaders. 5+ years HR experience required.",
    created: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
    redirect_url: "https://careers.wipro.com",
    adref: "wipro001",
    contract_type: "Full-time",
    category: { label: "Human Resources", tag: "hr-jobs" },
    isUrgent: false,
    isRemote: false
  },
  {
    id: "10",
    title: "Content Writer - Tech",
    company: { display_name: "Freshworks" },
    location: { display_name: "Chennai, Tamil Nadu" },
    salary_min: 400000,
    salary_max: 700000,
    description: "Create compelling content for B2B SaaS products. Write blog posts, case studies, whitepapers, and marketing copy. Experience in tech/software content writing preferred.",
    created: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    redirect_url: "https://www.freshworks.com/careers",
    adref: "fresh001",
    contract_type: "Full-time",
    category: { label: "Sales & Marketing", tag: "sales-jobs" },
    isUrgent: false,
    isRemote: true
  },
  {
    id: "11",
    title: "Android Developer",
    company: { display_name: "PhonePe" },
    location: { display_name: "Bangalore, Karnataka" },
    salary_min: 900000,
    salary_max: 1600000,
    description: "Build and maintain PhonePe's Android application used by 400+ million users. Work with Kotlin, Android SDK, and modern architecture patterns. Strong Android development experience required.",
    created: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), // 7 hours ago
    redirect_url: "https://www.phonepe.com/careers",
    adref: "phonepe001",
    contract_type: "Full-time",
    category: { label: "IT & Software", tag: "it-jobs" },
    isUrgent: true,
    isRemote: false
  },
  {
    id: "12",
    title: "Sales Executive - B2B",
    company: { display_name: "Razorpay" },
    location: { display_name: "Delhi, Delhi" },
    salary_min: 500000,
    salary_max: 800000,
    description: "Drive B2B sales for India's leading payment gateway. Build relationships with enterprises, manage sales pipeline, and achieve revenue targets. 2-4 years B2B sales experience needed.",
    created: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
    redirect_url: "https://razorpay.com/careers",
    adref: "razor001",
    contract_type: "Full-time",
    category: { label: "Sales & Marketing", tag: "sales-jobs" },
    isUrgent: false,
    isRemote: false
  }
];

export const indianJobCategories = [
  { id: "it-jobs", name: "IT & Software", icon: "💻", trending: true },
  { id: "banking-financial-services-jobs", name: "Banking & Finance", icon: "💰", hot: true },
  { id: "teaching-jobs", name: "Teaching & Education", icon: "📚", trending: false },
  { id: "healthcare-nursing-jobs", name: "Healthcare & Medical", icon: "🏥", hot: true },
  { id: "sales-jobs", name: "Sales & Marketing", icon: "📈", trending: true },
  { id: "engineering-jobs", name: "Engineering", icon: "⚙️", hot: false },
  { id: "hr-jobs", name: "Human Resources", icon: "👥", trending: false },
  { id: "customer-services-jobs", name: "Customer Service", icon: "📞", hot: false }
];
