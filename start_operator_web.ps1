# Запуск веб-админки оператора
# Использование:
#   .\start_operator_web.ps1          — dev режим с Turbopack (быстрая компиляция)
#   .\start_operator_web.ps1 prod     — production режим (собрать + запустить, мгновенный отклик)

param([string]$mode = "dev")

$webDir = "$PSScriptRoot\operator-web"

Write-Host ""
Write-Host "=== Operator Web (Next.js) ===" -ForegroundColor Cyan
Write-Host "URL  : http://localhost:3001" -ForegroundColor Green
Write-Host "Режим: $mode" -ForegroundColor Green
Write-Host ""

# Проверяем node_modules
if (-not (Test-Path "$webDir\node_modules\.bin\next")) {
    Write-Host "Устанавливаем зависимости..." -ForegroundColor Yellow
    Set-Location $webDir
    npm install
}

Set-Location $webDir

if ($mode -eq "prod") {
    Write-Host "Собираем production сборку (один раз, ~1-2 мин)..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Ошибка сборки!" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
    Write-Host "Запускаем production сервер (мгновенный отклик)..." -ForegroundColor Green
    npm run start
} else {
    Write-Host "Dev режим с Turbopack (первый старт ~3 сек, не 15)..." -ForegroundColor Yellow
    npm run dev
}
