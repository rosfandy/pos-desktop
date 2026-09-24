@echo off
cd /d "%~dp0"
SET NODE_PATH=
SET npm_execpath=
SET ELECTRON_BUILDER_NODE_MODULES_COLLECTOR_NPM_PATH=C:\Program Files\nodejs\npm.cmd
call "C:\Program Files\nodejs\node.exe" node_modules\electron-builder\cli.js %*
