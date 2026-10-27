@echo off
setlocal enabledelayedexpansion
title Anonymous Complaint Box - Blockchain dApp

:: Ensure Hardhat allows running cleanly across all Windows drive configurations
set HARDHAT_EXPERIMENTAL_ALLOW_NON_LOCAL_INSTALLATION=true

echo ===============================================================================
echo                ANONYMOUS COMPLAINT BOX USING BLOCKCHAIN
echo             IEEE 830 Specification Compliant Decentralized App
echo ===============================================================================
echo.

:: 1. Verify Node.js presence
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in your PATH.
    echo Please install Node.js [v18 or higher recommended] from https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Verify npm presence
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not found in your PATH.
    pause
    exit /b 1
)

echo [1/4] Checking project dependencies...

if not exist "node_modules\" (
    echo [*] Installing root Hardhat dependencies [first time setup]...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install root dependencies.
        pause
        exit /b 1
    )
) else (
    echo [OK] Root dependencies present.
)

if not exist "frontend\node_modules\" (
    echo [*] Installing frontend React dependencies [first time setup]...
    call npm --prefix frontend install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install frontend dependencies.
        pause
        exit /b 1
    )
) else (
    echo [OK] Frontend dependencies present.
)

echo.
echo [2/4] Compiling Solidity smart contracts [v0.8.20]...
call npx hardhat compile
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Smart contract compilation failed.
    pause
    exit /b 1
)
echo [OK] Smart contract compiled successfully.

:: Check if a mode argument was passed from command line (e.g. run.bat 1 or run.bat 2)
set MODE=%1
if not "%MODE%"=="" goto process_mode

echo.
echo ===============================================================================
echo Select an Execution Mode:
echo [1] Launch Full Local Environment [Local Node + Auto-Deploy + Frontend] (DEFAULT)
echo [2] Run Comprehensive Hardhat Test Suite [18 tests]
echo [3] Deploy Smart Contract to Ethereum Sepolia Testnet
echo [4] Launch Frontend Only [connected to existing contract]
echo ===============================================================================
set /p MODE="Enter your choice (1-4) [Press Enter for 1]: "

:process_mode
if "%MODE%"=="" set MODE=1
if "%MODE%"=="1" goto launch_local
if "%MODE%"=="2" goto run_tests
if "%MODE%"=="3" goto deploy_sepolia
if "%MODE%"=="4" goto launch_frontend

echo [WARNING] Invalid selection "%MODE%". Defaulting to Mode 1.
goto launch_local

:launch_local
echo.
echo [3/4] Starting local Hardhat blockchain node in background...
start "Hardhat Local Node - ChainID 31337" cmd /k "cd /d "%~dp0" && set HARDHAT_EXPERIMENTAL_ALLOW_NON_LOCAL_INSTALLATION=true && npx hardhat node --hostname 127.0.0.1"

echo [*] Waiting 4 seconds for local node to bind to 127.0.0.1:8545...
ping 127.0.0.1 -n 5 >nul

echo.
echo [4/4] Deploying ComplaintBox smart contract to local network...
call npx hardhat run scripts/deploy.js --network localhost
if %ERRORLEVEL% neq 0 (
    echo [WARNING] First deployment attempt timed out. Retrying in 3 seconds...
    ping 127.0.0.1 -n 4 >nul
    call npx hardhat run scripts/deploy.js --network localhost
)

echo.
echo ===============================================================================
echo  Application is now running!
echo  - Web Frontend:  http://localhost:5173
echo  - Local Node:    http://127.0.0.1:8545 [Chain ID: 31337]
echo.
echo  PRE-FUNDED TEST ACCOUNTS (10,000 ETH EACH):
echo  1. Authority Admin [Deployer]:
echo     Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
echo  2. Student Complainant:
echo     Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
echo ===============================================================================
echo.
echo [*] Opening default web browser to http://localhost:5173 ...
start http://localhost:5173

call npm --prefix frontend run dev
goto end

:run_tests
echo.
echo [*] Executing Hardhat unit test suite for ComplaintBox...
call npx hardhat test
echo.
goto end

:deploy_sepolia
echo.
if not exist ".env" (
    echo [WARNING] .env file not found. Creating from .env.example...
    copy .env.example .env
    echo [*] Please edit .env with your SEPOLIA_RPC_URL and PRIVATE_KEY.
    notepad .env
    echo Once you have saved your credentials in .env, press any key to proceed.
    pause
)
echo [*] Deploying ComplaintBox to Ethereum Sepolia Testnet...
call npx hardhat run scripts/deploy.js --network sepolia
echo.
goto end

:launch_frontend
echo.
echo [*] Starting React frontend development server...
start http://localhost:5173
call npm --prefix frontend run dev
goto end

:end
