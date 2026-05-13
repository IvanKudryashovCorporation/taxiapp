# Выбираем Wi-Fi IP: предпочитаем 192.168.x.x с шлюзом (настоящая сеть), исключаем VPN/Hotspot
$ip = (Get-NetIPAddress -AddressFamily IPv4 |
       Where-Object {
           $_.IPAddress -notmatch "^127\." -and
           $_.IPAddress -notmatch "^169\.254" -and
           $_.IPAddress -notmatch "^172\." -and
           $_.InterfaceAlias -notmatch "happ|tun|vpn|Loopback" -and
           $_.InterfaceAlias -notmatch "^\s*\*"
       } |
       Where-Object { $_.IPAddress -match "^192\.168\." } |
       ForEach-Object {
           $iface = $_.InterfaceAlias
           $gw = (Get-NetRoute -AddressFamily IPv4 -InterfaceAlias $iface -ErrorAction SilentlyContinue |
                  Where-Object { $_.DestinationPrefix -eq "0.0.0.0/0" } |
                  Select-Object -First 1).NextHop
           [PSCustomObject]@{ IP = $_.IPAddress; GW = $gw; Iface = $iface }
       } |
       Where-Object { $_.GW -and $_.GW -ne "0.0.0.0" } |
       Select-Object -First 1).IP

if (-not $ip) {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 |
           Where-Object { $_.IPAddress -match "^192\.168\." } |
           Select-Object -First 1).IPAddress
}
if (-not $ip) { $ip = "localhost" }

$env:EXPO_PUBLIC_BACKEND_URL  = "http://${ip}:8000"
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip

Write-Host ""
Write-Host "=== Driver App ===" -ForegroundColor Cyan
Write-Host "  LAN IP   : $ip" -ForegroundColor Green
Write-Host "  Backend  : $env:EXPO_PUBLIC_BACKEND_URL" -ForegroundColor Green
Write-Host "  Expo URL : exp://${ip}:8082" -ForegroundColor Yellow
Write-Host ""

Set-Location "$PSScriptRoot\mobile\driver"
npx expo start --clear --host lan --port 8082
