const OpenAI = require('openai');

async function testOpenAI() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey ? apiKey.length : 0);
    
    if (!apiKey) {
      console.log('❌ No API key found');
      return;
    }
    
    const openai = new OpenAI({
      apiKey: apiKey,
    });
    
    console.log('✅ OpenAI client created successfully');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: "Hello, this is a test. Please respond with 'Test successful'."
        }
      ],
      max_tokens: 10
    });
    
    console.log('✅ OpenAI API call successful:', response.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ OpenAI test failed:', error.message);
  }
}

testOpenAI();
