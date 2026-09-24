@echo off
setlocal
rem SPipe CLI launcher (Windows) for the Simple build, stage 1.
rem Mirrors bin/simple_mcp_server.cmd conventions:
rem   1. an admitted native exe at build\simple-bin\spipe.exe, hash-checked
rem      against its .sha256 sidecar (certutil SHA256);
rem   2. otherwise the Simple runtime runs src\spipe_cli\main.spl in
rem      interpreter mode (SIMPLE_EXECUTION_MODE=interpreter, same default and
rem      for the same seed-JIT reasons as bin\simple_mcp_server.cmd).
rem Runtime discovery: SPIPE_SIMPLE may name the runtime binary or a checkout
rem containing bin\simple.cmd / bin\simple.exe; otherwise ..\..\bin\simple.cmd
rem relative to this worktree (the host Simple checkout layout).
set "ROOT=%~dp0.."
set "EXE=%ROOT%\build\simple-bin\spipe.exe"
if not exist "%EXE%" goto :no_exe
if not exist "%EXE%.sha256" (
    echo error: %EXE% has no .sha256 sidecar; refusing an unadmitted native exe 1>&2
    exit /b 2
)
set "EXPECTED="
set /p EXPECTED=<"%EXE%.sha256"
for /f "tokens=1" %%h in ("%EXPECTED%") do set "EXPECTED=%%h"
set "ACTUAL="
for /f "skip=1 tokens=1" %%h in ('certutil -hashfile "%EXE%" SHA256') do if not defined ACTUAL set "ACTUAL=%%h"
if /i not "%ACTUAL%"=="%EXPECTED%" (
    echo error: sha256 mismatch for %EXE% 1>&2
    exit /b 2
)
set "SPIPE_MODULE_ROOT=%ROOT%"
"%EXE%" %*
exit /b %ERRORLEVEL%

:no_exe
set "SIMPLE_RUNTIME=%SPIPE_SIMPLE%"
if "%SIMPLE_RUNTIME%"=="" set "SIMPLE_RUNTIME=%ROOT%\..\..\bin\simple.cmd"
if not exist "%SIMPLE_RUNTIME%" (
    if exist "%SPIPE_SIMPLE%\bin\simple.cmd" set "SIMPLE_RUNTIME=%SPIPE_SIMPLE%\bin\simple.cmd"
)
if not exist "%SIMPLE_RUNTIME%" (
    if exist "%SPIPE_SIMPLE%\bin\simple.exe" set "SIMPLE_RUNTIME=%SPIPE_SIMPLE%\bin\simple.exe"
)
if not exist "%SIMPLE_RUNTIME%" (
    echo error: no Simple runtime found ^(set SPIPE_SIMPLE to a simple binary^) 1>&2
    echo hint: Node fallback available: node cli\spipe.js %* 1>&2
    exit /b 127
)
if "%SIMPLE_LIB%"=="" set "SIMPLE_LIB=%~dp0..\..\src"
if "%SIMPLE_EXECUTION_MODE%"=="" set "SIMPLE_EXECUTION_MODE=interpreter"
if "%SIMPLE_LOG%"=="" set "SIMPLE_LOG=error"
set "SPIPE_MODULE_ROOT=%ROOT%"
rem Stdlib bootstrap: the interpreter resolves std.* from <project>\src\lib.
rem Links are removed again after the run so the module tree stays identical.
set "CREATED_LIB=" & set "CREATED_STD="
if not exist "%ROOT%\src\lib\" (
    if exist "%SIMPLE_LIB%\lib\" (
        mklink /d "%ROOT%\src\lib" "%SIMPLE_LIB%\lib" >nul 2>nul
        if exist "%ROOT%\src\lib\" set "CREATED_LIB=1"
    )
)
if not exist "%ROOT%\src\std\" (
    if exist "%SIMPLE_LIB%\std\" (
        mklink /d "%ROOT%\src\std" "%SIMPLE_LIB%\std" >nul 2>nul
        if exist "%ROOT%\src\std\" set "CREATED_STD=1"
    )
)
"%SIMPLE_RUNTIME%" "%ROOT%\src\spipe_cli\main.spl" %*
set "SPipe_RC=%ERRORLEVEL%"
if defined CREATED_LIB rmdir "%ROOT%\src\lib" 2>nul
if defined CREATED_STD rmdir "%ROOT%\src\std" 2>nul
exit /b %SPipe_RC%
