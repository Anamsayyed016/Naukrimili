/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable problematic features that cause chunk issues
  experimental: {
    optimizeCss: false, // Disable CSS optimization
    scrollRestoration: true,
  },
  
  // Disable output optimization that can cause chunk issues
  output: undefined,
  
  // Simplified webpack configuration
  webpack: (config, { dev, isServer, webpack }) => {
    // Disable chunk splitting in production to prevent missing chunks
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Single vendor chunk to prevent missing chunks
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all',
            enforce: true,
          },
        },
      };
      
      // Ensure proper chunk loading
      config.output.chunkLoadingGlobal = 'webpackChunkjobportal';
      config.output.globalObject = 'self';
    }
    
    // Fix for missing chunks
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      })
    );
    
    return config;
  },
  
  // Disable image optimization that can cause issues
  images: {
    unoptimized: true,
  },
  
  // Disable compression that can cause chunk issues
  compress: false,
  
  // Disable telemetry
  telemetry: false,
  
  // Disable powered by header
  poweredByHeader: false,
};

export default nextConfig;
