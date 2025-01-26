from flask import Flask, render_template, jsonify
import os
import json

app = Flask(__name__)

# Load stock data from JSON files
data_folder = os.path.join(os.path.dirname(__file__), "data")
stock_files = ["apple.json", "google.json", "walmart.json", "boeing.json", "prudential.json"]

stocks = {}

for file in stock_files:
    with open(os.path.join(data_folder, file)) as f:
        stocks[file.split(".")[0]] = json.load(f)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/get_stock/<stock_name>")
def get_stock(stock_name):
    data = stocks.get(stock_name, {})
    return jsonify(data)

@app.route("/buy")
def buy():
    return render_template("buy.html")


if __name__ == "__main__":
    app.run(debug=True)
