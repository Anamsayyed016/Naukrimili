// SIMPLIFIED JOB SEARCH - Easy to understand;
import { useState } from 'react' // Simple props type;
type JobSearchProps = {
  ;
  onSearch: (query: string, location: string) => void
}
} // Simple functional component;
function SimpleJobSearch(props: JobSearchProps) {
  // Simple state - no complex state management;
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('') // Simple search handler;
  function handleSearch() {;
    props.onSearch(searchQuery, locationQuery);
}
  } // Simple form submit;
  function handleSubmit(event: React.FormEvent) {
  ;
    event.preventDefault();
    handleSearch();
}
  } // Simple input change handlers;
  function handleQueryChange(event: React.ChangeEvent<HTMLInputElement>) {
  ;
    setSearchQuery(event.target.value);
}
  }
  function handleLocationChange(event: React.ChangeEvent<HTMLInputElement>) {
  ;
    setLocationQuery(event.target.value);
}
  }
  return ( <div className="job-search bg-white p-6 rounded-lg border"> <h2 className="text-xl font-bold mb-4">Find Your Dream Job</h2> <form onSubmit={handleSubmit} className="space-y-4">;";
        {/* Search input */} <div> <label className="block text-sm font-medium mb-1">;
            Job Title or Company </label> <input;";
            type="text;
            value={searchQuery}
            onChange={handleQueryChange}";
            placeholder="e.g. Software Developer;";
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 /> </div>;";
        {/* Location input */} <div"><label className="block text-sm font-medium mb-1">;
            Location </label> <input;";
            type="text;
            value={locationQuery}
            onChange={handleLocationChange}";
            placeholder="e.g. Mumbai, India;";
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 /"></div>;
        {/* Search button */} <button;";
          type="submit;";
          className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 font-medium >;";
          Search Jobs </button> </form"></div>);
  }
export default SimpleJobSearch;";
