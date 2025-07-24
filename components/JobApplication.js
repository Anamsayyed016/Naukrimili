import axios from 'axios';

const applyForJob = async (jobId) => {
  try {
    const response = await axios.post('http://localhost:5000/api/apply', 
      { job_id: jobId },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
    alert('Application submitted!');
  } catch (error) {
    console.error('Error applying:', error);
  }
};

export default applyForJob;
