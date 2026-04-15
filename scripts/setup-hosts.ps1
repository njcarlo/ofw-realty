# Run this script as Administrator
# Right-click PowerShell → "Run as Administrator" → then run this file

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$current = Get-Content $hostsPath -Raw

$entries = @"

# LUPA PH Local Development Subdomains
127.0.0.1  portal.lupa.ph
127.0.0.1  agent.lupa.ph
127.0.0.1  broker.lupa.ph
127.0.0.1  api.lupa.ph
"@

if ($current -notmatch "portal\.lupa\.ph") {
  Add-Content -Path $hostsPath -Value $entries
  Write-Host "✅ Hosts entries added! You can now use:" -ForegroundColor Green
  Write-Host "   http://portal.lupa.ph:3000  → Main buyer app" -ForegroundColor Cyan
  Write-Host "   http://agent.lupa.ph:3002   → Agent portal" -ForegroundColor Cyan
  Write-Host "   http://broker.lupa.ph:3003  → Broker portal" -ForegroundColor Cyan
  Write-Host "   http://api.lupa.ph:3001     → API" -ForegroundColor Cyan
} else {
  Write-Host "ℹ️ Hosts entries already exist" -ForegroundColor Yellow
}
