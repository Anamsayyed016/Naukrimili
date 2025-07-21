// Gmail OAuth Fix Script
const { spawn } = require('child_process');

console.log('🔧 FIXING GMAIL OAUTH ACCESS_DENIED ERROR\n');

console.log('🎯 PROBLEM IDENTIFIED:');
console.log('   Your app requests Gmail scopes (gmail.readonly, gmail.send)');
console.log('   These require special verification or test user setup\n');

console.log('🛠️  SOLUTIONS (Choose ONE):');
console.log('\n📋 SOLUTION 1: REMOVE GMAIL SCOPES (QUICKEST FIX)');
console.log('   - Remove Gmail scopes from your NextAuth config');
console.log('   - This will allow basic Google login to work immediately');
console.log('   - You can add Gmail integration later\n');

console.log('📋 SOLUTION 2: SET UP TEST USERS');
console.log('   - Add your email as a test user in Google Cloud Console');
console.log('   - Keep Gmail scopes but limit to test users\n');

console.log('📋 SOLUTION 3: SUBMIT FOR VERIFICATION');
console.log('   - Submit your app for Google verification (takes days/weeks)');
console.log('   - Required for production Gmail access\n');

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Which solution do you want? (1/2/3): ', (answer) => {
    console.log('');
    
    if (answer === '1') {
        console.log('✅ SOLUTION 1: Removing Gmail scopes...\n');
        
        // Update NextAuth configuration to remove Gmail scopes
        const fs = require('fs');
        const nextAuthPath = 'E:\\myprojects\\jobportal\\pages\\api\\auth\\[...nextauth].ts';
        
        try {
            let content = fs.readFileSync(nextAuthPath, 'utf8');
            
            // Replace the scope line to remove Gmail scopes
            content = content.replace(
                /scope: 'openid email profile https:\/\/www\.googleapis\.com\/auth\/gmail\.readonly https:\/\/www\.googleapis\.com\/auth\/gmail\.send'/,
                "scope: 'openid email profile'"
            );
            
            fs.writeFileSync(nextAuthPath, content);
            console.log('✅ Updated NextAuth configuration');
            console.log('✅ Removed Gmail scopes');
            console.log('✅ Basic Google login should now work\n');
            
            startDevServer();
            
        } catch (error) {
            console.log('❌ Could not update file automatically');
            console.log('📝 MANUAL FIX: Edit pages/api/auth/[...nextauth].ts');
            console.log('   Change this line:');
            console.log("   scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send'");
            console.log('   To this:');
            console.log("   scope: 'openid email profile'");
        }
        
    } else if (answer === '2') {
        console.log('✅ SOLUTION 2: Setting up test users...\n');
        
        const consoleUrl = 'https://console.cloud.google.com/apis/credentials/consent';
        
        try {
            spawn('cmd', ['/c', 'start', consoleUrl], { stdio: 'inherit' });
            console.log('✅ Opening OAuth consent screen settings\n');
        } catch (error) {
            console.log(`❌ Please visit: ${consoleUrl}\n`);
        }
        
        console.log('📋 STEPS TO COMPLETE:');
        console.log('   1. Click "OAuth consent screen"');
        console.log('   2. Scroll down to "Test users" section');
        console.log('   3. Click "ADD USERS"');
        console.log('   4. Add your email: anamsayyed58@gmail.com');
        console.log('   5. Click "SAVE"');
        console.log('   6. Wait 2-3 minutes for changes to take effect\n');
        
        rl.question('Press ENTER after adding test users...', () => {
            startDevServer();
        });
        
    } else if (answer === '3') {
        console.log('✅ SOLUTION 3: App verification process...\n');
        
        const verificationUrl = 'https://console.cloud.google.com/apis/credentials/consent';
        
        try {
            spawn('cmd', ['/c', 'start', verificationUrl], { stdio: 'inherit' });
            console.log('✅ Opening OAuth consent screen for verification\n');
        } catch (error) {
            console.log(`❌ Please visit: ${verificationUrl}\n`);
        }
        
        console.log('📋 VERIFICATION REQUIREMENTS:');
        console.log('   1. Complete OAuth consent screen configuration');
        console.log('   2. Add privacy policy URL');
        console.log('   3. Add terms of service URL');
        console.log('   4. Submit for verification');
        console.log('   5. Wait for Google approval (can take weeks)\n');
        
        console.log('⚠️  NOTE: This is for production use only');
        console.log('💡 For development, choose Solution 1 or 2 instead\n');
        
    } else {
        console.log('❌ Invalid choice. Please run the script again.');
    }
    
    rl.close();
});

function startDevServer() {
    console.log('🚀 Starting development server...\n');
    
    process.chdir('E:\\myprojects\\jobportal');
    
    const devServer = spawn('npm', ['run', 'dev'], { 
        stdio: 'inherit',
        shell: true
    });
    
    console.log('🌐 Test your OAuth at: http://localhost:3000/auth/login');
    console.log('🎉 Google OAuth should now work!\n');
    console.log('Press Ctrl+C to stop the server');
    
    devServer.on('error', (error) => {
        console.error('❌ Error starting dev server:', error.message);
    });
}

process.on('SIGINT', () => {
    console.log('\n👋 Goodbye!');
    process.exit(0);
});
