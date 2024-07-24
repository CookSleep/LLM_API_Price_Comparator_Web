import yfinance as yf
import json
from datetime import datetime, timedelta

# 获取USD/CNY汇率
usdcny = yf.Ticker("USDCNY=X")
rate = usdcny.info['regularMarketPrice']

# 创建包含汇率和更新时间的数据 (使用北京时间)
beijing_time = datetime.utcnow() + timedelta(hours=8)
data = {
    "rate": rate,
    "updated_at": beijing_time.strftime("%Y-%m-%d %H:%M:%S")
}

# 将数据写入JSON文件
with open('exchange_rate.json', 'w') as f:
    json.dump(data, f)

print(f"Exchange rate updated: {rate} at {data['updated_at']} (Beijing Time)")
