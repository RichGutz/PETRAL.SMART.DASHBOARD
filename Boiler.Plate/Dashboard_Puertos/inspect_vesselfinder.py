import requests

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

url = "https://www.vesselfinder.com/vessels?name=ZOILO"
try:
    response = requests.get(url, headers=headers)
    print(f"Status: {response.status_code}")
    with open("vesselfinder_result.html", "w", encoding="utf-8") as f:
        f.write(response.text)
    print("Saved to vesselfinder_result.html")
except Exception as e:
    print(e)
