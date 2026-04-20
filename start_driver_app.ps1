$env:EXPO_PUBLIC_BACKEND_URL = "http://192.168.50.146:8000"
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "192.168.50.146"
Write-Host "Starting Driver App -> Backend: $env:EXPO_PUBLIC_BACKEND_URL" -ForegroundColor Yellow
Set-Location "$PSScriptRoot\mobile\driver"
npx expo start --clear --host lan
