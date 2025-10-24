#!/bin/bash

# Regional OAuth Testing Script
# Tests OAuth from different regions and devices

echo "🌍 Regional OAuth Testing Script"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test OAuth from different regions
test_regional_oauth() {
    local region=$1
    local device=$2
    local browser=$3
    
    echo -e "${BLUE}Testing OAuth from: ${region} (${device} - ${browser})${NC}"
    
    # Simulate different user agents
    case $device in
        "mobile")
            case $browser in
                "safari")
                    user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
                    ;;
                "chrome")
                    user_agent="Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
                    ;;
                "firefox")
                    user_agent="Mozilla/5.0 (Mobile; rv:68.0) Gecko/68.0 Firefox/68.0"
                    ;;
            esac
            ;;
        "desktop")
            case $browser in
                "safari")
                    user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15"
                    ;;
                "chrome")
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                    ;;
                "firefox")
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0"
                    ;;
                "edge")
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59"
                    ;;
            esac
            ;;
    esac
    
    # Test the regional OAuth debug endpoint
    echo "  Testing regional OAuth debug endpoint..."
    
    response=$(curl -s -w "\n%{http_code}" \
        -H "User-Agent: $user_agent" \
        -H "CF-IPCountry: $region" \
        -H "CF-Region: $region" \
        -H "CF-City: TestCity" \
        -H "X-Forwarded-For: 192.168.1.100" \
        "https://naukrimili.com/api/debug/regional-oauth")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "  ${GREEN}✅ Success: ${region} (${device} - ${browser})${NC}"
        
        # Extract key information
        country=$(echo "$body" | jq -r '.debug.country // "unknown"' 2>/dev/null || echo "unknown")
        is_mobile=$(echo "$body" | jq -r '.debug.isMobile // false' 2>/dev/null || echo "false")
        oauth_flow=$(echo "$body" | jq -r '.debug.oauthFlow // "unknown"' 2>/dev/null || echo "unknown")
        issues_count=$(echo "$body" | jq -r '.issues | length' 2>/dev/null || echo "0")
        
        echo "    Country: $country"
        echo "    Mobile: $is_mobile"
        echo "    OAuth Flow: $oauth_flow"
        echo "    Issues: $issues_count"
        
        if [ "$issues_count" -gt 0 ]; then
            echo -e "    ${YELLOW}⚠️  Issues detected:${NC}"
            echo "$body" | jq -r '.issues[] | "      - " + .type + " (" + .severity + "): " + .description' 2>/dev/null || echo "      - Unable to parse issues"
        fi
        
    else
        echo -e "  ${RED}❌ Failed: ${region} (${device} - ${browser}) - HTTP $http_code${NC}"
        echo "    Response: $body"
    fi
    
    echo ""
}

# Function to test OAuth from different countries
test_countries() {
    local countries=("US" "IN" "GB" "CA" "AU" "DE" "FR" "JP" "CN" "BR" "MX" "RU" "ZA" "NG" "EG")
    
    echo -e "${BLUE}Testing OAuth from different countries:${NC}"
    echo "=========================================="
    
    for country in "${countries[@]}"; do
        test_regional_oauth "$country" "desktop" "chrome"
        sleep 1  # Rate limiting
    done
}

# Function to test different devices and browsers
test_devices() {
    local devices=("mobile" "desktop")
    local browsers=("chrome" "safari" "firefox" "edge")
    
    echo -e "${BLUE}Testing OAuth from different devices and browsers:${NC}"
    echo "=================================================="
    
    for device in "${devices[@]}"; do
        for browser in "${browsers[@]}"; do
            test_regional_oauth "US" "$device" "$browser"
            sleep 1  # Rate limiting
        done
    done
}

# Function to test problematic regions
test_problematic_regions() {
    local problematic_regions=("CN" "IR" "CU" "KP" "SY")
    
    echo -e "${BLUE}Testing OAuth from potentially problematic regions:${NC}"
    echo "=================================================="
    
    for region in "${problematic_regions[@]}"; do
        test_regional_oauth "$region" "desktop" "chrome"
        sleep 1  # Rate limiting
    done
}

# Main execution
echo "Starting Regional OAuth Testing..."
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq is not installed. Some features may not work properly.${NC}"
    echo "Install jq with: sudo apt-get install jq (Ubuntu/Debian) or brew install jq (macOS)"
    echo ""
fi

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl is not installed. Please install curl to run this script.${NC}"
    exit 1
fi

# Run tests
echo "1. Testing different countries..."
test_countries

echo "2. Testing different devices and browsers..."
test_devices

echo "3. Testing problematic regions..."
test_problematic_regions

echo -e "${GREEN}✅ Regional OAuth testing completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Check the server logs for detailed OAuth debugging information"
echo "2. Review the issues and recommendations for each region/device"
echo "3. Implement fixes based on the detected issues"
echo ""
echo "To view the logs, run: pm2 logs naukrimili --lines 100"
