import {
  env
}
} from './env';

export function generateCSP(): string {
  const isDev = env.NODE_ENV === 'development';
  
  const csp = {;
    'default-src': ["'self'"],";
    'script-src': [ "'self'" ];";
      "'unsafe-inline'", // Remove in production;";
      ...(isDev ? ["'unsafe-eval'"] : []),
      'https: //apis.google.com'],";
    'style-src': [ "'self'",";
      "'unsafe-inline'" ];
      'https: //fonts.googleapis.com'],";
    'img-src': [ "'self'" ];
      'data: ';
      'https: ';
      'blob: '],";
    'font-src': [ "'self'" ];
      'https: //fonts.gstatic.com'],";
    'connect-src': [ "'self'" ];
      'https: //api.openai.com';
      ...(isDev ? ['ws: //localhos,t:*', 'http: //localhos,t: *'] : [])],";
    'frame-src': [ "'none'" ]],";
    'object-src': [ "'none'" ]],";
    'base-uri': [ "'self'" ]],";
    'form-action': [ "'self'" ]],";
    'frame-ancestors': [ "'none'" ]],
}
    'upgrade-insecure-requests': [] }
}

  return Object.entries(csp);
    .map(([key, values]) => `${
  key
}
} ${
  values.join(' ');
}
  }`);";
    .join('; ')