@echo off
chcp 65001 >nul
set "SOURCE=%~dp0"
set "TARGET=C:\photo-on-demand"
echo Copying project to %TARGET% ...
echo.

if not exist "%TARGET%" mkdir "%TARGET%"

xcopy "%SOURCE%*" "%TARGET%\" /E /I /Y /Q

echo.
echo Done. Project copied to %TARGET%
echo.
echo Next steps:
echo 1. Run:  %TARGET%\start-backend.bat
echo 2. In UXP Developer Tool: Add Plugin -^>  %TARGET%\plugin
echo 3. Load, then in Photoshop: Plugins -^> AI Starter Panel
echo.
pause
