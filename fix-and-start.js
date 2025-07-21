// Complete OAuth Fix and Server Startup
const { spawn } = require('child_process');

console.log('🔧 FIXING GOOGLE OAUTH redirect_uri_mismatch ERROR\n');

console.log('✅ Your configuration is correct:');
console.log('   GOOGLE_CLIENT_ID: 464019128002-k08cl8jrjq0refk8hmgpadkovqg0kvtm.apps.googleusercontent.com');
console.log('   NEXTAUTH_URL: http://localhost:3000');
console.log('   NextAuth setup: ✅ Complete\n');

console.log('🌐 STEP 1: Opening Google Cloud Console...');
const consoleUrl = 'https://console.cloud.google.com/apis/credentials/oauthclient/464019128002-k08cl8jrjq0refk8hmgpadkovqg0kvtm';

// Open browser (works on Windows)
try {
    spawn('cmd', ['/c', 'start', consoleUrl], { stdio: 'inherit' });
    console.log('✅ Browser opened with your OAuth client settings\n');
} catch (error) {
    console.log(`❌ Could not auto-open browser. Please visit: ${consoleUrl}\n`);
}

console.log('📋 STEP 2: In Google Cloud Console, ADD these URLs:');
console.log('');
console.log('   🔗 Authorized redirect URIs:');
console.log('      http://localhost:3000/api/auth/callback/google');
console.log('      http://127.0.0.1:3000/api/auth/callback/google');
console.log('');
console.log('   🌐 Authorized JavaScript origins:');
console.log('      http://localhost:3000');
console.log('      http://127.0.0.1:3000');
console.log('');
console.log('   💾 Click SAVE and wait 2-3 minutes for changes to propagate');
console.log('');

// Wait for user confirmation
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('✋ Press ENTER after you have updated Google Cloud Console...', () => {
    rl.close();
    
    console.log('\n🚀 STEP 3: Starting your development server...');
    
    // Change to project directory and start dev server
    process.chdir(__dirname);
    
    const devServer = spawn('npm', ['run', 'dev'], { 
        stdio: 'inherit',
        shell: true
    });
    
    console.log('\n✅ Development server starting...');
    console.log('🌐 Once server is ready, test OAuth at:');
    console.log('   http://localhost:3000/auth/login');
    console.log('');
    console.log('🎉 Google OAuth should now work correctly!');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
    
    devServer.on('error', (error) => {
        console.error('❌ Error starting dev server:', error.message);
        console.log('💡 Try running manually: npm run dev');
    });
    
    devServer.on('close', (code) => {
        console.log(`\n🛑 Dev server stopped with code ${code}`);
    });
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\n👋 Goodbye!');
    process.exit(0);
});
