// Global variables
let graphData = [];
let activeStocks = new Set();
let stockNames = ["Apple", "Google", "Boeing", "Walmart", "Prudential Financial"];
let cash = 100000; // Initial cash amount
let assets = 0; // Initial assets value
let netWorth = cash + assets; // Initial net worth
let playInterval = null; // Interval for the play button

// Define the initial date for a fresh game session
const initialDate = new Date("2008-07-01");

// Check if this is a fresh game start
if (!localStorage.getItem("sessionActive")) {
     //Set the game to start at the initial date
    localStorage.setItem("currentDate", initialDate.toISOString());
    localStorage.setItem("sessionActive", "true"); // Mark session as active
}

 //Retrieve the current date from localStorage
let currentDate = new Date(localStorage.getItem("currentDate"));

// Stock ownership tracker
let stockOwnership = {
    "Apple": 0,
    "Google": 0,
    "Boeing": 0,
    "Walmart": 0,
    "Prudential Financial": 0,
};

// Update the counters on the top bar
function updateCounters() {
    // Update the date display
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const displayDate = `${monthNames[currentDate.getMonth()]}, ${currentDate.getFullYear()}`;
    document.getElementById("current-date").textContent = displayDate;

    // Update financial counters
    netWorth = cash + assets;
    document.getElementById("cash").textContent = cash.toLocaleString();
    document.getElementById("assets").textContent = assets.toLocaleString();
    document.getElementById("net-worth").textContent = netWorth.toLocaleString();
}

// Filter graph data to show only points up to the current date
function filterGraphByDate() {
    const filteredData = graphData.map(trace => {
        const filteredX = [];
        const filteredY = [];
        trace.x.forEach((date, index) => {
            if (new Date(date) <= currentDate) {
                filteredX.push(date);
                filteredY.push(trace.y[index]);
            }
        });
        return { ...trace, x: filteredX, y: filteredY };
    });

    Plotly.newPlot("chart", filteredData, {
        title: "Stock Prices Over Time",
        xaxis: { title: "Date" },
        yaxis: { title: "Price" },
    });
}

// Add or remove a stock from the graph
function addStockToGraph(stockName) {
    if (activeStocks.has(stockName)) {
        activeStocks.delete(stockName);
        graphData = graphData.filter(trace => trace.name !== stockName);
        filterGraphByDate();
        return;
    }

    fetch(`/get_stock/${stockName.toLowerCase()}`)
        .then(response => response.json())
        .then(data => {
            const dates = [];
            const prices = [];
            data.forEach(entry => {
                dates.push(entry.Date);
                prices.push(entry.Price);
            });

            const trace = {
                x: dates,
                y: prices,
                mode: "lines",
                name: stockName,
            };

            activeStocks.add(stockName);
            graphData.push(trace);
            filterGraphByDate();
        })
        .catch(error => console.error("Error fetching stock data:", error));
}

// Play or pause the date progression
function play() {
    if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
        document.getElementById("play-button").textContent = "Play";
    } else {
        playInterval = setInterval(() => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            localStorage.setItem("currentDate", currentDate.toISOString());
            updateCounters();
            filterGraphByDate();
        }, 1000); // Advance every second
        document.getElementById("play-button").textContent = "Pause";
    }
}

// Navigate to the buy page
function goToBuyPage() {
    localStorage.setItem("currentDate", currentDate.toISOString());
    window.location.href = "/buy";
}

// Populate the Buy page with stock information
function loadBuyPage() {
    const stockTable = document.getElementById("stock-rows");
    stockTable.innerHTML = "";

    stockNames.forEach(stock => {
        const currentPrice = getCurrentStockPrice(stock);
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${stock}</td>
            <td>${stockOwnership[stock]}</td>
            <td>$${currentPrice.toFixed(2)}</td>
            <td>
                <input 
                    type="number" 
                    min="0" 
                    max="${Math.floor(cash / currentPrice)}" 
                    id="buy-${stock}" 
                    placeholder="0"
                />
            </td>
        `;

        stockTable.appendChild(row);
    });
}

// Get the current stock price based on the current date
function getCurrentStockPrice(stockName) {
    // Hardcoded stock prices
    const stockPrices = {
        "Apple": 5.9,
        "Boeing": 43.18,
        "Google": 11.23,
        "Prudential Financial": 43.17,
        "Walmart": 16.74,
    };

    // Return the hardcoded price or 0 if the stock is not found
    return stockPrices[stockName] || 0;
}


// Handle buying stocks
function buyAll() {
    stockNames.forEach(stock => {
        const currentPrice = getCurrentStockPrice(stock);
        const inputField = document.getElementById(`buy-${stock}`);
        const amountToBuy = parseInt(inputField.value) || 0;

        if (amountToBuy > 0 && amountToBuy * currentPrice <= cash) {
            cash -= amountToBuy * currentPrice;
            stockOwnership[stock] += amountToBuy;
            assets += amountToBuy * currentPrice;
        }
    });

    updateCounters();
    localStorage.setItem("currentDate", currentDate.toISOString());
    window.location.href = "/";
}

// Initialize the game on page load
updateCounters();
