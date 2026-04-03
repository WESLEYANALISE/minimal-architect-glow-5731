UPDATE subscriptions 
SET expiration_date = created_at + INTERVAL '365 days',
    updated_at = now()
WHERE id = '7cdd6ffd-414f-4f02-ae11-bcd5d3841a0f';