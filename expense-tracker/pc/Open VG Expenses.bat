@echo off
rem Opens VG Expenses in its own window using Microsoft Edge.
rem If Edge isn't installed, it opens in your normal web browser instead.
set "APP=%~dp0index.html"
set "URL=file:///%APP:\=/%"
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe" >nul 2>&1
if %errorlevel%==0 (
  start "" msedge --app="%URL%"
) else (
  start "" "%APP%"
)
