@echo off
setlocal
rem SPipe MCP server launcher (Windows) for the Simple build, stage 1.
rem Mirrors bin\spipe.cmd admission/runtime discovery with two differences:
rem   - entry is src\spipe_mcp\main.spl;
rem   - a leading "mcp" argument is accepted and ignored;
rem   - stderr goes to a PER-PROCESS log dir under <temp>\simple\spipe-mcp so
rem     seed diagnostics can never pollute the stdout JSON-RPC stream (the
rem     shared-file redirect failure mode documented in
rem     bin\simple_mcp_server.cmd). Set SPIPE_STDERR=inherit to keep stderr.
set "ROOT=%~dp0.."
set "EXE=%ROOT%\build\simple-bin\spipe-mcp.exe"
if "%~1"=="mcp" shift
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
    echo hint: Node fallback available: node mcp\server.js 1>&2
    exit /b 127
)
if "%SIMPLE_LIB%"=="" set "SIMPLE_LIB=%~dp0..\..\src"
if "%SIMPLE_EXECUTION_MODE%"=="" set "SIMPLE_EXECUTION_MODE=interpreter"
if "%SIMPLE_LOG%"=="" set "SIMPLE_LOG=error"
set "SPIPE_MODULE_ROOT=%ROOT%"
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
if /i "%SPIPE_STDERR%"=="inherit" (
    "%SIMPLE_RUNTIME%" "%ROOT%\src\spipe_mcp\main.spl" %*
    set "MCP_RC=%ERRORLEVEL%"
    if defined CREATED_LIB rmdir "%ROOT%\src\lib" 2>nul
    if defined CREATED_STD rmdir "%ROOT%\src\std" 2>nul
    exit /b %MCP_RC%
)
set "MCP_TMP=%TEMP%"
if "%MCP_TMP%"=="" set "MCP_TMP=%TMP%"
if "%MCP_TMP%"=="" set "MCP_TMP=%LOCALAPPDATA%\Temp"
set "MCP_LOG_DIR=%MCP_TMP%\simple\spipe-mcp"
if not exist "%MCP_LOG_DIR%\" mkdir "%MCP_LOG_DIR%" 2>nul
if not exist "%MCP_LOG_DIR%\" (
    "%SIMPLE_RUNTIME%" "%ROOT%\src\spipe_mcp\main.spl" %*
    set "MCP_RC=%ERRORLEVEL%"
    if defined CREATED_LIB rmdir "%ROOT%\src\lib" 2>nul
    if defined CREATED_STD rmdir "%ROOT%\src\std" 2>nul
    exit /b %MCP_RC%
)
set "MCP_LOG=%MCP_LOG_DIR%\spipe-mcp_%RANDOM%_%RANDOM%.stderr.log"
echo spipe-mcp: no admitted native exe; serving src\spipe_mcp\main.spl on %SIMPLE_RUNTIME% 1>>"%MCP_LOG%"
"%SIMPLE_RUNTIME%" "%ROOT%\src\spipe_mcp\main.spl" %* 2>>"%MCP_LOG%"
set "MCP_RC=%ERRORLEVEL%"
if defined CREATED_LIB rmdir "%ROOT%\src\lib" 2>nul
if defined CREATED_STD rmdir "%ROOT%\src\std" 2>nul
rem Startup errors live in the log, so name it on stderr when the server fails.
if not "%MCP_RC%"=="0" 1>&2 echo spipe-mcp: exited %MCP_RC%; stderr log: %MCP_LOG%
exit /b %MCP_RC%
