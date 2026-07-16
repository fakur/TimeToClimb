@echo off
echo ===================================================
echo   Deploying Time to Climb to Google Cloud Run
echo ===================================================
echo Checking for gcloud CLI...
where gcloud >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] gcloud CLI tidak ditemukan di sistem Anda!
    echo Silakan ikuti instruksi di implementation_plan.md untuk men-deploy lewat Google Cloud Shell.
    pause
    exit /b 1
)

echo Menjalankan gcloud run deploy...
gcloud run deploy time-to-climb ^
  --source . ^
  --region asia-southeast2 ^
  --allow-unauthenticated ^
  --set-env-vars="NEXT_PUBLIC_SUPABASE_URL=https://qpcaommapqxvtlqpfmwt.supabase.co,NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwY2FvbW1hcHF4dnRscXBmbXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjcxNDQsImV4cCI6MjA5Nzg0MzE0NH0.CnciEeQZ5I4aKsJereHVTxBDxwZvydd3P-xN0DYnIRU"

echo Deployment Selesai!
pause
