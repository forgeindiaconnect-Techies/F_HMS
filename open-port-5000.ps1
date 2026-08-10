# Run this script as Administrator to open port 5000 for local network access
# Right-click this file -> "Run with PowerShell" (or open PowerShell as Admin and run it)

$ruleName = "Node Backend Port 5000"

# Remove old rule if exists
netsh advfirewall firewall delete rule name="$ruleName" | Out-Null

# Add new inbound rule
netsh advfirewall firewall add rule `
    name="$ruleName" `
    dir=in `
    action=allow `
    protocol=TCP `
    localport=5000 `
    profile=any

Write-Host ""
Write-Host "✅ Firewall rule added! Port 5000 is now open on all network profiles." -ForegroundColor Green
Write-Host "📱 Your phone can now reach: http://192.168.1.4:5000" -ForegroundColor Cyan
Write-Host ""
pause
