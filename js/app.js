// --- STATE MANAGEMENT ---
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || ['Food', 'Transport', 'Fun'];
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// --- DOM ELEMENTS ---
const form = document.getElementById('expenseForm');
const itemNameInput = document.getElementById('itemName');
const itemAmountInput = document.getElementById('itemAmount');
const itemCategorySelect = document.getElementById('itemCategory');
const transactionList = document.getElementById('transactionList');
const totalBalanceDisplay = document.getElementById('totalBalance');
const themeToggleBtn = document.getElementById('themeToggle');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const sortSelect = document.getElementById('sortSelect');
let chartInstance = null;

// predefined colors for the chart
const chartColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

// --- INITIALIZATION ---
function init() {
    applyTheme();
    populateCategories();
    render();
}

// --- CORE LOGIC ---
function render() {
    updateBalance();
    renderTransactions();
    updateChart();
}

function updateBalance() {
    const total = transactions.reduce((acc, curr) => acc + curr.amount, 0);
    totalBalanceDisplay.innerText = `$${total.toFixed(2)}`;
}

function renderTransactions() {
    transactionList.innerHTML = '';
    
    if (transactions.length === 0) {
        transactionList.innerHTML = '<p class="text-gray-400 text-sm text-center mt-4">No transactions yet.</p>';
        return;
    }

    // Apply Sorting logic (Optional Challenge)
    let sortedTransactions = [...transactions];
    const sortMethod = sortSelect.value;
    
    if (sortMethod === 'newest') sortedTransactions.sort((a, b) => b.id - a.id);
    if (sortMethod === 'oldest') sortedTransactions.sort((a, b) => a.id - b.id);
    if (sortMethod === 'high') sortedTransactions.sort((a, b) => b.amount - a.amount);
    if (sortMethod === 'low') sortedTransactions.sort((a, b) => a.amount - b.amount);

    sortedTransactions.forEach(trx => {
        const item = document.createElement('div');
        item.className = "flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600";
        
        item.innerHTML = `
            <div>
                <h4 class="font-semibold text-sm">${trx.name}</h4>
                <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">${trx.category}</span>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <span class="font-bold text-brand">$${trx.amount.toFixed(2)}</span>
                <button onclick="deleteTransaction(${trx.id})" class="text-red-500 hover:text-red-700 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded text-xs transition">Delete</button>
            </div>
        `;
        transactionList.appendChild(item);
    });
}

function addTransaction(e) {
    e.preventDefault();
    
    const name = itemNameInput.value.trim();
    const amount = parseFloat(itemAmountInput.value);
    const category = itemCategorySelect.value;

    if (!name || isNaN(amount)) return;

    const transaction = {
        id: Date.now(),
        name,
        amount,
        category
    };

    transactions.push(transaction);
    saveData();
    render();
    
    form.reset();
    itemCategorySelect.value = categories[0]; // Reset dropdown
}

function deleteTransaction(id) {
    transactions = transactions.filter(trx => trx.id !== id);
    saveData();
    render();
}

function saveData() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('categories', JSON.stringify(categories));
}

// --- CHART.JS LOGIC ---
function updateChart() {
    const ctx = document.getElementById('spendingChart').getContext('2d');
    
    // Group totals by category
    const categoryTotals = {};
    categories.forEach(cat => categoryTotals[cat] = 0);
    transactions.forEach(trx => {
        if(categoryTotals[trx.category] !== undefined) {
            categoryTotals[trx.category] += trx.amount;
        }
    });

    const labels = Object.keys(categoryTotals).filter(cat => categoryTotals[cat] > 0);
    const data = labels.map(cat => categoryTotals[cat]);
    const bgColors = labels.map((_, index) => chartColors[index % chartColors.length]);

    if (chartInstance) {
        chartInstance.destroy(); // destroy old chart before rendering new one
    }

    if(data.length === 0) {
        // Show empty donut if no data
        chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['No Data'],
                datasets: [{ data: [1], backgroundColor: ['#e2e8f0'] }]
            },
            options: { cutout: '70%', plugins: { tooltip: { enabled: false }, legend: { display: false } } }
        });
        return;
    }

    chartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: bgColors,
                borderWidth: 2,
                borderColor: isDarkMode ? '#1f2937' : '#ffffff' // matches card background
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: isDarkMode ? '#f3f4f6' : '#1f2937', padding: 20 } }
            }
        }
    });
}

// --- OPTIONAL CHALLENGE FEATURES ---

// 1. Dark/Light Mode
function applyTheme() {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

themeToggleBtn.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode);
    applyTheme();
    updateChart(); // Re-render chart to update border and text colors
});

// 2. Custom Categories
function populateCategories() {
    itemCategorySelect.innerHTML = '';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.innerText = cat;
        itemCategorySelect.appendChild(option);
    });
}

addCategoryBtn.addEventListener('click', () => {
    const newCategory = prompt("Enter new category name:");
    if (newCategory && newCategory.trim() !== '') {
        const formattedCat = newCategory.trim();
        if (!categories.includes(formattedCat)) {
            categories.push(formattedCat);
            saveData();
            populateCategories();
            itemCategorySelect.value = formattedCat;
        } else {
            alert("Category already exists!");
        }
    }
});

// 3. Sorting Transactions
sortSelect.addEventListener('change', renderTransactions);

// --- EVENT LISTENERS ---
form.addEventListener('submit', addTransaction);

// Boot up
init();