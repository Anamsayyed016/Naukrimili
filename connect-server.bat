@echo off
echo 🚀 Connecting to Hostinger Server...
echo Server IP: 69.62.73.84
echo User: root
echo.
echo Once connected, you can:
echo - cd /root/jobportal     (navigate to project)
echo - systemctl status jobportal  (check service)
echo - journalctl -u jobportal -f  (view logs)
echo - node server.js        (start manually)
echo.
ssh root@69.62.73.84
