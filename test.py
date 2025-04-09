import requests

for i in range(0,1):
    res = requests.put("http://localhost:3000/updateDriverLoc?userid=124&lat=20.123&lon=27.123&status=F")
    print(res.json())

for i in range(0,1):
    res = requests.get("http://localhost:3000/getDriverLoc?userid=124")
    print(res.json())

for i in range(0,1):
    res = requests.put("http://localhost:3000/updateDriverStatus?userid=124&status=F")
    print(res.json())