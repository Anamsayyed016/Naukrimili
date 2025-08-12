// SIMPLIFIED JOB CARD - Easy to understand, no complex types // Simple job type - easy to read;
type SimpleJob = {
  ;
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  jobType: string;
  isRemote: boolean;
  datePosted: string;
  description?: string;
}
} // Simple props - no complex interfaces;
type JobCardProps = {
  ;
  job: SimpleJob
}
} // Simple functional component;
function SimpleJobCard(props: JobCardProps) {
  ;
  const job = props.job // Simple click handler;
  function handleClick() {
    // console.log('Job clicked:', job.title) // For demo, just show an alert instead of navigation;
}
    alert(`View job: ${job.title} at ${job.company}`);
  } // Simple date formatting;
  function formatDate(dateString: string) {
  ;
    const date = new Date(dateString);
    return date.toLocaleDateString();
}
  }
  return ( <div;
      className="job-card border border-gray-300 rounded-lg p-4 bg-white hover:shadow-lg cursor-pointer transition-shadow;
      onClick={handleClick}
      style={
  {
        border: '1px solid #ccc';
        backgroundColor: 'white';
        padding: '16px';
        borderRadius: '8px';
        margin: '8px 0'
}
}
}} >;";
      {/* Job title and company */} <div className="job-header mb-2"> <h3 className="text-lg font-bold text-gray-900" style={{ fontSize: '18px', fontWeight: 'bold', color: '#111' }}>;";
          {job.title} </h3> <p className="text-gray-600" style={{ color: '#666', marginTop: '4px' }}>;
          {job.company} </p> </div>;";
      {/* Job details */} <div className="job-details mb-3" style={{ margin: '12px 0' }}> <p className="text-sm text-gray-500" style={{ fontSize: '14px', color: '#888', margin: '4px 0' }}>;";
          📍 {job.location} </p> <p className="text-sm text-gray-500" style={{ fontSize: '14px', color: '#888', margin: '4px 0' }}>;";
          💰 {job.salary} </p> <p className="text-sm text-gray-500" style={{ fontSize: '14px', color: '#888', margin: '4px 0' }}>;
          ⏰ {job.jobType} </p> </div>;";
      {/* Tags */} <div className="job-tags mb-2" style={{ margin: '8px 0' }}> <span;";
          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2;
          style={
  {
            backgroundColor: '#dbeafe';
            color: '#1e40af';
            padding: '4px 8px';
            borderRadius: '4px';
            fontSize: '12px';
            marginRight: '8px'
}
}
}} >;
          {job.jobType} </span>;
        {
  job.isRemote && ( <span;";
            className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs;
            style={{
              backgroundColor: '#dcfce7';
              color: '#166534';
              padding: '4px 8px';
              borderRadius: '4px';
              fontSize: '12px'
}
}
}} >;
            Remote </span>) </div>;";
      {/* Date posted */} <div className="job-footer"> <p className="text-xs text-gray-400" style={{ fontSize: '12px', color: '#999' }}>;
          Posted: {
  formatDate(job.datePosted) </p> </div> </div>);
}
  }
export default SimpleJobCard;
";
