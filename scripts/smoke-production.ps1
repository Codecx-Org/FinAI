# Production API smoke tests. Set API_HOST before running:
#   $env:API_HOST = "https://your-render-service.onrender.com"
# Optional login check:
#   $env:SMOKE_EMAIL = "demo1@bizsawa.com"
#   $env:SMOKE_PASSWORD = "password123"

param(
  [string]$ApiHost = $env:API_HOST,
  [string]$Email = $env:SMOKE_EMAIL,
  [string]$Password = $env:SMOKE_PASSWORD
)

if (-not $ApiHost) {
  Write-Error "Set API_HOST to your Render base URL (no trailing slash), e.g. https://your-service.onrender.com"
  exit 1
}

$ApiHost = $ApiHost.TrimEnd("/")
$passed = 0
$failed = 0

function Test-Endpoint {
  param([string]$Name, [scriptblock]$Request, [int[]]$ExpectedStatus)
  try {
    $r = & $Request
    $code = [int]$r.StatusCode
    if ($ExpectedStatus -contains $code) {
      Write-Host "[PASS] $Name -> $code"
      $script:passed++
    } else {
      Write-Host "[FAIL] $Name -> $code (expected $($ExpectedStatus -join ','))"
      if ($r.Content) { Write-Host $r.Content.Substring(0, [Math]::Min(300, $r.Content.Length)) }
      $script:failed++
    }
  } catch {
    $resp = $_.Exception.Response
    if ($resp) {
      $code = [int]$resp.StatusCode
      $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
      $body = $reader.ReadToEnd()
      $reader.Close()
      if ($ExpectedStatus -contains $code) {
        Write-Host "[PASS] $Name -> $code"
        $script:passed++
      } else {
        Write-Host "[FAIL] $Name -> $code (expected $($ExpectedStatus -join ','))"
        Write-Host $body.Substring(0, [Math]::Min(300, $body.Length))
        $script:failed++
      }
    } else {
      Write-Host "[FAIL] $Name -> $($_.Exception.Message)"
      $script:failed++
    }
  }
}

Write-Host "Smoke testing $ApiHost`n"

Test-Endpoint "GET /api/public/health" {
  Invoke-WebRequest -Uri "$ApiHost/api/public/health" -UseBasicParsing -TimeoutSec 120
} @(200)

Test-Endpoint "GET /health" {
  Invoke-WebRequest -Uri "$ApiHost/health" -UseBasicParsing -TimeoutSec 120
} @(200)

Test-Endpoint "POST /api/auth/login empty body" {
  Invoke-WebRequest -Uri "$ApiHost/api/auth/login" -Method POST `
    -ContentType "application/json" -Body "{}" -UseBasicParsing -TimeoutSec 120
} @(400)

if ($Email -and $Password) {
  $loginBody = (@{ email = $Email; password = $Password } | ConvertTo-Json)
  Test-Endpoint "POST /api/auth/login credentials" {
    Invoke-WebRequest -Uri "$ApiHost/api/auth/login" -Method POST `
      -ContentType "application/json" -Body $loginBody -UseBasicParsing -TimeoutSec 120
  } @(200)
} else {
  Write-Host "[SKIP] POST /api/auth/login credentials (set SMOKE_EMAIL and SMOKE_PASSWORD)"
}

Write-Host "`nResult: $passed passed, $failed failed"
if ($failed -gt 0) { exit 1 }
