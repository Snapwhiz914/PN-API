import csv
import requests
import time

req_num = 0
log = csv.writer(open("log.csv", "w+"))
try:
    while True:
        body = requests.get("http://127.0.0.1:7769/scanner/statistics/").json()
        log.writerow([req_num, body["check_queue_size"], body["non_blacklisted_ips"]])
        time.sleep(5)
        req_num += 1
except KeyboardInterrupt:
    pass

print(req_num)