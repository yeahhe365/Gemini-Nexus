@echo off
SETLOCAL EnableDelayedExpansion

echo ========================================
echo  Copy files to dist for unpacked extension
echo ========================================

set "ROOT=%~dp0"
set "DIST=%ROOT%dist"

if not exist "%DIST%" (
    echo ERROR: dist folder not found. Run 'npm run build' first.
    pause
    exit /b 1
)

echo Copying manifest.json...
copy "%ROOT%manifest.json" "%DIST%\manifest.json" > nul

echo Copying logo.png...
copy "%ROOT%logo.png" "%DIST%\logo.png" > nul

echo Copying background folder...
xcopy "%ROOT%background" "%DIST%\background\" /E /I /Y /Q

echo Copying content folder...
xcopy "%ROOT%content" "%DIST%\content\" /E /I /Y /Q

echo Copying shared folder...
xcopy "%ROOT%shared" "%DIST%\shared\" /E /I /Y /Q

echo Copying services folder...
xcopy "%ROOT%services" "%DIST%\services\" /E /I /Y /Q

echo Copying assets folder...
xcopy "%ROOT%assets" "%DIST%\assets\" /E /I /Y /Q

echo Copying vendor folder...
xcopy "%ROOT%vendor" "%DIST%\vendor\" /E /I /Y /Q

echo ========================================
echo  Done! Load '%DIST%' as unpacked extension in Chrome.
echo ========================================
pause
