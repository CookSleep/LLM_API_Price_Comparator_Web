import os
import requests
import json

def fetch_exchange_rate(api_key):
    url = f'https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=CNY&apikey={api_key}'
    response = requests.get(url)
    data = response.json()
    if 'Realtime Currency Exchange Rate' in data:
        return {
            "exchangeRate": data['Realtime Currency Exchange Rate']['5. Exchange Rate'],
            "lastRefreshed": data['Realtime Currency Exchange Rate']['6. Last Refreshed']
        }
    else:
        raise Exception("Error fetching exchange rate")

def main():
    api_key = os.getenv('ALPHA_VANTAGE_API_KEY')
    if not api_key:
        raise Exception("No API key found in environment variables")
    
    exchange_rate = fetch_exchange_rate(api_key)
    with open('exchange_rate.json', 'w') as f:
        json.dump(exchange_rate, f, indent=4)

if __name__ == '__main__':
    main()
