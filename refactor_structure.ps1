$base = "src/app/pages"

# Define the target 4 roles (+ system folders)
$dirs = @("admin", "teacher", "accountant", "principal", "auth", "general", "ui-elements")
foreach ($d in $dirs) {
    $p = "$base/$d"
    if (-not (Test-Path $p)) { New-Item -ItemType Directory -Force -Path $p }
}

$moves = @(
    # Move Academic -> Admin
    @{ Source="pages/academic/student-list"; Dest="pages/admin" },
    @{ Source="pages/academic/student-view"; Dest="pages/admin" },
    @{ Source="pages/academic/exam"; Dest="pages/admin" },
    @{ Source="pages/academic/exam-result"; Dest="pages/admin" },
    @{ Source="pages/academic/exam-schedule"; Dest="pages/admin" },
    @{ Source="pages/academic/exam-schedule-standards-create"; Dest="pages/admin" },
    @{ Source="pages/academic/exam-schedule-standards-list"; Dest="pages/admin" },
    @{ Source="pages/academic/attendance"; Dest="pages/admin" },
    @{ Source="pages/academic/student-attendance"; Dest="pages/admin" },
    @{ Source="pages/academic/leave"; Dest="pages/admin" },
    @{ Source="pages/academic/leave-manage"; Dest="pages/admin" },

    # Move HR -> Admin
    @{ Source="pages/hr/staff-list"; Dest="pages/admin" },
    @{ Source="pages/hr/staff-view-profile"; Dest="pages/admin" },
    @{ Source="pages/hr/staff-edit-profile"; Dest="pages/admin" },
    @{ Source="pages/hr/staff-attendance"; Dest="pages/admin" },

    # Move Marketing -> Admin (Assuming Admin manages content)
    @{ Source="pages/marketing/blog"; Dest="pages/admin" },
    @{ Source="pages/marketing/add-blog"; Dest="pages/admin" },
    @{ Source="pages/marketing/blog-details"; Dest="pages/admin" },

    # Move Marketplace -> Admin
    @{ Source="pages/marketplace/marketplace"; Dest="pages/admin" },
    @{ Source="pages/marketplace/marketplace-details"; Dest="pages/admin" },

    # Move Charts -> UI Elements
    @{ Source="pages/charts/column-chart"; Dest="pages/ui-elements" },
    @{ Source="pages/charts/line-chart"; Dest="pages/ui-elements" },
    @{ Source="pages/charts/pie-chart"; Dest="pages/ui-elements" }
)

foreach ($move in $moves) {
    $sourcePath = "src/app/" + $move.Source
    $destPath = "src/app/" + $move.Dest
    
    if (Test-Path $sourcePath) {
        Write-Host "Moving $sourcePath to $destPath"
        Move-Item -Path $sourcePath -Destination $destPath -Force
    } else {
        # Silent fail or warn depending on preference, many might already be moved if re-run
        # Write-Warning "Source $sourcePath not found"
    }
}

# Cleanup empty folders
$emptyDirs = @("pages/academic", "pages/hr", "pages/marketing", "pages/marketplace", "pages/charts")
foreach ($ed in $emptyDirs) {
    $fullPath = "src/app/" + $ed
    if ((Test-Path $fullPath) -and (Get-ChildItem -Path $fullPath).Count -eq 0) {
        Write-Host "Removing empty directory $fullPath"
        Remove-Item -Path $fullPath -Force
    }
}

