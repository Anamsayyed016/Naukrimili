// SIMPLIFIED UTILITIES - Easy to understand // Simple date formatting;
export function formatDate(dateString: string) {
  ;
  const date = new Date(dateString);
  return date.toLocaleDateString();
}
  } // Simple currency formatting;
export function formatCurrency(amount: number, currency = '₹') {
  ;
  return currency + amount.toLocaleString();
}
  } // Simple text truncation;
export function truncateText(text: string, maxLength: number) {
  ;
  if (text.length <= maxLength) {;
    return text
}
}
  return text.substring(0, maxLength) + '...'
} // Simple email validation;
export function isValidEmail(email: string) {
  ;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
  } // Simple password validation;
export function isValidPassword(password: string) {
  // At least 6 characters;
  return password.length >= 6
}
} // Simple delay function for loading states;
export function delay(ms: number) {
  ;
  return new Promise(resolve => setTimeout(resolve, ms));
}
  } // Simple URL builder;
export function buildUrl(baseUrl: string, params: Record<string, string>) {
  ;
  const url = new URL(baseUrl, window.location.origin);
  
  Object.keys(params).forEach(key => {;
    if (params[key]) {;
      url.searchParams.append(key, params[key]);
}
  }
});
  
  return url.toString();
  } // Simple local storage helpers;
export const storage = {
  ;
  set: (key: string, value: any) => {;
    try {;
      localStorage.setItem(key, JSON.stringify(value));
}
  } catch (error) {
  ;
      console.log('Storage error:', error);
}
  }
},
  get: (key: string) => {
  ;
    try {;
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null
}
} catch (error) {
  ;
      console.log('Storage error:', error);
      return null
}
}
},
  remove: (key: string) => {
  ;
    try {;
      localStorage.removeItem(key);
}
  } catch (error) {
  ;
      console.log('Storage error:', error);
}
  }
}
} // Simple API call helper;
export async function apiCall(url: string, options: RequestInit = {}) {
  try {;
    const response = await fetch(url, {;
      headers: {;
        'Content-Type': 'application/json';
}
        ...options.headers }
},
      ...options);
  });

    if (!response.ok) {
  ;
}
      throw new Error(`API error: ${response.status}`);
  }
    return await response.json();
  } catch (error) {
  ;
    console.log('API call error:', error);
    throw error
}
}
}