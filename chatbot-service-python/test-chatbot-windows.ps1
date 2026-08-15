$health = Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:8000/health"
$health | ConvertTo-Json -Depth 5

$body = @{ message = "Which vaccines are commonly due at 6 weeks?" } | ConvertTo-Json
$response = Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:8000/api/chat" `
  -ContentType "application/json" `
  -Body $body
$response | ConvertTo-Json -Depth 5
