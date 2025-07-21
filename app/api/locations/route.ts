import { NextResponse } from 'next/server';

interface City {
  city: string;
  jobCount: number;
  isTrending?: boolean;
}

const indianCities: City[] = [
  { city: "Mumbai", jobCount: 15420, isTrending: true },
  { city: "Delhi", jobCount: 12850, isTrending: true },
  { city: "Bangalore", jobCount: 11230, isTrending: true },
  { city: "Hyderabad", jobCount: 8950, isTrending: true },
  { city: "Chennai", jobCount: 7230 },
  { city: "Pune", jobCount: 6540 },
  { city: "Kolkata", jobCount: 5890 },
  { city: "Ahmedabad", jobCount: 4320 },
  { city: "Noida", jobCount: 3980 },
  { city: "Gurgaon", jobCount: 3650 },
  { city: "Indore", jobCount: 2890 },
  { city: "Jaipur", jobCount: 2340 },
  { city: "Lucknow", jobCount: 1980 },
  { city: "Chandigarh", jobCount: 1650 },
  { city: "Bhopal", jobCount: 1430 },
  { city: "Patna", jobCount: 1280 },
  { city: "Vadodara", jobCount: 1150 },
  { city: "Ghaziabad", jobCount: 980 },
  { city: "Ludhiana", jobCount: 870 },
  { city: "Agra", jobCount: 650 },
  { city: "Nashik", jobCount: 580 },
  { city: "Faridabad", jobCount: 520 },
  { city: "Meerut", jobCount: 480 },
  { city: "Rajkot", jobCount: 420 },
  { city: "Kalyan", jobCount: 380 },
  { city: "Vasai", jobCount: 350 },
  { city: "Varanasi", jobCount: 320 },
  { city: "Srinagar", jobCount: 280 },
  { city: "Aurangabad", jobCount: 250 },
  { city: "Dhanbad", jobCount: 220 },
  { city: "Amritsar", jobCount: 200 },
  { city: "Allahabad", jobCount: 180 },
  { city: "Ranchi", jobCount: 160 },
  { city: "Howrah", jobCount: 140 },
  { city: "Coimbatore", jobCount: 120 },
  { city: "Jabalpur", jobCount: 100 },
  { city: "Gwalior", jobCount: 90 },
  { city: "Vijayawada", jobCount: 80 },
  { city: "Jodhpur", jobCount: 70 },
  { city: "Madurai", jobCount: 60 },
  { city: "Raipur", jobCount: 50 },
  { city: "Kota", jobCount: 40 },
  { city: "Guwahati", jobCount: 30 },
  { city: "Chandrapur", jobCount: 25 },
  { city: "Solapur", jobCount: 20 },
  { city: "Tiruchirappalli", jobCount: 18 },
  { city: "Bareilly", jobCount: 15 },
  { city: "Moradabad", jobCount: 12 },
  { city: "Mysore", jobCount: 10 },
  { city: "Bhubaneswar", jobCount: 8 },
  { city: "Salem", jobCount: 6 },
  { city: "Warangal", jobCount: 5 },
  { city: "Guntur", jobCount: 4 },
  { city: "Bhiwandi", jobCount: 3 },
  { city: "Saharanpur", jobCount: 2 },
  { city: "Gorakhpur", jobCount: 1 }
];

export async function GET() {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return NextResponse.json(indianCities);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
} 