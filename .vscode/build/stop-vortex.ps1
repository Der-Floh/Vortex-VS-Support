# Stops the Vortex process if it is running. Used as a VS Code postDebugTask.
# Note: undeploy is handled by build-deploy-start.ps1 which blocks on the Vortex
# process and runs undeploy-from-vortex.ps1 as soon as Vortex exits for any reason.
# This script only needs to kill the process so that block unblocks promptly.

Stop-Process -Name "Vortex" -Force -ErrorAction SilentlyContinue
