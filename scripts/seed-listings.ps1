$svcKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVld2RlbGZidmtkZ2Jpb3ZzYnZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA2MTkyOSwiZXhwIjoyMDkxNjM3OTI5fQ.YKfbCyOgT3dv6OUyDVoo2zviZlWTbFhWOcdHGtUc2Pc"
$base = "https://eewdelfbvkdgbiovsbvr.supabase.co/rest/v1"
$headers = @{
  "apikey" = $svcKey
  "Authorization" = "Bearer $svcKey"
  "Content-Type" = "application/json"
  "Prefer" = "return=minimal"
}

$listings = '[
  {"id":"b1000001-0000-0000-0000-000000000001","realtor_id":"a1b2c3d4-0000-0000-0000-000000000002","brokerage_id":"a1b2c3d4-0000-0000-0000-000000000001","property_type":"condo","title":"Modern Studio Condo in BGC","description":"Brand new studio unit in the heart of BGC. Perfect for investment or OFW family use.","price_php":4500000,"lat":14.5547,"lng":121.0509,"address":"Bonifacio Global City","province":"Metro Manila","city":"Taguig","barangay":"BGC","lot_area_sqm":32,"block_number":"A","lot_number":"12","status":"active","is_featured":true,"blockchain_verified":true},
  {"id":"b1000002-0000-0000-0000-000000000001","realtor_id":"a1b2c3d4-0000-0000-0000-000000000002","brokerage_id":"a1b2c3d4-0000-0000-0000-000000000001","property_type":"house_and_lot","title":"House & Lot in Quezon City","description":"Spacious 3-bedroom house near schools and hospitals.","price_php":8500000,"lat":14.6760,"lng":121.0437,"address":"Batasan Hills","province":"Metro Manila","city":"Quezon City","barangay":"Batasan Hills","lot_area_sqm":120,"block_number":"B","lot_number":"5","status":"active","is_featured":false,"blockchain_verified":true},
  {"id":"b1000003-0000-0000-0000-000000000001","realtor_id":"a1b2c3d4-0000-0000-0000-000000000002","brokerage_id":"a1b2c3d4-0000-0000-0000-000000000001","property_type":"residential_lot","title":"Residential Lot in Paranaque","description":"Clean title lot in a prime location near NAIA.","price_php":3200000,"lat":14.4793,"lng":121.0198,"address":"BF Homes","province":"Metro Manila","city":"Paranaque","barangay":"BF Homes","lot_area_sqm":200,"block_number":"C","lot_number":"8","status":"active","is_featured":false,"blockchain_verified":false},
  {"id":"b1000004-0000-0000-0000-000000000001","realtor_id":"a1b2c3d4-0000-0000-0000-000000000002","brokerage_id":"a1b2c3d4-0000-0000-0000-000000000001","property_type":"house_and_lot","title":"House & Lot in Bacoor Cavite","description":"Ready for occupancy 2-bedroom townhouse near Aguinaldo Highway.","price_php":2800000,"lat":14.4624,"lng":120.9645,"address":"Molino Blvd","province":"Cavite","city":"Bacoor","barangay":"Molino","lot_area_sqm":80,"block_number":"D","lot_number":"3","status":"active","is_featured":true,"blockchain_verified":true},
  {"id":"b1000005-0000-0000-0000-000000000001","realtor_id":"a1b2c3d4-0000-0000-0000-000000000002","brokerage_id":"a1b2c3d4-0000-0000-0000-000000000001","property_type":"residential_lot","title":"Lot in Dasmariñas Cavite","description":"Corner lot in a gated subdivision. Ideal for OFW investment.","price_php":1500000,"lat":14.3294,"lng":120.9367,"address":"Salawag","province":"Cavite","city":"Dasmariñas","barangay":"Salawag","lot_area_sqm":150,"block_number":"E","lot_number":"22","status":"active","is_featured":false,"blockchain_verified":true},
  {"id":"b1000006-0000-0000-0000-000000000001","realtor_id":"a1b2c3d4-0000-0000-0000-000000000002","brokerage_id":"a1b2c3d4-0000-0000-0000-000000000001","property_type":"house_and_lot","title":"RFO House in General Trias","description":"Ready for occupancy 3-bedroom house near CALAX exit.","price_php":3500000,"lat":14.3869,"lng":120.8817,"address":"Tejero","province":"Cavite","city":"General Trias","barangay":"Tejero","lot_area_sqm":100,"block_number":"F","lot_number":"7","status":"active","is_featured":false,"blockchain_verified":false},
  {"id":"b1000007-0000-0000-0000-000000000001","realtor_id":"a1b2c3d4-0000-0000-0000-000000000002","brokerage_id":"a1b2c3d4-0000-0000-0000-000000000001","property_type":"residential_lot","title":"Lot in Sta. Rosa Laguna","description":"Prime lot near Nuvali. Great appreciation potential.","price_php":2200000,"lat":14.2830,"lng":121.1114,"address":"Tagaytay Road","province":"Laguna","city":"Sta. Rosa","barangay":"Tagaytay Road","lot_area_sqm":180,"block_number":"G","lot_number":"15","status":"active","is_featured":true,"blockchain_verified":true},
  {"id":"b1000008-0000-0000-0000-000000000001","realtor_id":"a1b2c3d4-0000-0000-0000-000000000002","brokerage_id":"a1b2c3d4-0000-0000-0000-000000000001","property_type":"farm_lot","title":"Farm Lot in Calamba Laguna","description":"Agricultural lot with mountain view near hot spring resorts.","price_php":1800000,"lat":14.2115,"lng":121.1653,"address":"Pansol","province":"Laguna","city":"Calamba","barangay":"Pansol","lot_area_sqm":500,"block_number":"H","lot_number":"1","status":"active","is_featured":false,"blockchain_verified":false},
  {"id":"b1000009-0000-0000-0000-000000000001","realtor_id":"a1b2c3d4-0000-0000-0000-000000000002","brokerage_id":"a1b2c3d4-0000-0000-0000-000000000001","property_type":"condo","title":"Condo Unit in Cebu IT Park","description":"High-rise condo in the business district. Fully furnished.","price_php":5200000,"lat":10.3310,"lng":123.9054,"address":"Cebu IT Park","province":"Cebu","city":"Cebu City","barangay":"Lahug","lot_area_sqm":45,"block_number":"I","lot_number":"18","status":"active","is_featured":true,"blockchain_verified":true},
  {"id":"b1000010-0000-0000-0000-000000000001","realtor_id":"a1b2c3d4-0000-0000-0000-000000000002","brokerage_id":"a1b2c3d4-0000-0000-0000-000000000001","property_type":"house_and_lot","title":"House & Lot in Mandaue Cebu","description":"Corner house in a quiet village near SM Mandaue.","price_php":4800000,"lat":10.3236,"lng":123.9223,"address":"Casuntingan","province":"Cebu","city":"Mandaue","barangay":"Casuntingan","lot_area_sqm":110,"block_number":"J","lot_number":"9","status":"active","is_featured":false,"blockchain_verified":true},
  {"id":"b1000011-0000-0000-0000-000000000001","realtor_id":"a1b2c3d4-0000-0000-0000-000000000002","brokerage_id":"a1b2c3d4-0000-0000-0000-000000000001","property_type":"residential_lot","title":"Lot in Davao City","description":"Titled lot in a prime subdivision near Abreeza Mall.","price_php":2500000,"lat":7.0731,"lng":125.6128,"address":"Matina","province":"Davao del Sur","city":"Davao City","barangay":"Matina","lot_area_sqm":200,"block_number":"K","lot_number":"4","status":"active","is_featured":false,"blockchain_verified":false},
  {"id":"b1000012-0000-0000-0000-000000000001","realtor_id":"a1b2c3d4-0000-0000-0000-000000000002","brokerage_id":"a1b2c3d4-0000-0000-0000-000000000001","property_type":"house_and_lot","title":"Modern House in Davao City","description":"Modern 4-bedroom house in a gated community.","price_php":7500000,"lat":7.1907,"lng":125.4553,"address":"Buhangin","province":"Davao del Sur","city":"Davao City","barangay":"Buhangin","lot_area_sqm":150,"block_number":"L","lot_number":"11","status":"active","is_featured":true,"blockchain_verified":true},
  {"id":"b1000013-0000-0000-0000-000000000001","realtor_id":"a1b2c3d4-0000-0000-0000-000000000002","brokerage_id":"a1b2c3d4-0000-0000-0000-000000000001","property_type":"commercial","title":"Commercial Lot in Angeles City","description":"Prime commercial lot along MacArthur Highway.","price_php":6000000,"lat":15.1450,"lng":120.5887,"address":"MacArthur Highway","province":"Pampanga","city":"Angeles City","barangay":"Balibago","lot_area_sqm":300,"block_number":"M","lot_number":"2","status":"active","is_featured":false,"blockchain_verified":true},
  {"id":"b1000014-0000-0000-0000-000000000001","realtor_id":"a1b2c3d4-0000-0000-0000-000000000002","brokerage_id":"a1b2c3d4-0000-0000-0000-000000000001","property_type":"residential_lot","title":"Beach Lot in Batangas","description":"Lot with sea view near Laiya Beach. Perfect for vacation home.","price_php":3800000,"lat":13.6218,"lng":121.3680,"address":"Laiya","province":"Batangas","city":"San Juan","barangay":"Laiya","lot_area_sqm":250,"block_number":"N","lot_number":"6","status":"active","is_featured":true,"blockchain_verified":false},
  {"id":"b1000015-0000-0000-0000-000000000001","realtor_id":"a1b2c3d4-0000-0000-0000-000000000002","brokerage_id":"a1b2c3d4-0000-0000-0000-000000000001","property_type":"house_and_lot","title":"House & Lot in Iloilo City","description":"Elegant 3-bedroom house in Mandurriao district.","price_php":4200000,"lat":10.7202,"lng":122.5621,"address":"Mandurriao","province":"Iloilo","city":"Iloilo City","barangay":"Mandurriao","lot_area_sqm":130,"block_number":"O","lot_number":"14","status":"active","is_featured":false,"blockchain_verified":true}
]'

try {
  $r = Invoke-WebRequest -Uri "$base/listings" -Method POST -Headers $headers -Body $listings -UseBasicParsing
  Write-Host "SUCCESS: 15 listings inserted! Status: $($r.StatusCode)"
} catch {
  Write-Host "ERROR: $($_.Exception.Message)"
  Write-Host $_.ErrorDetails.Message
}

# Insert photos for all listings
$photos = '[
  {"listing_id":"b1000001-0000-0000-0000-000000000001","url":"https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800","is_primary":true,"sort_order":0},
  {"listing_id":"b1000002-0000-0000-0000-000000000001","url":"https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800","is_primary":true,"sort_order":0},
  {"listing_id":"b1000003-0000-0000-0000-000000000001","url":"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800","is_primary":true,"sort_order":0},
  {"listing_id":"b1000004-0000-0000-0000-000000000001","url":"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800","is_primary":true,"sort_order":0},
  {"listing_id":"b1000005-0000-0000-0000-000000000001","url":"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800","is_primary":true,"sort_order":0},
  {"listing_id":"b1000006-0000-0000-0000-000000000001","url":"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800","is_primary":true,"sort_order":0},
  {"listing_id":"b1000007-0000-0000-0000-000000000001","url":"https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800","is_primary":true,"sort_order":0},
  {"listing_id":"b1000008-0000-0000-0000-000000000001","url":"https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800","is_primary":true,"sort_order":0},
  {"listing_id":"b1000009-0000-0000-0000-000000000001","url":"https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800","is_primary":true,"sort_order":0},
  {"listing_id":"b1000010-0000-0000-0000-000000000001","url":"https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800","is_primary":true,"sort_order":0},
  {"listing_id":"b1000011-0000-0000-0000-000000000001","url":"https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800","is_primary":true,"sort_order":0},
  {"listing_id":"b1000012-0000-0000-0000-000000000001","url":"https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800","is_primary":true,"sort_order":0},
  {"listing_id":"b1000013-0000-0000-0000-000000000001","url":"https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800","is_primary":true,"sort_order":0},
  {"listing_id":"b1000014-0000-0000-0000-000000000001","url":"https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800","is_primary":true,"sort_order":0},
  {"listing_id":"b1000015-0000-0000-0000-000000000001","url":"https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800","is_primary":true,"sort_order":0}
]'

try {
  $r2 = Invoke-WebRequest -Uri "$base/listing_photos" -Method POST -Headers $headers -Body $photos -UseBasicParsing
  Write-Host "SUCCESS: Photos inserted! Status: $($r2.StatusCode)"
} catch {
  Write-Host "Photo error: $($_.Exception.Message)"
}
