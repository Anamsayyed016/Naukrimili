# PowerShell script to fix unused request parameters in API routes

$files = Get-ChildItem -Path "app/api" -Filter "route.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName
    $changed = $false
    
    for ($i = 0; $i -lt $content.Length; $i++) {
        # Fix unused request parameters
        if ($content[$i] -match 'export async function (GET|POST|PUT|DELETE|PATCH)\(request: (Request|NextRequest)\)') {
            $content[$i] = $content[$i] -replace '\(request: (Request|NextRequest)', '(_request: NextRequest'
            $changed = $true
        }
        
        # Fix unused error in catch blocks
        if ($content[$i] -match '} catch \(error\)') {
            $content[$i] = $content[$i] -replace '} catch \(error\)', '} catch'
            $changed = $true
        }
    }
    
    if ($changed) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "Done!"

