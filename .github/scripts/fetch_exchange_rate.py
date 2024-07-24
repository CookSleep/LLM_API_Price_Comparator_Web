import requests
import json
from datetime import datetime

url = "https://query1.finance.yahoo.com/v8/finance/chart/USDCNY=X?interval=1d"

response = requests.get(url)
data = response.json()

exchange_rate = data['chart']['result'][0]['meta']['regularMarketPrice']

result = {
    "rate": exchange_rate,
    "last_updated": datetime.utcnow().isoformat()
}

with open('exchange_rate.json', 'w') as f:
    json.dump(result, f, indent=2)
