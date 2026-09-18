@echo off
setlocal
set "PATH=%~dp0.tools;%PATH%"
"%~dp0.tools\node.exe" "%~dp0.tools\npm\bin\npm-cli.js" %*
exit /b %errorlevel%
