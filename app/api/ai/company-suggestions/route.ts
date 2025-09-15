import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { type, companyName, industry, existingData } = await request.json();

    if (!type || !companyName || !industry) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let suggestion = '';

    switch (type) {
      case 'description':
        suggestion = generateCompanyDescription(companyName, industry);
        break;
      case 'benefits':
        const benefits = generateBenefits(industry);
        return NextResponse.json({
          success: true,
          suggestions: benefits
        });
      case 'specialties':
        const specialties = generateSpecialties(companyName, industry);
        return NextResponse.json({
          success: true,
          suggestions: specialties
        });
      default:
        return NextResponse.json(
          { error: "Invalid suggestion type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      suggestion
    });

  } catch (error) {
    console.error("Error generating AI suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}

function generateCompanyDescription(companyName: string, industry: string): string {
  const descriptions = {
    'Technology': `${companyName} is a leading technology company dedicated to innovation and digital transformation. We specialize in cutting-edge solutions that drive business growth and enhance user experiences. Our team of passionate technologists works collaboratively to deliver exceptional products and services that make a real difference in the world.`,
    'Healthcare': `${companyName} is a healthcare company committed to improving patient outcomes and advancing medical innovation. We combine cutting-edge technology with compassionate care to deliver solutions that enhance healthcare delivery and patient experiences. Our mission is to make quality healthcare accessible to everyone.`,
    'Finance': `${companyName} is a financial services company that empowers individuals and businesses to achieve their financial goals. We provide innovative financial solutions, investment strategies, and personalized services to help our clients build wealth and secure their financial future.`,
    'Education': `${companyName} is an educational institution dedicated to fostering learning, innovation, and personal growth. We provide high-quality education and training programs that prepare students for success in their chosen fields. Our commitment to excellence and student success drives everything we do.`,
    'Manufacturing': `${companyName} is a manufacturing company that combines traditional craftsmanship with modern technology to produce high-quality products. We are committed to sustainable manufacturing practices and continuous innovation to meet the evolving needs of our customers.`,
    'Retail': `${companyName} is a retail company that connects customers with the products they love. We offer a curated selection of high-quality merchandise and exceptional customer service, creating memorable shopping experiences both online and in-store.`,
    'Consulting': `${companyName} is a consulting firm that helps organizations navigate complex challenges and achieve sustainable growth. Our experienced team provides strategic insights, innovative solutions, and actionable recommendations to drive business success.`,
    'Media': `${companyName} is a media company that creates compelling content and experiences that engage, inform, and inspire audiences worldwide. We combine creativity with technology to deliver stories that matter and connect people across cultures and communities.`,
    'Real Estate': `${companyName} is a real estate company that helps clients find their perfect property and make informed investment decisions. We provide comprehensive real estate services with a focus on integrity, expertise, and personalized attention to every client's needs.`,
    'Marketing & Advertising': `${companyName} is a marketing and advertising agency that helps brands connect with their audiences through creative campaigns and strategic marketing solutions. We combine data-driven insights with creative excellence to deliver results that drive business growth.`
  };

  return descriptions[industry] || `${companyName} is a ${industry} company committed to excellence, innovation, and delivering exceptional value to our customers. We are dedicated to building lasting relationships and making a positive impact in everything we do.`;
}

function generateBenefits(industry: string): string[] {
  const industryBenefits = {
    'Technology': ['Health Insurance', 'Dental Insurance', 'Remote Work', 'Flexible Hours', 'Professional Development', 'Stock Options', '401(k) Matching', 'Mental Health Support'],
    'Healthcare': ['Health Insurance', 'Dental Insurance', 'Vision Insurance', 'Life Insurance', 'Paid Time Off', 'Professional Development', 'Childcare Support', 'Mental Health Support'],
    'Finance': ['Health Insurance', 'Dental Insurance', 'Vision Insurance', '401(k) Matching', 'Performance Bonus', 'Professional Development', 'Transportation Allowance', 'Stock Options'],
    'Education': ['Health Insurance', 'Dental Insurance', 'Paid Time Off', 'Professional Development', 'Tuition Reimbursement', 'Flexible Hours', 'Summer Break', 'Mental Health Support'],
    'Manufacturing': ['Health Insurance', 'Dental Insurance', 'Vision Insurance', 'Life Insurance', 'Paid Time Off', 'Overtime Pay', 'Safety Training', 'Transportation Allowance'],
    'Retail': ['Health Insurance', 'Employee Discount', 'Flexible Hours', 'Paid Time Off', 'Professional Development', 'Performance Bonus', 'Seasonal Bonuses', 'Team Events'],
    'Consulting': ['Health Insurance', 'Dental Insurance', 'Professional Development', 'Performance Bonus', 'Flexible Hours', 'Remote Work', 'Travel Allowance', 'Client Entertainment'],
    'Media': ['Health Insurance', 'Dental Insurance', 'Creative Freedom', 'Flexible Hours', 'Professional Development', 'Equipment Allowance', 'Remote Work', 'Team Collaboration'],
    'Real Estate': ['Health Insurance', 'Commission Structure', 'Flexible Hours', 'Professional Development', 'Marketing Support', 'Technology Tools', 'Networking Events', 'Performance Bonuses'],
    'Marketing & Advertising': ['Health Insurance', 'Dental Insurance', 'Creative Freedom', 'Flexible Hours', 'Professional Development', 'Remote Work', 'Team Events', 'Client Entertainment']
  };

  return industryBenefits[industry] || [
    'Health Insurance', 'Dental Insurance', 'Paid Time Off', 'Professional Development', 
    'Flexible Hours', 'Performance Bonus', 'Team Events', 'Mental Health Support'
  ];
}

function generateSpecialties(companyName: string, industry: string): string[] {
  const industrySpecialties = {
    'Technology': ['Software Development', 'Cloud Computing', 'Artificial Intelligence', 'Data Analytics', 'Cybersecurity', 'Mobile Development', 'DevOps', 'Machine Learning'],
    'Healthcare': ['Patient Care', 'Medical Technology', 'Telemedicine', 'Health Analytics', 'Preventive Care', 'Medical Research', 'Digital Health', 'Clinical Trials'],
    'Finance': ['Investment Management', 'Financial Planning', 'Risk Assessment', 'Digital Banking', 'Financial Technology', 'Wealth Management', 'Insurance', 'Trading'],
    'Education': ['Curriculum Development', 'Online Learning', 'Educational Technology', 'Student Assessment', 'Teacher Training', 'Educational Research', 'Learning Analytics', 'Special Education'],
    'Manufacturing': ['Quality Control', 'Process Optimization', 'Supply Chain Management', 'Automation', 'Lean Manufacturing', 'Product Development', 'Safety Management', 'Sustainability'],
    'Retail': ['Customer Experience', 'Inventory Management', 'E-commerce', 'Visual Merchandising', 'Supply Chain', 'Digital Marketing', 'Customer Analytics', 'Omnichannel Retail'],
    'Consulting': ['Strategic Planning', 'Business Process Improvement', 'Change Management', 'Digital Transformation', 'Organizational Development', 'Performance Management', 'Risk Management', 'Market Research'],
    'Media': ['Content Creation', 'Digital Marketing', 'Social Media', 'Video Production', 'Graphic Design', 'Brand Strategy', 'Public Relations', 'Media Planning'],
    'Real Estate': ['Property Management', 'Real Estate Investment', 'Commercial Real Estate', 'Residential Sales', 'Property Development', 'Real Estate Finance', 'Market Analysis', 'Property Valuation'],
    'Marketing & Advertising': ['Brand Strategy', 'Digital Marketing', 'Content Marketing', 'Social Media Marketing', 'Advertising Campaigns', 'Market Research', 'Creative Design', 'Performance Analytics']
  };

  return industrySpecialties[industry] || [
    'Customer Service', 'Quality Assurance', 'Process Improvement', 'Team Leadership', 
    'Strategic Planning', 'Innovation', 'Project Management', 'Performance Optimization'
  ];
}
