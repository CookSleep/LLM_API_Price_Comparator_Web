import requests
import json
import os

ALPHA_VANTAGE_API_KEY = os.getenv('ALPHA_VANTAGE_API_KEY')

if not ALPHA_VANTAGE_API_KEY:
    raise ValueError("No API key provided. Please set the ALPHA_VANTAGE_API_KEY environment variable.")

url = f"https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=CNY&apikey={ALPHA_VANTAGE_API_KEY}"

response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    try:
        exchange_rate = data["Realtime Currency Exchange Rate"]["5. Exchange Rate"]
        print(f"Exchange rate: {exchange_rate}")
        with open('exchange_rate.json', 'w') as f:
            json.dump({"exchangeRate": exchange_rate}, f)
    except KeyError as e:
        print(f"KeyError: {e}")
        print(json.dumps(data, indent=4))
else:
    print(f"Error: {response.status_code}")
