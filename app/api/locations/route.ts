const indianCities = [
  {
    id: 'bangalore',
    name: 'Bangalore',
    state: 'Karnataka',
    jobCount: 1250,
    topCompanies: ['Google', 'Microsoft', 'Flipkart', 'Amazon'],
    averageSalary: '₹18 LPA',
    growth: '+15%'
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    jobCount: 980,
    topCompanies: ['Amazon', 'Reliance', 'HDFC Bank', 'Tata'],
    averageSalary: '₹16 LPA',
    growth: '+12%'
  },
  {
    id: 'delhi',
    name: 'Delhi',
    state: 'Delhi',
    jobCount: 850,
    topCompanies: ['Paytm', 'Zomato', 'OYO', 'Snapdeal'],
    averageSalary: '₹15 LPA',
    growth: '+10%'
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    jobCount: 720,
    topCompanies: ['Microsoft', 'Google', 'Facebook', 'Apple'],
    averageSalary: '₹17 LPA',
    growth: '+18%'
  },
  {
    id: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    jobCount: 650,
    topCompanies: ['Infosys', 'TCS', 'Wipro', 'Tech Mahindra'],
    averageSalary: '₹14 LPA',
    growth: '+8%'
  }
];

export async function GET() {
  return Response.json({
    success: true,
    locations: indianCities,
    total: indianCities.length
  });
}