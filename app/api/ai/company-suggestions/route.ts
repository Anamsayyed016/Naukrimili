import { NextRequest, NextResponse } from "next/server";
import { UnifiedAIService } from "@/lib/services/unified-ai-service";

const aiService = new UnifiedAIService({
  preferredProvider: 'openai',
  enableFallback: true
});

export async function POST(request: NextRequest) {
  try {
    const { type, companyName, industry, existingData, userInput } = await request.json();

    if (!type || !companyName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if AI is available, otherwise fallback to templates
    const useAI = aiService.isAvailable();

    if (useAI) {
      // Use real AI for dynamic suggestions
      try {
        const result = await generateWithAI(type, companyName, industry, existingData, userInput);
        return NextResponse.json(result);
      } catch (aiError) {
        console.error("AI generation failed, falling back to templates:", aiError);
        // Fall through to template-based generation
      }
    }

    // Fallback to template-based generation if AI is not available
    let suggestion = '';

    switch (type) {
      case 'description':
        suggestion = generateCompanyDescription(companyName, industry || 'Technology', existingData, userInput);
        break;
      case 'benefits':
        const benefits = generateBenefits(industry || 'Technology', companyName, existingData, userInput);
        return NextResponse.json({
          success: true,
          suggestions: benefits
        });
      case 'specialties':
        const specialties = generateSpecialties(companyName, industry || 'Technology', existingData, userInput);
        return NextResponse.json({
          success: true,
          suggestions: specialties
        });
      case 'mission':
        suggestion = generateMission(companyName, industry || 'Technology', existingData, userInput);
        break;
      case 'vision':
        suggestion = generateVision(companyName, industry || 'Technology', existingData, userInput);
        break;
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

async function generateWithAI(
  type: string,
  companyName: string,
  industry: string | undefined,
  existingData: Record<string, unknown> | undefined,
  userInput: string | undefined
) {
  const context = {
    companyName,
    industry: industry || 'Technology',
    location: existingData?.location || '',
    size: existingData?.size || '',
    description: existingData?.description || '',
    userTypedContent: userInput || ''
  };

  let prompt = '';
  let responseFormat = 'text';

  switch (type) {
    case 'description':
      prompt = `Generate a compelling company description for "${companyName}" in the ${context.industry} industry. 
${context.userTypedContent ? `The user has started writing: "${context.userTypedContent}". Continue and enhance their description, maintaining their tone and style.` : 'Create a professional, engaging description.'}
${context.location ? `Location: ${context.location}.` : ''}
${context.size ? `Company size: ${context.size} employees.` : ''}
Make it unique, professional, and specific to this company. Return only the description text, no markdown.`;
      responseFormat = 'text';
      break;

    case 'benefits':
      prompt = `Suggest 6-8 relevant employee benefits for "${companyName}" in the ${context.industry} industry.
${context.userTypedContent ? `The user has mentioned: "${context.userTypedContent}". Consider this context when suggesting benefits.` : ''}
${context.size ? `Company size: ${context.size} employees.` : ''}
Return ONLY a JSON array of benefit names (strings), no other text. Example: ["Health Insurance", "Remote Work", "Flexible Hours"]`;
      responseFormat = 'json';
      break;

    case 'specialties':
      prompt = `Suggest 6-8 company specialties/expertise areas for "${companyName}" in the ${context.industry} industry.
${context.userTypedContent ? `The user has typed: "${context.userTypedContent}". Use this as context for relevant specialties.` : ''}
${context.description && typeof context.description === 'string' ? `Company description: ${context.description.substring(0, 200)}` : ''}
Return ONLY a JSON array of specialty names (strings), no other text. Example: ["Software Development", "Cloud Computing", "AI/ML"]`;
      responseFormat = 'json';
      break;

    case 'mission':
      prompt = `Generate a mission statement for "${companyName}" in the ${context.industry} industry.
${context.userTypedContent ? `The user has started writing: "${context.userTypedContent}". Complete and enhance their mission statement, maintaining their voice.` : 'Create a clear, inspiring mission statement.'}
${context.description && typeof context.description === 'string' ? `Company context: ${context.description.substring(0, 200)}` : ''}
Make it authentic and specific to this company. Return only the mission statement text, no markdown.`;
      responseFormat = 'text';
      break;

    case 'vision':
      prompt = `Generate a vision statement for "${companyName}" in the ${context.industry} industry.
${context.userTypedContent ? `The user has started writing: "${context.userTypedContent}". Complete and enhance their vision statement, maintaining their voice.` : 'Create an inspiring, forward-looking vision statement.'}
${context.mission && typeof context.mission === 'string' ? `Mission statement: ${context.mission}` : ''}
${context.description && typeof context.description === 'string' ? `Company context: ${context.description.substring(0, 200)}` : ''}
Make it authentic and specific to this company. Return only the vision statement text, no markdown.`;
      responseFormat = 'text';
      break;

    default:
      throw new Error('Invalid type');
  }

  const response = await aiService.generateCompletion(
    prompt,
    undefined,
    {
      maxTokens: type === 'benefits' || type === 'specialties' ? 200 : 300,
      temperature: 0.7,
      model: type === 'benefits' || type === 'specialties' ? 'gpt-4o-mini' : 'gpt-4o-mini'
    }
  );

  if (!response.success || !response.data) {
    throw new Error('AI generation failed');
  }

  if (responseFormat === 'json') {
    try {
      // Try to parse as JSON array
      const parsed = JSON.parse(response.data);
      if (Array.isArray(parsed)) {
        return {
          success: true,
          suggestions: parsed
        };
      }
      // If not array, try to extract array from text
      const arrayMatch = response.data.match(/\[.*?\]/s);
      if (arrayMatch) {
        return {
          success: true,
          suggestions: JSON.parse(arrayMatch[0])
        };
      }
      // Fallback: split by lines or commas
      const items = response.data
        .split(/[,\n]/)
        .map(s => s.trim().replace(/^[-•*]\s*/, '').replace(/['"]/g, ''))
        .filter(s => s.length > 0)
        .slice(0, 8);
      return {
        success: true,
        suggestions: items
      };
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback to text parsing
      const items = response.data
        .split(/[,\n]/)
        .map(s => s.trim().replace(/^[-•*]\s*/, '').replace(/['"]/g, ''))
        .filter(s => s.length > 0)
        .slice(0, 8);
      return {
        success: true,
        suggestions: items
      };
    }
  } else {
    return {
      success: true,
      suggestion: response.data
    };
  }
}

function generateCompanyDescription(companyName: string, industry: string, existingData?: Record<string, unknown>, _userInput?: string): string {
  // Generate multiple variations and pick one randomly for dynamic suggestions
  const variations = {
    'Technology': [
      `${companyName} is a leading technology company dedicated to innovation and digital transformation. We specialize in cutting-edge solutions that drive business growth and enhance user experiences. Our team of passionate technologists works collaboratively to deliver exceptional products and services that make a real difference in the world.`,
      `${companyName} is at the forefront of technological innovation, creating solutions that transform industries and improve lives. We combine technical expertise with creative thinking to build products that solve real-world problems and drive meaningful change.`,
      `${companyName} is a dynamic technology company that bridges the gap between complex technical challenges and practical business solutions. Our diverse team of engineers, designers, and strategists work together to create innovative products that shape the future.`,
      `${companyName} is a technology-driven company that believes in the power of innovation to create positive impact. We develop cutting-edge software and digital solutions that help businesses thrive in an increasingly connected world.`
    ],
    'Healthcare': [
      `${companyName} is a healthcare company committed to improving patient outcomes and advancing medical innovation. We combine cutting-edge technology with compassionate care to deliver solutions that enhance healthcare delivery and patient experiences. Our mission is to make quality healthcare accessible to everyone.`,
      `${companyName} is dedicated to revolutionizing healthcare through innovative technology and patient-centered care. We develop solutions that improve medical outcomes, streamline healthcare processes, and make quality care more accessible to communities worldwide.`,
      `${companyName} is a healthcare technology company that bridges the gap between medical expertise and digital innovation. Our mission is to empower healthcare providers with tools that enhance patient care and improve health outcomes.`,
      `${companyName} is committed to transforming healthcare through innovative solutions and compassionate care. We work with healthcare professionals to develop technologies that improve patient experiences and advance medical research.`
    ],
    'Finance': [
      `${companyName} is a financial services company that empowers individuals and businesses to achieve their financial goals. We provide innovative financial solutions, investment strategies, and personalized services to help our clients build wealth and secure their financial future.`,
      `${companyName} is a trusted financial partner that combines traditional banking expertise with modern technology to deliver comprehensive financial solutions. We help our clients navigate complex financial landscapes and achieve their long-term financial objectives.`,
      `${companyName} is a forward-thinking financial services company that leverages technology to make financial management more accessible and efficient. We provide innovative investment solutions and personalized financial advice to help clients build and protect their wealth.`,
      `${companyName} is dedicated to democratizing access to financial services through innovative technology and personalized solutions. We help individuals and businesses make informed financial decisions and achieve their economic goals.`
    ],
    'Education': [
      `${companyName} is an educational institution dedicated to fostering learning, innovation, and personal growth. We provide high-quality education and training programs that prepare students for success in their chosen fields. Our commitment to excellence and student success drives everything we do.`,
      `${companyName} is a modern educational organization that combines traditional learning methods with innovative technology to create engaging and effective learning experiences. We prepare students for the challenges of tomorrow through comprehensive education and practical skills development.`,
      `${companyName} is committed to transforming education through innovative teaching methods and cutting-edge technology. We provide students with the knowledge, skills, and experiences they need to succeed in an ever-changing world.`,
      `${companyName} is an educational leader that believes in the power of learning to change lives and communities. We offer diverse programs and resources that empower students to achieve their academic and professional goals.`
    ],
    'Manufacturing': [
      `${companyName} is a manufacturing company that combines traditional craftsmanship with modern technology to produce high-quality products. We are committed to sustainable manufacturing practices and continuous innovation to meet the evolving needs of our customers.`,
      `${companyName} is a leading manufacturer that specializes in precision engineering and innovative production techniques. We deliver high-quality products while maintaining the highest standards of environmental responsibility and operational excellence.`,
      `${companyName} is a manufacturing innovator that transforms raw materials into exceptional products through advanced technology and skilled craftsmanship. We are committed to quality, sustainability, and continuous improvement in everything we produce.`,
      `${companyName} is a trusted manufacturing partner that combines decades of experience with cutting-edge technology to deliver superior products and services to customers worldwide.`
    ],
    'Retail': [
      `${companyName} is a retail company that connects customers with the products they love. We offer a curated selection of high-quality merchandise and exceptional customer service, creating memorable shopping experiences both online and in-store.`,
      `${companyName} is a customer-focused retail organization that brings together the best products and services to meet the diverse needs of our community. We pride ourselves on exceptional customer service and a commitment to quality.`,
      `${companyName} is a modern retail company that combines the convenience of online shopping with the personal touch of traditional retail. We curate unique products and provide exceptional service to create lasting customer relationships.`,
      `${companyName} is dedicated to providing customers with an exceptional shopping experience through innovative retail solutions and a carefully curated selection of high-quality products.`
    ],
    'Consulting': [
      `${companyName} is a consulting firm that helps organizations navigate complex challenges and achieve sustainable growth. Our experienced team provides strategic insights, innovative solutions, and actionable recommendations to drive business success.`,
      `${companyName} is a trusted consulting partner that combines deep industry expertise with innovative thinking to help clients solve their most pressing business challenges and achieve their strategic objectives.`,
      `${companyName} is a strategic consulting firm that empowers organizations to transform their operations, improve performance, and achieve sustainable growth through data-driven insights and proven methodologies.`,
      `${companyName} is committed to delivering exceptional consulting services that help businesses optimize their operations, enhance their competitive position, and achieve long-term success.`
    ],
    'Media': [
      `${companyName} is a media company that creates compelling content and experiences that engage, inform, and inspire audiences worldwide. We combine creativity with technology to deliver stories that matter and connect people across cultures and communities.`,
      `${companyName} is a creative media organization that produces innovative content and experiences that resonate with diverse audiences. We believe in the power of storytelling to inform, entertain, and inspire positive change.`,
      `${companyName} is a forward-thinking media company that leverages technology and creativity to produce engaging content and immersive experiences that connect people and communities.`,
      `${companyName} is dedicated to creating meaningful media content that informs, entertains, and inspires audiences while fostering connections and understanding across different cultures and communities.`
    ],
    'Real Estate': [
      `${companyName} is a real estate company that helps clients find their perfect property and make informed investment decisions. We provide comprehensive real estate services with a focus on integrity, expertise, and personalized attention to every client's needs.`,
      `${companyName} is a trusted real estate partner that combines local market expertise with innovative technology to help clients navigate the complex world of property investment and home ownership.`,
      `${companyName} is a full-service real estate company that provides expert guidance and personalized service to help clients achieve their property goals, whether buying, selling, or investing in real estate.`,
      `${companyName} is committed to excellence in real estate services, helping clients make informed decisions about property investments through expert advice and comprehensive market knowledge.`
    ],
    'Marketing & Advertising': [
      `${companyName} is a marketing and advertising agency that helps brands connect with their audiences through creative campaigns and strategic marketing solutions. We combine data-driven insights with creative excellence to deliver results that drive business growth.`,
      `${companyName} is a creative marketing agency that specializes in developing innovative campaigns and strategies that help brands stand out in competitive markets and build meaningful connections with their target audiences.`,
      `${companyName} is a full-service marketing and advertising firm that combines creative thinking with analytical rigor to develop campaigns that not only capture attention but also drive measurable business results.`,
      `${companyName} is dedicated to helping businesses grow through strategic marketing and creative advertising solutions that resonate with audiences and deliver exceptional return on investment.`
    ]
  };

  const industryVariations = variations[industry] || [
    `${companyName} is a ${industry} company committed to excellence, innovation, and delivering exceptional value to our customers. We are dedicated to building lasting relationships and making a positive impact in everything we do.`,
    `${companyName} is a leading ${industry} organization that combines industry expertise with innovative approaches to deliver outstanding results for our clients and partners.`,
    `${companyName} is a trusted ${industry} company that has built its reputation on quality, integrity, and a commitment to exceeding customer expectations in everything we do.`,
    `${companyName} is a forward-thinking ${industry} company that embraces innovation while maintaining the highest standards of quality and service excellence.`
  ];

  // Add some randomization based on company name and existing data
  const locationLength = existingData?.location && typeof existingData.location === 'string' ? existingData.location.length : 0;
  const founded = typeof existingData?.founded === 'number' ? existingData.founded : 0;
  const seed = companyName.length + locationLength + founded;
  const randomIndex = seed % industryVariations.length;
  
  return industryVariations[randomIndex];
}

function generateBenefits(industry: string, companyName?: string, existingData?: Record<string, unknown>, _userInput?: string): string[] {
  const allBenefits = {
    'Technology': [
      ['Health Insurance', 'Dental Insurance', 'Remote Work', 'Flexible Hours', 'Professional Development', 'Stock Options', '401(k) Matching', 'Mental Health Support'],
      ['Health Insurance', 'Dental Insurance', 'Vision Insurance', 'Remote Work', 'Flexible Hours', 'Professional Development', 'Gym Membership', 'Free Meals'],
      ['Health Insurance', 'Dental Insurance', 'Remote Work', 'Flexible Hours', 'Professional Development', 'Stock Options', '401(k) Matching', 'Transportation Allowance'],
      ['Health Insurance', 'Dental Insurance', 'Remote Work', 'Flexible Hours', 'Professional Development', 'Stock Options', '401(k) Matching', 'Equipment Allowance']
    ],
    'Healthcare': [
      ['Health Insurance', 'Dental Insurance', 'Vision Insurance', 'Life Insurance', 'Paid Time Off', 'Professional Development', 'Childcare Support', 'Mental Health Support'],
      ['Health Insurance', 'Dental Insurance', 'Vision Insurance', 'Life Insurance', 'Paid Time Off', 'Professional Development', 'Tuition Reimbursement', 'Flexible Hours'],
      ['Health Insurance', 'Dental Insurance', 'Vision Insurance', 'Life Insurance', 'Paid Time Off', 'Professional Development', 'Childcare Support', 'Transportation Allowance'],
      ['Health Insurance', 'Dental Insurance', 'Vision Insurance', 'Life Insurance', 'Paid Time Off', 'Professional Development', 'Mental Health Support', 'Gym Membership']
    ],
    'Finance': [
      ['Health Insurance', 'Dental Insurance', 'Vision Insurance', '401(k) Matching', 'Performance Bonus', 'Professional Development', 'Transportation Allowance', 'Stock Options'],
      ['Health Insurance', 'Dental Insurance', 'Vision Insurance', '401(k) Matching', 'Performance Bonus', 'Professional Development', 'Life Insurance', 'Flexible Hours'],
      ['Health Insurance', 'Dental Insurance', 'Vision Insurance', '401(k) Matching', 'Performance Bonus', 'Professional Development', 'Transportation Allowance', 'Gym Membership'],
      ['Health Insurance', 'Dental Insurance', 'Vision Insurance', '401(k) Matching', 'Performance Bonus', 'Professional Development', 'Stock Options', 'Free Meals']
    ],
    'Education': [
      ['Health Insurance', 'Dental Insurance', 'Paid Time Off', 'Professional Development', 'Tuition Reimbursement', 'Flexible Hours', 'Summer Break', 'Mental Health Support'],
      ['Health Insurance', 'Dental Insurance', 'Paid Time Off', 'Professional Development', 'Tuition Reimbursement', 'Flexible Hours', 'Childcare Support', 'Gym Membership'],
      ['Health Insurance', 'Dental Insurance', 'Paid Time Off', 'Professional Development', 'Tuition Reimbursement', 'Flexible Hours', 'Summer Break', 'Transportation Allowance'],
      ['Health Insurance', 'Dental Insurance', 'Paid Time Off', 'Professional Development', 'Tuition Reimbursement', 'Flexible Hours', 'Mental Health Support', 'Equipment Allowance']
    ],
    'Manufacturing': [
      ['Health Insurance', 'Dental Insurance', 'Vision Insurance', 'Life Insurance', 'Paid Time Off', 'Overtime Pay', 'Safety Training', 'Transportation Allowance'],
      ['Health Insurance', 'Dental Insurance', 'Vision Insurance', 'Life Insurance', 'Paid Time Off', 'Overtime Pay', 'Safety Training', 'Gym Membership'],
      ['Health Insurance', 'Dental Insurance', 'Vision Insurance', 'Life Insurance', 'Paid Time Off', 'Overtime Pay', 'Safety Training', 'Performance Bonus'],
      ['Health Insurance', 'Dental Insurance', 'Vision Insurance', 'Life Insurance', 'Paid Time Off', 'Overtime Pay', 'Safety Training', '401(k) Matching']
    ],
    'Retail': [
      ['Health Insurance', 'Employee Discount', 'Flexible Hours', 'Paid Time Off', 'Professional Development', 'Performance Bonus', 'Seasonal Bonuses', 'Team Events'],
      ['Health Insurance', 'Employee Discount', 'Flexible Hours', 'Paid Time Off', 'Professional Development', 'Performance Bonus', 'Dental Insurance', 'Mental Health Support'],
      ['Health Insurance', 'Employee Discount', 'Flexible Hours', 'Paid Time Off', 'Professional Development', 'Performance Bonus', 'Seasonal Bonuses', 'Gym Membership'],
      ['Health Insurance', 'Employee Discount', 'Flexible Hours', 'Paid Time Off', 'Professional Development', 'Performance Bonus', 'Seasonal Bonuses', 'Transportation Allowance']
    ],
    'Consulting': [
      ['Health Insurance', 'Dental Insurance', 'Professional Development', 'Performance Bonus', 'Flexible Hours', 'Remote Work', 'Travel Allowance', 'Client Entertainment'],
      ['Health Insurance', 'Dental Insurance', 'Professional Development', 'Performance Bonus', 'Flexible Hours', 'Remote Work', 'Travel Allowance', '401(k) Matching'],
      ['Health Insurance', 'Dental Insurance', 'Professional Development', 'Performance Bonus', 'Flexible Hours', 'Remote Work', 'Travel Allowance', 'Gym Membership'],
      ['Health Insurance', 'Dental Insurance', 'Professional Development', 'Performance Bonus', 'Flexible Hours', 'Remote Work', 'Travel Allowance', 'Stock Options']
    ],
    'Media': [
      ['Health Insurance', 'Dental Insurance', 'Creative Freedom', 'Flexible Hours', 'Professional Development', 'Equipment Allowance', 'Remote Work', 'Team Collaboration'],
      ['Health Insurance', 'Dental Insurance', 'Creative Freedom', 'Flexible Hours', 'Professional Development', 'Equipment Allowance', 'Remote Work', 'Mental Health Support'],
      ['Health Insurance', 'Dental Insurance', 'Creative Freedom', 'Flexible Hours', 'Professional Development', 'Equipment Allowance', 'Remote Work', 'Gym Membership'],
      ['Health Insurance', 'Dental Insurance', 'Creative Freedom', 'Flexible Hours', 'Professional Development', 'Equipment Allowance', 'Remote Work', 'Free Meals']
    ],
    'Real Estate': [
      ['Health Insurance', 'Commission Structure', 'Flexible Hours', 'Professional Development', 'Marketing Support', 'Technology Tools', 'Networking Events', 'Performance Bonuses'],
      ['Health Insurance', 'Commission Structure', 'Flexible Hours', 'Professional Development', 'Marketing Support', 'Technology Tools', 'Networking Events', '401(k) Matching'],
      ['Health Insurance', 'Commission Structure', 'Flexible Hours', 'Professional Development', 'Marketing Support', 'Technology Tools', 'Networking Events', 'Dental Insurance'],
      ['Health Insurance', 'Commission Structure', 'Flexible Hours', 'Professional Development', 'Marketing Support', 'Technology Tools', 'Networking Events', 'Transportation Allowance']
    ],
    'Marketing & Advertising': [
      ['Health Insurance', 'Dental Insurance', 'Creative Freedom', 'Flexible Hours', 'Professional Development', 'Remote Work', 'Team Events', 'Client Entertainment'],
      ['Health Insurance', 'Dental Insurance', 'Creative Freedom', 'Flexible Hours', 'Professional Development', 'Remote Work', 'Team Events', 'Gym Membership'],
      ['Health Insurance', 'Dental Insurance', 'Creative Freedom', 'Flexible Hours', 'Professional Development', 'Remote Work', 'Team Events', '401(k) Matching'],
      ['Health Insurance', 'Dental Insurance', 'Creative Freedom', 'Flexible Hours', 'Professional Development', 'Remote Work', 'Team Events', 'Free Meals']
    ]
  };

  const industryBenefitSets = allBenefits[industry] || [
    ['Health Insurance', 'Dental Insurance', 'Paid Time Off', 'Professional Development', 'Flexible Hours', 'Performance Bonus', 'Team Events', 'Mental Health Support'],
    ['Health Insurance', 'Dental Insurance', 'Paid Time Off', 'Professional Development', 'Flexible Hours', 'Performance Bonus', 'Gym Membership', '401(k) Matching'],
    ['Health Insurance', 'Dental Insurance', 'Paid Time Off', 'Professional Development', 'Flexible Hours', 'Performance Bonus', 'Transportation Allowance', 'Stock Options'],
    ['Health Insurance', 'Dental Insurance', 'Paid Time Off', 'Professional Development', 'Flexible Hours', 'Performance Bonus', 'Equipment Allowance', 'Free Meals']
  ];

  // Add randomization based on company name and existing data
  const companyNameLength = companyName && typeof companyName === 'string' ? companyName.length : 0;
  const founded = typeof existingData?.founded === 'number' ? existingData.founded : 0;
  const sizeLength = existingData?.size && typeof existingData.size === 'string' ? existingData.size.length : 0;
  const seed = companyNameLength + founded + sizeLength;
  const randomIndex = seed % industryBenefitSets.length;
  
  return industryBenefitSets[randomIndex];
}

function generateSpecialties(companyName: string, industry: string, existingData?: Record<string, unknown>, _userInput?: string): string[] {
  const allSpecialties = {
    'Technology': [
      ['Software Development', 'Cloud Computing', 'Artificial Intelligence', 'Data Analytics', 'Cybersecurity', 'Mobile Development', 'DevOps', 'Machine Learning'],
      ['Web Development', 'Cloud Computing', 'Artificial Intelligence', 'Data Science', 'Cybersecurity', 'Mobile Development', 'DevOps', 'Blockchain'],
      ['Software Development', 'Cloud Computing', 'Artificial Intelligence', 'Data Analytics', 'Cybersecurity', 'Mobile Development', 'DevOps', 'IoT'],
      ['Software Development', 'Cloud Computing', 'Artificial Intelligence', 'Data Analytics', 'Cybersecurity', 'Mobile Development', 'DevOps', 'AR/VR']
    ],
    'Healthcare': [
      ['Patient Care', 'Medical Technology', 'Telemedicine', 'Health Analytics', 'Preventive Care', 'Medical Research', 'Digital Health', 'Clinical Trials'],
      ['Patient Care', 'Medical Technology', 'Telemedicine', 'Health Analytics', 'Preventive Care', 'Medical Research', 'Digital Health', 'Pharmaceuticals'],
      ['Patient Care', 'Medical Technology', 'Telemedicine', 'Health Analytics', 'Preventive Care', 'Medical Research', 'Digital Health', 'Mental Health'],
      ['Patient Care', 'Medical Technology', 'Telemedicine', 'Health Analytics', 'Preventive Care', 'Medical Research', 'Digital Health', 'Rehabilitation']
    ],
    'Finance': [
      ['Investment Management', 'Financial Planning', 'Risk Assessment', 'Digital Banking', 'Financial Technology', 'Wealth Management', 'Insurance', 'Trading'],
      ['Investment Management', 'Financial Planning', 'Risk Assessment', 'Digital Banking', 'Financial Technology', 'Wealth Management', 'Insurance', 'Cryptocurrency'],
      ['Investment Management', 'Financial Planning', 'Risk Assessment', 'Digital Banking', 'Financial Technology', 'Wealth Management', 'Insurance', 'Real Estate Finance'],
      ['Investment Management', 'Financial Planning', 'Risk Assessment', 'Digital Banking', 'Financial Technology', 'Wealth Management', 'Insurance', 'Corporate Finance']
    ],
    'Education': [
      ['Curriculum Development', 'Online Learning', 'Educational Technology', 'Student Assessment', 'Teacher Training', 'Educational Research', 'Learning Analytics', 'Special Education'],
      ['Curriculum Development', 'Online Learning', 'Educational Technology', 'Student Assessment', 'Teacher Training', 'Educational Research', 'Learning Analytics', 'STEM Education'],
      ['Curriculum Development', 'Online Learning', 'Educational Technology', 'Student Assessment', 'Teacher Training', 'Educational Research', 'Learning Analytics', 'Language Learning'],
      ['Curriculum Development', 'Online Learning', 'Educational Technology', 'Student Assessment', 'Teacher Training', 'Educational Research', 'Learning Analytics', 'Vocational Training']
    ],
    'Manufacturing': [
      ['Quality Control', 'Process Optimization', 'Supply Chain Management', 'Automation', 'Lean Manufacturing', 'Product Development', 'Safety Management', 'Sustainability'],
      ['Quality Control', 'Process Optimization', 'Supply Chain Management', 'Automation', 'Lean Manufacturing', 'Product Development', 'Safety Management', '3D Printing'],
      ['Quality Control', 'Process Optimization', 'Supply Chain Management', 'Automation', 'Lean Manufacturing', 'Product Development', 'Safety Management', 'Robotics'],
      ['Quality Control', 'Process Optimization', 'Supply Chain Management', 'Automation', 'Lean Manufacturing', 'Product Development', 'Safety Management', 'Green Manufacturing']
    ],
    'Retail': [
      ['Customer Experience', 'Inventory Management', 'E-commerce', 'Visual Merchandising', 'Supply Chain', 'Digital Marketing', 'Customer Analytics', 'Omnichannel Retail'],
      ['Customer Experience', 'Inventory Management', 'E-commerce', 'Visual Merchandising', 'Supply Chain', 'Digital Marketing', 'Customer Analytics', 'Personalization'],
      ['Customer Experience', 'Inventory Management', 'E-commerce', 'Visual Merchandising', 'Supply Chain', 'Digital Marketing', 'Customer Analytics', 'Mobile Commerce'],
      ['Customer Experience', 'Inventory Management', 'E-commerce', 'Visual Merchandising', 'Supply Chain', 'Digital Marketing', 'Customer Analytics', 'Social Commerce']
    ],
    'Consulting': [
      ['Strategic Planning', 'Business Process Improvement', 'Change Management', 'Digital Transformation', 'Organizational Development', 'Performance Management', 'Risk Management', 'Market Research'],
      ['Strategic Planning', 'Business Process Improvement', 'Change Management', 'Digital Transformation', 'Organizational Development', 'Performance Management', 'Risk Management', 'Technology Consulting'],
      ['Strategic Planning', 'Business Process Improvement', 'Change Management', 'Digital Transformation', 'Organizational Development', 'Performance Management', 'Risk Management', 'Financial Consulting'],
      ['Strategic Planning', 'Business Process Improvement', 'Change Management', 'Digital Transformation', 'Organizational Development', 'Performance Management', 'Risk Management', 'HR Consulting']
    ],
    'Media': [
      ['Content Creation', 'Digital Marketing', 'Social Media', 'Video Production', 'Graphic Design', 'Brand Strategy', 'Public Relations', 'Media Planning'],
      ['Content Creation', 'Digital Marketing', 'Social Media', 'Video Production', 'Graphic Design', 'Brand Strategy', 'Public Relations', 'Podcasting'],
      ['Content Creation', 'Digital Marketing', 'Social Media', 'Video Production', 'Graphic Design', 'Brand Strategy', 'Public Relations', 'Live Streaming'],
      ['Content Creation', 'Digital Marketing', 'Social Media', 'Video Production', 'Graphic Design', 'Brand Strategy', 'Public Relations', 'Influencer Marketing']
    ],
    'Real Estate': [
      ['Property Management', 'Real Estate Investment', 'Commercial Real Estate', 'Residential Sales', 'Property Development', 'Real Estate Finance', 'Market Analysis', 'Property Valuation'],
      ['Property Management', 'Real Estate Investment', 'Commercial Real Estate', 'Residential Sales', 'Property Development', 'Real Estate Finance', 'Market Analysis', 'Property Technology'],
      ['Property Management', 'Real Estate Investment', 'Commercial Real Estate', 'Residential Sales', 'Property Development', 'Real Estate Finance', 'Market Analysis', 'Real Estate Marketing'],
      ['Property Management', 'Real Estate Investment', 'Commercial Real Estate', 'Residential Sales', 'Property Development', 'Real Estate Finance', 'Market Analysis', 'Property Management Technology']
    ],
    'Marketing & Advertising': [
      ['Brand Strategy', 'Digital Marketing', 'Content Marketing', 'Social Media Marketing', 'Advertising Campaigns', 'Market Research', 'Creative Design', 'Performance Analytics'],
      ['Brand Strategy', 'Digital Marketing', 'Content Marketing', 'Social Media Marketing', 'Advertising Campaigns', 'Market Research', 'Creative Design', 'Influencer Marketing'],
      ['Brand Strategy', 'Digital Marketing', 'Content Marketing', 'Social Media Marketing', 'Advertising Campaigns', 'Market Research', 'Creative Design', 'Email Marketing'],
      ['Brand Strategy', 'Digital Marketing', 'Content Marketing', 'Social Media Marketing', 'Advertising Campaigns', 'Market Research', 'Creative Design', 'Search Engine Marketing']
    ]
  };

  const industrySpecialtySets = allSpecialties[industry] || [
    ['Customer Service', 'Quality Assurance', 'Process Improvement', 'Team Leadership', 'Strategic Planning', 'Innovation', 'Project Management', 'Performance Optimization'],
    ['Customer Service', 'Quality Assurance', 'Process Improvement', 'Team Leadership', 'Strategic Planning', 'Innovation', 'Project Management', 'Data Analysis'],
    ['Customer Service', 'Quality Assurance', 'Process Improvement', 'Team Leadership', 'Strategic Planning', 'Innovation', 'Project Management', 'Communication'],
    ['Customer Service', 'Quality Assurance', 'Process Improvement', 'Team Leadership', 'Strategic Planning', 'Innovation', 'Project Management', 'Problem Solving']
  ];

  // Add randomization based on company name and existing data
  const locationLength = existingData?.location && typeof existingData.location === 'string' ? existingData.location.length : 0;
  const founded = typeof existingData?.founded === 'number' ? existingData.founded : 0;
  const seed = companyName.length + founded + locationLength;
  const randomIndex = seed % industrySpecialtySets.length;
  
  return industrySpecialtySets[randomIndex];
}

function generateMission(companyName: string, industry: string, existingData?: Record<string, unknown>, _userInput?: string): string {
  const missionVariations = {
    'Technology': [
      `To empower businesses and individuals through innovative technology solutions that drive growth, efficiency, and positive change in the digital world.`,
      `To create cutting-edge technology that solves real-world problems and makes a meaningful impact on how people live, work, and connect.`,
      `To democratize access to technology and enable organizations of all sizes to compete and thrive in the digital economy.`,
      `To build the future through technology that is not only powerful but also accessible, sustainable, and human-centered.`
    ],
    'Healthcare': [
      `To improve lives and advance healthcare through innovative solutions that make quality medical care more accessible, effective, and compassionate.`,
      `To transform healthcare delivery by combining cutting-edge technology with human expertise to achieve better patient outcomes.`,
      `To make healthcare more accessible and affordable while maintaining the highest standards of quality and patient care.`,
      `To advance medical science and improve global health through innovative research, technology, and compassionate care.`
    ],
    'Finance': [
      `To empower individuals and businesses to achieve their financial goals through innovative, transparent, and accessible financial solutions.`,
      `To democratize access to financial services and help people build wealth, manage risk, and secure their financial future.`,
      `To create a more inclusive financial system that serves everyone, regardless of their background or circumstances.`,
      `To provide trusted financial guidance and innovative solutions that help our clients navigate an ever-changing economic landscape.`
    ],
    'Education': [
      `To transform education through innovative learning solutions that prepare students for success in an ever-changing world.`,
      `To make quality education accessible to everyone and empower learners to reach their full potential.`,
      `To create engaging, effective learning experiences that inspire curiosity, critical thinking, and lifelong learning.`,
      `To bridge the gap between traditional education and the skills needed for the future workforce.`
    ],
    'Manufacturing': [
      `To manufacture high-quality products that improve lives while maintaining the highest standards of sustainability and innovation.`,
      `To lead the transformation of manufacturing through smart technology, sustainable practices, and continuous innovation.`,
      `To create products that meet the highest quality standards while minimizing environmental impact and maximizing efficiency.`,
      `To be the manufacturing partner of choice by delivering excellence, innovation, and reliability in everything we produce.`
    ],
    'Retail': [
      `To create exceptional shopping experiences that connect customers with products they love while building lasting relationships.`,
      `To make shopping more convenient, enjoyable, and accessible while supporting the communities we serve.`,
      `To curate and deliver products that enhance our customers' lives while maintaining the highest standards of quality and service.`,
      `To revolutionize retail through innovation, customer focus, and a commitment to excellence in every interaction.`
    ],
    'Consulting': [
      `To help organizations navigate complex challenges and achieve sustainable growth through strategic insights and innovative solutions.`,
      `To empower businesses to reach their full potential through expert guidance, strategic thinking, and proven methodologies.`,
      `To be the trusted partner that helps organizations transform, adapt, and thrive in an ever-changing business landscape.`,
      `To deliver exceptional consulting services that drive real results and create lasting value for our clients.`
    ],
    'Media': [
      `To create compelling content and experiences that inform, entertain, and inspire audiences while fostering meaningful connections.`,
      `To tell stories that matter and use the power of media to create positive change in the world.`,
      `To produce innovative content that engages diverse audiences and builds bridges between different communities.`,
      `To be the creative force that brings ideas to life and connects people through powerful storytelling and visual experiences.`
    ],
    'Real Estate': [
      `To help people find their perfect place to call home while building strong communities and lasting relationships.`,
      `To make real estate transactions seamless, transparent, and successful for all parties involved.`,
      `To be the trusted real estate partner that helps clients make informed decisions and achieve their property goals.`,
      `To transform the real estate experience through innovation, expertise, and a commitment to client success.`
    ],
    'Marketing & Advertising': [
      `To help brands connect with their audiences through creative campaigns and strategic marketing that drive real results.`,
      `To create marketing solutions that not only capture attention but also build lasting relationships between brands and consumers.`,
      `To be the creative and strategic partner that helps businesses grow through innovative marketing and advertising solutions.`,
      `To transform how brands communicate with their audiences through data-driven creativity and strategic thinking.`
    ]
  };

  const industryMissions = missionVariations[industry] || [
    `To deliver exceptional value to our customers while maintaining the highest standards of quality, innovation, and service excellence.`,
    `To be the trusted partner that helps our clients achieve their goals through innovative solutions and dedicated service.`,
    `To create positive impact in our industry and community through excellence, integrity, and continuous innovation.`,
    `To build lasting relationships with our customers and partners while delivering products and services that exceed expectations.`
  ];

  const founded = typeof existingData?.founded === 'number' ? existingData.founded : 0;
  const sizeLength = existingData?.size && typeof existingData.size === 'string' ? existingData.size.length : 0;
  const seed = companyName.length + founded + sizeLength;
  const randomIndex = seed % industryMissions.length;
  
  return industryMissions[randomIndex];
}

function generateVision(companyName: string, industry: string, existingData?: Record<string, unknown>, _userInput?: string): string {
  const visionVariations = {
    'Technology': [
      `To be the leading technology company that shapes the future through innovation, making advanced technology accessible to everyone.`,
      `To create a world where technology seamlessly integrates into daily life, making everything more efficient, connected, and intelligent.`,
      `To be the catalyst for digital transformation, helping organizations and individuals thrive in an increasingly connected world.`,
      `To build a future where technology serves humanity, solving global challenges and creating opportunities for all.`
    ],
    'Healthcare': [
      `To create a world where quality healthcare is accessible to everyone, regardless of location, income, or background.`,
      `To be the global leader in healthcare innovation, transforming how medical care is delivered and experienced.`,
      `To eliminate health disparities and create a future where everyone has access to the care they need to live their best life.`,
      `To revolutionize healthcare through technology, making it more personalized, preventive, and patient-centered.`
    ],
    'Finance': [
      `To create a more inclusive and transparent financial system that empowers everyone to build wealth and achieve financial security.`,
      `To be the trusted financial partner that helps people and businesses navigate an ever-changing economic landscape with confidence.`,
      `To democratize access to financial services and create opportunities for economic growth and prosperity for all.`,
      `To transform the financial industry through innovation, making complex financial concepts simple and accessible to everyone.`
    ],
    'Education': [
      `To create a world where quality education is accessible to everyone, preparing learners for success in the 21st century.`,
      `To be the global leader in educational innovation, transforming how people learn and acquire new skills throughout their lives.`,
      `To eliminate educational barriers and create opportunities for lifelong learning and personal growth for all.`,
      `To revolutionize education through technology, making learning more engaging, effective, and accessible to everyone.`
    ],
    'Manufacturing': [
      `To be the global leader in sustainable manufacturing, creating products that improve lives while protecting our planet.`,
      `To revolutionize manufacturing through smart technology, creating a future where production is efficient, sustainable, and human-centered.`,
      `To be the manufacturing partner of choice, known for innovation, quality, and commitment to environmental responsibility.`,
      `To create a manufacturing ecosystem that drives economic growth while maintaining the highest standards of sustainability and ethics.`
    ],
    'Retail': [
      `To be the world's most customer-centric retail company, creating seamless and delightful shopping experiences everywhere.`,
      `To revolutionize retail by making shopping more convenient, personalized, and enjoyable for customers around the globe.`,
      `To be the retail leader that connects people with products they love while building strong, sustainable communities.`,
      `To create the future of retail, where technology and human touch combine to create exceptional customer experiences.`
    ],
    'Consulting': [
      `To be the world's most trusted consulting partner, helping organizations navigate change and achieve extraordinary results.`,
      `To be the global leader in business transformation, empowering organizations to adapt, innovate, and thrive in any environment.`,
      `To create a world where every organization has access to the strategic insights and expertise they need to succeed.`,
      `To be the catalyst for positive change in business, helping organizations create value for all their stakeholders.`
    ],
    'Media': [
      `To be the global media leader that creates content that informs, entertains, and inspires positive change worldwide.`,
      `To create a world where media brings people together, fostering understanding and connection across cultures and communities.`,
      `To be the creative force that shapes culture and drives social progress through powerful storytelling and visual experiences.`,
      `To revolutionize media by creating content that not only entertains but also educates and empowers audiences globally.`
    ],
    'Real Estate': [
      `To be the world's most trusted real estate company, helping people find their perfect place to call home.`,
      `To revolutionize real estate by making property transactions transparent, efficient, and accessible to everyone.`,
      `To be the global leader in real estate innovation, creating communities where people can live, work, and thrive.`,
      `To transform the real estate industry by making property ownership and investment accessible to people from all walks of life.`
    ],
    'Marketing & Advertising': [
      `To be the world's most creative and effective marketing agency, helping brands build meaningful connections with their audiences.`,
      `To revolutionize marketing by creating campaigns that not only drive sales but also build lasting brand loyalty and trust.`,
      `To be the global leader in marketing innovation, helping brands navigate the digital landscape and reach their full potential.`,
      `To create a world where marketing serves both business goals and human values, building brands that make a positive impact.`
    ]
  };

  const industryVisions = visionVariations[industry] || [
    `To be the global leader in our industry, known for innovation, excellence, and positive impact on the communities we serve.`,
    `To create a world where our products and services make a meaningful difference in people's lives and businesses.`,
    `To be the trusted partner that helps our clients and customers achieve their goals and reach their full potential.`,
    `To build a sustainable future where our business success is measured not just by profit, but by the positive impact we create.`
  ];

  const locationLength = existingData?.location && typeof existingData.location === 'string' ? existingData.location.length : 0;
  const founded = typeof existingData?.founded === 'number' ? existingData.founded : 0;
  const seed = companyName.length + founded + locationLength;
  const randomIndex = seed % industryVisions.length;
  
  return industryVisions[randomIndex];
}
