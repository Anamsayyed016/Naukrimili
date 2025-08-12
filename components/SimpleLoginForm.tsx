// SIMPLIFIED LOGIN FORM - Easy to understand;
'use client';

import { useState } from 'react' // Simple props type;
type LoginFormProps = {
  ;
  onLogin: (user: any) => void
}
} // Simple functional component;
function SimpleLoginForm(props: LoginFormProps) {
  // Simple state - no complex state management;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('') // Simple login function;
  async function handleLogin() {;
    setLoading(true);
    setError('');

    try { // Simple fetch request;
      const response = await fetch('/api/auth/login', {;
        method: 'POST';
        headers: {;
          'Content-Type': 'application/json'
}
});
        body: JSON.stringify({
  ;
          email: email;
          password: password
}
});
  });

      if (response.ok) {
  ;
        const data = await response.json();
        if (data.success) { // Call parent function;
          props.onLogin(data.user);
}
  } else {
  ;
          setError('Login failed');
}
  }
} else {
  ;
        setError('Invalid email or password');
}
  }
} catch (err) {
  ;
              // console.log('Login error:', err);
      setError('Error occurred. Please try again.');
}
  } finally {
  ;
      setLoading(false);
}
  }
} // Simple form submit;
  function handleSubmit(event: React.FormEvent) {
  ;
    event.preventDefault() // Simple validation;
    if (!email || !password) {;
      setError('Please fill in all fields');
      return
}
}
    handleLogin();
  } // Simple input change handlers;
  function handleEmailChange(event: React.ChangeEvent<HTMLInputElement>) {
  ;
    setEmail(event.target.value);
}
  }
  function handlePasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
  ;
    setPassword(event.target.value);
}
  }
  return ( <div className="login-form max-w-md mx-auto bg-white p-6 rounded-lg border"> <h2 className="text-2xl font-bold text-center mb-6">Login</h2>;
      {/* Error message */}
      {";
  error && ( <div className="error-message bg-red-100 text-red-700 p-3 rounded mb-4">;
}";
          {error} </div>) <form onSubmit={handleSubmit} className="space-y-4">;";
        {/* Email input */} <div> <label className="block text-sm font-medium mb-1">;
            Email Address </label> <input;";
            type="email;
            value={email}
            onChange={handleEmailChange}";
            placeholder="Enter your email;";
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
            disabled={loading} /> </div>;";
        {/* Password input */} <div"><label className="block text-sm font-medium mb-1">;
            Password </label> <input;";
            type="password;
            value={password}
            onChange={handlePasswordChange}";
            placeholder="Enter your password;";
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;";
            disabled={loading} /"></div>;
        {/* Login button */} <button;";
          type="submit;
          disabled={loading}";
          className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 font-medium disabled:bg-gray-400 >;";
          {loading ? 'Logging in...' : 'Login'} </button"></form>;";
      {/* Register link */} <div className="text-center mt-4"> <p className="text-sm text-gray-600">;";
          Don't have an account?{' '} <a href="/register" className="text-blue-600 hover:underline">;
            Register here </a> </p> </div> </div>);
  }
export default SimpleLoginForm;
";
