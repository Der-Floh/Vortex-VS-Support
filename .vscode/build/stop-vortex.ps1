# Stops the Vortex process if it is running. Used as a VS Code postDebugTask.

Stop-Process -Name "Vortex" -Force -ErrorAction SilentlyContinue
