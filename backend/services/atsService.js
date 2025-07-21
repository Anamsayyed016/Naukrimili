// Mock ATS analysis service
// In production, integrate with real ATS solutions or build custom algorithms
const analyzeATSCompatibility = async (resume, job) => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock ATS compatibility analysis
  const matchScore = Math.floor(Math.random() * 30) + 70; // Random score between 70-100

  const keywordMatches = [
    "JavaScript", "React", "Node.js"
  ]; // Mock matched keywords

  const missingKeywords = [
    "AWS", "GraphQL"
  ]; // Mock missing keywords

  const recommendations = [
    "Add more industry-specific keywords",
    "Increase detail in work experience descriptions",
    "Include more quantifiable achievements"
  ]; // Mock recommendations

  const skillsAlignment = resume.aiData.skills.filter(skill => job.requirements.includes(skill));

  return {
    matchScore,
    keywordMatches,
    missingKeywords,
    recommendations,
    skillsAlignment
  };
};

module.exports = {
  analyzeATSCompatibility
};
