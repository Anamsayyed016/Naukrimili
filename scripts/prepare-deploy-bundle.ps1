# Windows deploy bundle (no bash/WSL required)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Test-Path .next)) {
  Write-Error '.next missing — run: npm run build:ultra-fast'
}

$output = Join-Path (Get-Location) 'release.tar.gz'
$bundle = Join-Path $env:TEMP "naukrimili-bundle-$(Get-Random)"
New-Item -ItemType Directory -Path $bundle -Force | Out-Null
New-Item -ItemType Directory -Path "$bundle\.next" -Force | Out-Null

robocopy .next "$bundle\.next" /E /XD cache /XF *.map /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null

foreach ($f in @('package.json', 'package-lock.json', 'ecosystem.config.cjs', 'next.config.mjs', 'server.cjs', '.npmrc')) {
  if (Test-Path $f) { Copy-Item $f $bundle -Force }
}
if (Test-Path public) { Copy-Item public "$bundle\public" -Recurse -Force }
if (Test-Path prisma) { Copy-Item prisma "$bundle\prisma" -Recurse -Force }
if (Test-Path .env.example) { Copy-Item .env.example $bundle -Force }

New-Item -ItemType Directory -Path "$bundle\scripts" -Force | Out-Null
foreach ($s in @('scripts\sync-env-to-standalone.cjs', 'scripts\ensure-production-database-env.sh')) {
  if (Test-Path $s) { Copy-Item $s "$bundle\scripts\" -Force }
}

if (Test-Path "$bundle\.next\standalone") {
  New-Item -ItemType Directory -Path "$bundle\.next\standalone\.next" -Force | Out-Null
  if ((Test-Path "$bundle\.next\static") -and -not (Test-Path "$bundle\.next\standalone\.next\static")) {
    Copy-Item "$bundle\.next\static" "$bundle\.next\standalone\.next\static" -Recurse -Force
  }
  if (Test-Path "$bundle\public") {
    if (Test-Path "$bundle\.next\standalone\public") { Remove-Item "$bundle\.next\standalone\public" -Recurse -Force }
    Copy-Item "$bundle\public" "$bundle\.next\standalone\public" -Recurse -Force
  }
  if (Test-Path node_modules\.prisma) {
    New-Item -ItemType Directory -Path "$bundle\.next\standalone\node_modules\@prisma" -Force | Out-Null
    Copy-Item node_modules\.prisma "$bundle\.next\standalone\node_modules\.prisma" -Recurse -Force
    if (Test-Path node_modules\@prisma\client) {
      Copy-Item node_modules\@prisma\client "$bundle\.next\standalone\node_modules\@prisma\client" -Recurse -Force
    }
  }
}

$fileCount = (Get-ChildItem $bundle -Recurse -File).Count
if ($fileCount -lt 50) { throw "Bundle too small ($fileCount files)" }

if (Test-Path $output) { Remove-Item $output -Force }
tar -czf $output -C $bundle .
Remove-Item $bundle -Recurse -Force

$sizeMb = [math]::Round((Get-Item $output).Length / 1MB, 1)
Write-Host "Bundle created: $output ($sizeMb MB, $fileCount files)"
