param()
$ErrorActionPreference = 'Stop'
$qatuSpecRoot = Split-Path $PSScriptRoot -Parent
$qatuProjectRoot = Split-Path $qatuSpecRoot -Parent
Set-Location -LiteralPath $qatuProjectRoot
$env:SPECIFY_FEATURE_NO_PERSIST = '1'
$qatuRequired = @('spec.md','plan.md','tasks.md','research.md','data-model.md','quickstart.md','contracts/api.md','checklists/requirements.md')
$qatuFolders = Get-ChildItem -LiteralPath $qatuSpecRoot -Directory | Where-Object { $_.Name -match '^\d{3}-' }
$qatuResults = @()
foreach ($qatuFolder in $qatuFolders) {
    foreach ($qatuFile in $qatuRequired) {
        if (-not (Test-Path -LiteralPath (Join-Path $qatuFolder.FullName $qatuFile) -PathType Leaf)) { throw "Missing artifact: $($qatuFolder.Name)/$qatuFile" }
    }
    $env:SPECIFY_FEATURE_DIRECTORY = 'specs/' + $qatuFolder.Name
    $env:SPECIFY_FEATURE = $qatuFolder.Name
    $qatuOutput = & (Join-Path $qatuProjectRoot '.specify/scripts/powershell/check-prerequisites.ps1') -Json -RequireSpec -RequireTasks -IncludeTasks
    if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { throw "Official prerequisite check failed: $($qatuFolder.Name)" }
    $qatuParsed = $qatuOutput | ConvertFrom-Json
    if (-not $qatuParsed.FEATURE_DIR) { throw "Invalid output: $($qatuFolder.Name)" }
    $qatuTaskLines = Get-Content -LiteralPath (Join-Path $qatuFolder.FullName 'tasks.md') -Encoding UTF8 | Where-Object { $_ -match '^- \[[ x]\]' }
    foreach ($qatuLine in $qatuTaskLines) { if ($qatuLine -notmatch '^- \[[ x]\] T\d{3} ') { throw "Invalid task format: $qatuLine" } }
    $qatuResults += [PSCustomObject]@{ Feature = $qatuFolder.Name; Tasks = @($qatuTaskLines).Count; Artifacts = $qatuRequired.Count; OfficialPrerequisites = 'PASS' }
}
$qatuResults | ConvertTo-Json -Depth 4
