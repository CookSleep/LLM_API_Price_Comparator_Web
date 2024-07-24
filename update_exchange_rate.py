import yfinance as yf
import json
from datetime import datetime

# 获取USD/CNY汇率
usdcny = yf.Ticker("USDCNY=X")
rate = usdcny.info['regularMarketPrice']

# 创建包含汇率和更新时间的数据
data = {
    "rate": rate,
    "updated_at": datetime.utcnow().isoformat()
}

# 将数据写入JSON文件
with open('exchange_rate.json', 'w') as f:
    json.dump(data, f)

print(f"Exchange rate updated: {rate}")
