@echo off
cd /d "%~dp0"
call "%~dp0npm.cmd" run dev -- --open
if errorlevel 1 pause
