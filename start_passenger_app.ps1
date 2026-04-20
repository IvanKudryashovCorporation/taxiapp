$env:EXPO_PUBLIC_BACKEND_URL = "http://192.168.50.146:8000"
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "192.168.50.146"
Write-Host "Starting Passenger App -> Backend: $env:EXPO_PUBLIC_BACKEND_URL" -ForegroundColor Yellow
Set-Location "$PSScriptRoot\mobile\passenger"
npx expo start --clear --host lan
