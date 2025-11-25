
const categories = {
  expense: ["Food", "Transport", "Utilities", "Rent", "Shopping", "Entertainment", "Health", "Education"],
  income: ["Salary", "Freelance", "Business Income", "Bonus", "Investments", "Gifts"]
};

const alert = document.getElementById("Alert");
const message = document.getElementById("Message");

const typeSelect = document.getElementById("type");
const categorySelect = document.getElementById("category");
const currencySelect = document.getElementById("currency");

const menuBtn = document.getElementById("menu-btn");
const sidebar = document.getElementById("sidebar");
const closeSidebar = document.getElementById("close-sidebar");
const addBtn = document.getElementById("add-btn");
const tableBody = document.querySelector(".table tbody");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let exchange = JSON.parse(localStorage.getItem("exchange")) || { USD: 1, GBP: 1, EUR: 1, EGP: 1 };

//session only  resets on page reload
let summaryFilterState = {
  selectedYear: new Date().getFullYear(),
  selectedMonths: [new Date().getMonth() + 1],
  isCustomSelection: false
};

/////filter nav opening and closing in table and summary section
function setupFilterSidebar(filterBtnId, filterNavId, overlayId, closeBtnId) {
  const filterBtn = document.getElementById(filterBtnId);
  const filterNav = document.getElementById(filterNavId);
  const overlay = document.getElementById(overlayId);
  const closeBtn = document.getElementById(closeBtnId);

  if (filterBtn && filterNav && overlay && closeBtn) {
    filterBtn.addEventListener("click", () => {
      filterNav.classList.add("active");
      overlay.classList.add("active");
      document.body.classList.add("no-scroll");


      if (filterNavId === 'filter-month-sidenav') {
        summaryFilter();
      }
    });

    overlay.addEventListener("click", () => {
      filterNav.classList.remove("active");
      overlay.classList.remove("active");
      document.body.classList.remove("no-scroll");
    });

    closeBtn.addEventListener("click", () => {
      filterNav.classList.remove("active");
      overlay.classList.remove("active");
      document.body.classList.remove("no-scroll");
    });
  }
}

document.addEventListener('DOMContentLoaded', function () {
  //table
  setupFilterSidebar("filter", "filter-sidenav", "overlay", "close-filter");

  //summary
  setupFilterSidebar("filter-month", "filter-month-sidenav", "overlay-sum", "close-filter-Month");

  initializeSummaryFilter();
});




function summaryFilter() {
  const currentYear = document.getElementById('current-year');
  const yearDecrease = document.getElementById('year-decrease');
  const yearIncrease = document.getElementById('year-increase');
  const monthButtons = document.querySelectorAll('.month-btn');
  const applyBtnMonth = document.getElementById('apply-btn-month');
  const clearAllMonth = document.querySelector('#filter-month-sidenav .clear-all');

  // Set current year
  currentYear.textContent = summaryFilterState.selectedYear;

  //flags to prevent duplicate listeners
  if (!yearDecrease.hasAttribute('data-listener-attached')) {
    yearDecrease.setAttribute('data-listener-attached', 'true');
    yearDecrease.addEventListener('click', () => {
      summaryFilterState.selectedYear--;
      currentYear.textContent = summaryFilterState.selectedYear;
      updateMonthButtonsState();
    });
  }

  if (!yearIncrease.hasAttribute('data-listener-attached')) {
    yearIncrease.setAttribute('data-listener-attached', 'true');
    yearIncrease.addEventListener('click', () => {
      summaryFilterState.selectedYear++;
      currentYear.textContent = summaryFilterState.selectedYear;
      updateMonthButtonsState();
    });
  }

  //month buttons
  for (let i = 0; i < monthButtons.length; i++) {
    const button = monthButtons[i];
    if (!button.hasAttribute('data-listener-attached')) {
      button.setAttribute('data-listener-attached', 'true');
      button.addEventListener('click', function () {
        const month = parseInt(this.getAttribute('data-month'));

        let index = -1;
        for (let i = 0; i < summaryFilterState.selectedMonths.length; i++) {
          if (summaryFilterState.selectedMonths[i] === month) {
            index = i;
            break;
          }
        }

        if (index > -1) {
          summaryFilterState.selectedMonths.splice(index, 1);
          this.classList.remove('active');
        } else {
          summaryFilterState.selectedMonths.push(month);
          this.classList.add('active');
        }

        summaryFilterState.isCustomSelection = true;
      });
    }
  }

  //apply button
  if (!applyBtnMonth.hasAttribute('data-listener-attached')) {
    applyBtnMonth.setAttribute('data-listener-attached', 'true');

    applyBtnMonth.addEventListener('click', () => {
      updateSummaryForSelectedPeriod();
      document.getElementById('filter-month-sidenav').classList.remove('active');
      document.getElementById('overlay-sum').classList.remove('active');
      document.body.classList.remove('no-scroll');
    });
  }

  //clear button
  if (!clearAllMonth.hasAttribute('data-listener-attached')) {
    clearAllMonth.setAttribute('data-listener-attached', 'true');
    clearAllMonth.addEventListener('click', () => {
      resetToCurrentMonth();
      updateMonthButtonsState();
      updateSummaryForSelectedPeriod();
    });
  }

  // Initialize month buttons state
  updateMonthButtonsState();
}

function updateMonthButtonsState() {
  const monthButtons = document.querySelectorAll('.month-btn');

  for (let i = 0; i < monthButtons.length; i++) {
    const button = monthButtons[i];
    const month = parseInt(button.getAttribute('data-month'));
    if (summaryFilterState.selectedMonths.includes(month)) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  }
}

function resetToCurrentMonth() {
  const now = new Date();
  summaryFilterState.selectedYear = now.getFullYear();
  summaryFilterState.selectedMonths = [now.getMonth() + 1];
  summaryFilterState.isCustomSelection = false;

  document.getElementById('current-year').textContent = summaryFilterState.selectedYear;
}

function initializeSummaryFilter() {
  //always start with current month 
  //don't remember across page reloads
  resetToCurrentMonth();
  updateSummaryForSelectedPeriod();
}

function updateKPIDisplay() {
  const { expenseData, incomeData } = calculatePieChartData();
  const kpis = calculateKPIs(expenseData, incomeData);


  document.getElementById('largest-expense').textContent = kpis.largestExpense;
  document.getElementById('smallest-expense').textContent = kpis.smallestExpense;
  document.getElementById('top-income').textContent = kpis.topIncome;
}

function updateSummaryForSelectedPeriod() {
  const totals = calculateSummaryTotals();
  const budgetProgress = calculateBudgetProgress();

  updateSummaryCards(totals);
  updateBudgetProgressForPeriod(budgetProgress);
  updateAllCharts();
  updateKPIDisplay();
}

function calculateSummaryTotals() {
  let totalIncome = 0;
  let totalExpenses = 0;


  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];

    const transactionDate = new Date(transaction.date);
    const transactionYear = transactionDate.getFullYear();
    const transactionMonth = transactionDate.getMonth() + 1;

    //matching selected period
    if (transactionYear === summaryFilterState.selectedYear && summaryFilterState.selectedMonths.includes(transactionMonth)) {

      const amountEGP = transaction.amount * exchange[transaction.currency];

      if (transaction.type === "income") {
        totalIncome += amountEGP;
      } else if (transaction.type === "expense") {
        totalExpenses += amountEGP;
      }
    }
  }

  const balance = totalIncome - totalExpenses;
  return { totalIncome, totalExpenses, balance };
}

function calculateBudgetProgress() {
  let totalBudget = 0;
  let totalSpent = 0;

  //for each selected month get budget settings 

  for (let i = 0; i < summaryFilterState.selectedMonths.length; i++) {
    const month = summaryFilterState.selectedMonths[i];
    const monthYear = `${summaryFilterState.selectedYear}-${month}`;
    const monthlyBudget = getBudgetForMonth(monthYear);
    const monthlySpent = getSpendingForMonth(monthYear);

    totalBudget += monthlyBudget;
    totalSpent += monthlySpent;

  }

  let percentage;

  if (totalBudget > 0) {
    const rawPercentage = (totalSpent / totalBudget) * 100;

    if (rawPercentage > 100) {
      percentage = 100;
    } else {
      percentage = rawPercentage;
    }
  } else {
    percentage = 0;
  }

  return {
    totalBudget,
    totalSpent,
    percentage,
    monthCount: summaryFilterState.selectedMonths.length
  };
}

function getBudgetForMonth(monthYear) {
  const budgetSettings = JSON.parse(localStorage.getItem("budgetSettings")) || {
    monthlyBudget: 0,
    currency: 'EGP',
    isActive: false,
    monthYear: getCurrentMonthYear()
  };

  if (budgetSettings.isActive && budgetSettings.monthYear === monthYear) {
    //convert budget to EGP
    return budgetSettings.monthlyBudget * exchange[budgetSettings.currency];
  }

  return 0;
}

function getSpendingForMonth(monthYear) {
  let monthlySpent = 0;


  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];
    const transactionDate = new Date(transaction.date);
    const transactionMonthYear = `${transactionDate.getFullYear()}-${transactionDate.getMonth() + 1}`;

    if (transactionMonthYear === monthYear && transaction.type === 'expense') {
      monthlySpent += transaction.amount * exchange[transaction.currency];
    }

  }

  return monthlySpent;
}

function updateSummaryCards(totals) {
  document.getElementById("income").textContent = `${totals.totalIncome.toFixed(2)} EGP`;
  document.getElementById("expense").textContent = `${totals.totalExpenses.toFixed(2)} EGP`;
  document.getElementById("balance").textContent = `${totals.balance.toFixed(2)} EGP`;
}

function updateBudgetProgressForPeriod(budgetProgress) {
  const progressCircle = document.getElementById('budget-progress-circle');
  const percentageElement = document.getElementById('budget-percentage');
  const spentElement = document.getElementById('budget-spent');
  const statusElement = document.getElementById('budget-status');
  const budgetTitle = document.querySelector('.budget-card .card-title');

  //update title to show period
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  let periodText;
  if (summaryFilterState.selectedMonths.length === 1) {
    const monthName = monthNames[summaryFilterState.selectedMonths[0] - 1];
    periodText = `${monthName} ${summaryFilterState.selectedYear}`;
  } else {
    periodText = `${summaryFilterState.selectedMonths.length} months, ${summaryFilterState.selectedYear}`;
  }

  budgetTitle.textContent = `Budget Progress (${periodText})`;

  if (budgetProgress.totalBudget === 0) {
    progressCircle.style.background = 'conic-gradient(#3a4a50 0%, #3a4a50 100%)';
    percentageElement.textContent = '0%';
    spentElement.textContent = '0/0 EGP';
    statusElement.textContent = `Set budget for selected period in Settings`;
    statusElement.className = 'budget-status';
    return;
  }

  progressCircle.style.background = `conic-gradient(#00b4d8 ${budgetProgress.percentage}%, #3a4a50 ${budgetProgress.percentage}% 100%)`;
  percentageElement.textContent = `${budgetProgress.percentage.toFixed(1)}%`;
  spentElement.textContent = `${budgetProgress.totalSpent.toFixed(2)}/${budgetProgress.totalBudget.toFixed(2)} EGP`;

  let status = 'safe';
  let text = 'Within budget';

  if (budgetProgress.percentage >= 100) {
    status = 'exceeded';
    text = 'Budget exceeded!';
  } else if (budgetProgress.percentage >= 80) {
    status = 'danger';
    text = 'Approaching limit!';
  } else if (budgetProgress.percentage >= 60) {
    status = 'warning';
    text = 'Spending moderately';
  }

  //for multi month selections
  if (budgetProgress.monthCount > 1) {
    text += ` (${budgetProgress.monthCount} months)`;
  }

  statusElement.textContent = text;
  statusElement.className = `budget-status ${status}`;
}



//////////////////////////////////////////////



function toggleFilter(header) {
  header.classList.toggle("active");
  const options = header.nextElementSibling;
  if (options.style.display === "flex") {
    options.style.display = "none";
  } else {
    options.style.display = "flex";
  }
}

typeSelect.addEventListener("change", () => {
  const selectedType = typeSelect.value;
  categorySelect.innerHTML = '<option value="" disabled selected>-</option>';

  const successMessage = document.getElementById("success-message");
  if (successMessage) {
    successMessage.style.display = "none";
  }


  if (categories[selectedType]) {
    const list = categories[selectedType];
    for (let i = 0; i < list.length; i++) {
      const newOption = document.createElement("option");
      newOption.value = list[i];
      newOption.textContent = list[i];
      categorySelect.appendChild(newOption);
    }
  }

  validateSingleInput('type', selectedType);
});

function showSection(id, event) {
  document.body.classList.remove("no-scroll");
  const allSections = document.querySelectorAll('.section');
  for (let i = 0; i < allSections.length; i++) {
    allSections[i].style.display = 'none';
  }
  document.getElementById(id).style.display = 'flex';



  const Buttons = document.querySelectorAll('.nav-link');
  for (let i = 0; i < Buttons.length; i++) {
    Buttons[i].classList.remove('active-btn');
  }
  let button = event.currentTarget;
  button.classList.add('active-btn');

  if (window.innerWidth <= 768) {
    sidebar.classList.remove('active');
    menuBtn.classList.remove('active');
    document.getElementById("menu-icon").innerHTML =
      '<path fill="#ffffff" d="M27 193.6c-8.2-8.2-12.2-18.6-12.2-31.2s4-23 12.2-31.2S45.6 119 58.2 119h912.4c12.6 0 23 4 31.2 12.2s12.2 18.6 12.2 31.2s-4 23-12.2 31.2s-18.6 12.2-31.2 12.2H58.2c-12.6 0-23-4-31.2-12.2zm974.8 285.2c8.2 8.2 12.2 18.6 12.2 31.2s-4 23-12.2 31.2s-18.6 12.2-31.2 12.2H58.2c-12.6 0-23-4-31.2-12.2S14.8 522.6 14.8 510s4-23 12.2-31.2s18.6-12.2 31.2-12.2h912.4c12.6 0 23 4 31.2 12.2zm0 347.4c8.2 8.2 12.2 18.6 12.2 31.2s-4 23-12.2 31.2s-18.6 12.2-31.2 12.2H58.2c-12.6 0-23-4-31.2-12.2S14.8 870 14.8 857.4s4-23 12.2-31.2S45.6 814 58.2 814h912.4c12.6 0 23 4.2 31.2 12.2z"/>';
  }

  if (id === 'summary-section') {
    updateSummaryForSelectedPeriod();
  }

  if (id === 'settings-section') {
    initializeBudgetSettings();
  }
}

menuBtn.addEventListener("click", () => {
  if (window.innerWidth <= 768) {
    sidebar.classList.add("active");
    document.body.classList.add("no-scroll");
  } else {
    sidebar.classList.toggle("collapsed");
  }
});

closeSidebar.addEventListener("click", () => {
  sidebar.classList.remove("active");
  document.body.classList.remove("no-scroll");
});







//helper function to show error for a specific input
function showInputError(inputId, message) {
  const errorElement = document.getElementById(inputId + '-error');
  const inputElement = document.getElementById(inputId);

  if (errorElement && inputElement) {
    errorElement.textContent = message;

    errorElement.style.display = 'block';
    inputElement.classList.add('input-error');
  }
}

//clear error for a specific input
function clearInputError(inputId) {
  const errorElement = document.getElementById(inputId + '-error');
  const inputElement = document.getElementById(inputId);

  if (errorElement && inputElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
    inputElement.classList.remove('input-error');
  }
}

function clearAllErrors() {
  const inputIds = ['type', 'category', 'desc', 'amount', 'currency', 'date'];
  for (let i = 0; i < inputIds.length; i++) {
    clearInputError(inputIds[i]);
  }
}


function setupRealTimeValidation() {
  //type
  const typeInput = document.getElementById('type');
  if (typeInput) {

    typeInput.addEventListener('change', function () {
      clearInputError('type');
      validateSingleInput('type', this.value);
    });
  }

  //category
  const categoryInput = document.getElementById('category');
  if (categoryInput) {
    categoryInput.addEventListener('change', function () {
      clearInputError('category');
      validateSingleInput('category', this.value);
    });
  }

  //rest of imputs
  const otherInputs = ['desc', 'amount', 'date', 'currency'];
  for (let i = 0; i < otherInputs.length; i++) {
    const input = document.getElementById(otherInputs[i]);
    if (input) {
      input.addEventListener('input', function () {
        clearInputError(this.id);

        validateSingleInput(this.id, this.value);
      });

      input.addEventListener('change', function () {
        clearInputError(this.id);

        validateSingleInput(this.id, this.value);
      });
    }
  }
}



function validateSingleInput(inputId, value) {
  if (inputId === 'type') {
    if (!value) {
      showInputError('type', 'Please select a transaction type');
      return false;
    }
  }
  else if (inputId === 'category') {
    if (!value) {
      showInputError('category', 'Please select a category');
      return false;
    }
  }
  else if (inputId === 'desc') {
    const desc = value.trim();
    if (!desc) {
      showInputError('desc', 'Description is required');
      return false;
    }
    if (desc.length < 2) {
      showInputError('desc', 'Description must be at least 2 characters long');
      return false;
    }
    if (desc.length > 100) {
      showInputError('desc', 'Description must be less than 100 characters');
      return false;
    }
    const invalidChars = /[<>{}]/;
    if (invalidChars.test(desc)) {
      showInputError('desc', 'Description contains invalid characters');
      return false;
    }
  }
  else if (inputId === 'amount') {
    if (!value) {
      showInputError('amount', 'Amount is required');
      return false;
    }
    const amountNum = parseFloat(value);
    if (isNaN(amountNum) || amountNum <= 0) {
      showInputError('amount', 'Please enter a valid positive amount');
      return false;
    }
    if (amountNum > 1000000000) {
      showInputError('amount', 'Amount is too large. Maximum is 1,000,000,000');
      return false;
    }
  }
  else if (inputId === 'date') {
    if (!value) {
      showInputError('date', 'Date is required');
      return false;
    }
    const selectedDate = new Date(value);
    const today = new Date();
    //Allow transactions to be added for today's date while still preventing future dates
    today.setHours(23, 59, 59, 999);

    if (selectedDate > today) {
      showInputError('date', 'Cannot add transactions with future dates');
      return false;
    }

    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(today.getFullYear() - 10);
    if (selectedDate < tenYearsAgo) {
      showInputError('date', 'Date is too far in the past. Maximum 10 years back');
      return false;
    }
  }
  else if (inputId === 'currency') {
    if (!value) {
      showInputError('currency', 'Please select a currency');
      return false;
    }
  }

  return true;
}



function validateTransactionForm() {
  let isValid = true;

  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;
  const desc = document.getElementById("desc").value.trim();
  const amount = document.getElementById("amount").value;
  const date = document.getElementById("date").value;
  const currency = document.getElementById("currency").value;

  clearAllErrors();


  if (!validateSingleInput('type', type)) isValid = false;
  if (!validateSingleInput('category', category)) isValid = false;
  if (!validateSingleInput('desc', desc)) isValid = false;
  if (!validateSingleInput('amount', amount)) isValid = false;
  if (!validateSingleInput('date', date)) isValid = false;
  if (!validateSingleInput('currency', currency)) isValid = false;

  return isValid;
}

//the add button at the end of the transaction log
addBtn.addEventListener("click", () => {

  if (!validateTransactionForm()) {
    return;
  }

  //adding transaction
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;
  const desc = document.getElementById("desc").value.trim();
  const amount = document.getElementById("amount").value;
  const date = document.getElementById("date").value;
  const currency = document.getElementById("currency").value;

  const newT = {
    id: Date.now(), type, category, desc, amount: parseFloat(amount), currency, date
  };

  transactions.push(newT);
  localStorage.setItem("transactions", JSON.stringify(transactions));

  appendToTable(newT);
  updateFooter();
  updateSummaryForSelectedPeriod();

  checkBudgetAlert();


  document.getElementById("type").value = "";
  document.getElementById("category").innerHTML = '<option value="" disabled selected>-</option>';
  document.getElementById("desc").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("date").value = "";
  document.getElementById("currency").value = "EGP";
  clearAllErrors();

  //success message
  const successMessage = document.getElementById("success-message");
  if (successMessage) {
    successMessage.textContent = "Transaction added successfully!";
    successMessage.style.display = "block";


    setTimeout(() => {
      successMessage.style.display = "none";
    }, 3000);
  }
});

document.addEventListener('DOMContentLoaded', function () {
  setupRealTimeValidation();
});



/////

//all stored transactions on load are displayed
window.addEventListener("DOMContentLoaded", function () {
  for (let i = 0; i < transactions.length; i++) {
    appendToTable(transactions[i]);
  }
  updateFooter();
  updateCategoryFilterOptions();
});

function appendToTable(t) {
  const noRow = document.querySelector(".no-transactions-row");
  if (noRow) {
    noRow.remove();
  }

  let Color;
  if (t.type === 'income') {
    Color = 'green';
  } else {
    Color = 'red';
  }

  const amountEGP = (t.amount * exchange[t.currency]).toFixed(2);
  const row = document.createElement("tr");

  row.innerHTML = `
  <th scope="row">${tableBody.children.length + 1}</th>
  <td>${t.date}</td>
  <td style="color:${Color};">${t.type}</td>
  <td>${t.category}</td>
  <td>${t.desc}</td>
  <td style="color:${Color};">${t.amount.toFixed(2)} ${t.currency}</td>
  <td style="color:${Color};">${amountEGP} EGP</td>
  <td><button class="btn btn-danger btn-sm" onclick="deleteRow(${t.id})">X</button></td>
`;
  tableBody.appendChild(row);
}

document.getElementById("Ok").onclick = () => {
  alert.style.display = "none";
};

const applyFilterBtn = document.querySelector('.apply-btn');
const clearAllBtn = document.getElementById('clearAll');
const typeCheckboxes = document.querySelectorAll('#type-group input[type="checkbox"]');

function updateCategoryFilterOptions() {
  const categoryOptions = document.querySelector('#category-group .filter-options');
  const typeCheckboxes = document.querySelectorAll('#type-group input[type="checkbox"]:checked');
  const selectedTypes = [];
  for (let i = 0; i < typeCheckboxes.length; i++) {
    selectedTypes.push(typeCheckboxes[i].value);
  }

  let availableCategories = [];
  if (selectedTypes.length === 0) {
    for (let type in categories) {
      for (let i = 0; i < categories[type].length; i++) {
        availableCategories.push(categories[type][i]);
      }
    }
  } else {
    for (let i = 0; i < selectedTypes.length; i++) {
      const type = selectedTypes[i];
      for (let j = 0; j < categories[type].length; j++) {
        availableCategories.push(categories[type][j]);
      }
    }
  }

  availableCategories.sort();
  let categoryHTML = '';
  for (let i = 0; i < availableCategories.length; i++) {
    categoryHTML += `<label><input type="checkbox" value="${availableCategories[i]}"> ${availableCategories[i]}</label>`;
  }
  categoryOptions.innerHTML = categoryHTML;
}

for (let i = 0; i < typeCheckboxes.length; i++) {
  typeCheckboxes[i].addEventListener('change', updateCategoryFilterOptions);
}

function applyFilters() {
  const typeCheckboxes = document.querySelectorAll('#type-group input[type="checkbox"]:checked');
  const selectedTypes = [];
  for (let i = 0; i < typeCheckboxes.length; i++) {
    selectedTypes.push(typeCheckboxes[i].value);
  }

  const categoryCheckboxes = document.querySelectorAll('#category-group input[type="checkbox"]:checked');
  const selectedCategories = [];
  for (let i = 0; i < categoryCheckboxes.length; i++) {
    selectedCategories.push(categoryCheckboxes[i].value);
  }

  const fromDate = document.getElementById('from-date').value;
  const toDate = document.getElementById('to-date').value;

  let filteredTransactions = [];

  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];
    let typeMatch = true;
    if (selectedTypes.length > 0) {
      typeMatch = false;
      for (let j = 0; j < selectedTypes.length; j++) {
        if (transaction.type === selectedTypes[j]) {
          typeMatch = true;
          break;
        }
      }
    }

    let categoryMatch = true;
    if (selectedCategories.length > 0) {
      categoryMatch = false;
      for (let j = 0; j < selectedCategories.length; j++) {
        if (transaction.category === selectedCategories[j]) {
          categoryMatch = true;
          break;
        }
      }
    }

    const transactionDate = new Date(transaction.date);
    let fromDateObj = null;
    if (fromDate) {
      fromDateObj = new Date(fromDate)
    }
    let toDateObj = null;
    if (toDate) {
      toDateObj = new Date(toDate)
    }
    let dateMatch = true;
    if (fromDateObj) {
      dateMatch = dateMatch && (transactionDate >= fromDateObj);
    }
    if (toDateObj) {
      dateMatch = dateMatch && (transactionDate <= toDateObj);
    }

    if (typeMatch && categoryMatch && dateMatch) {
      filteredTransactions.push(transaction);
    }
  }

  if (currentSort.field && currentSort.direction) {
    filteredTransactions = applySorting(filteredTransactions);
  }

  renderFilteredTable(filteredTransactions);
  const filterNav = document.getElementById('filter-sidenav');
  const overlay = document.getElementById('overlay');

  if (filterNav && overlay) {
    filterNav.classList.remove("active");
    overlay.classList.remove("active");
    document.body.classList.remove("no-scroll");
  }

}

function clearAllFilters() {
  const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
  for (let i = 0; i < allCheckboxes.length; i++) {
    allCheckboxes[i].checked = false;
  }
  document.getElementById('from-date').value = '';
  document.getElementById('to-date').value = '';
  updateCategoryFilterOptions();

  const radioButtons = document.querySelectorAll('input[name="sort"]');
  for (let i = 0; i < radioButtons.length; i++) {
    radioButtons[i].checked = false;
  }
  const dirButtons = document.querySelectorAll('input[name="direction"]');
  dirButtons[0].checked = true;
  dirButtons[1].checked = false;

  currentSort.field = null;
  currentSort.direction = 'asc';
  renderFilteredTable(transactions);


  ///
  //to reset date validation errors
  const errorMessage = document.getElementById('date-range-error');
  if (errorMessage) {
    errorMessage.style.display = 'none';

    errorMessage.textContent = '';
  }
  const fromDateInput = document.getElementById('from-date');
  const toDateInput = document.getElementById('to-date');
  if (toDateInput && fromDateInput) {
    toDateInput.classList.remove('date-input-error');
    fromDateInput.classList.remove('date-input-error');

  }

  //to enable again apply button
  const applyBtn = document.getElementById('apply-btn');
  if (applyBtn) {
    applyBtn.disabled = false;
    applyBtn.style.opacity = '1';
    applyBtn.style.cursor = 'pointer';
  }
}

function renderFilteredTable(filteredTransactions) {
  tableBody.innerHTML = "";
  if (filteredTransactions.length === 0) {
    tableBody.innerHTML = `
      <tr class="no-transactions-row">
        <td colspan="8" class="text-center">No transactions found</td>
      </tr>
    `;
  } else {
    for (let i = 0; i < filteredTransactions.length; i++) {
      appendToTable(filteredTransactions[i]);
    }
  }
  updateFooter(filteredTransactions);
}

function updateFooter(transactionsToUse = null) {
  const data = transactionsToUse || transactions;
  const totals = calculateTotals(data);
  document.getElementById("total-income").textContent = `${totals.totalIncome.toFixed(2)} EGP`;
  document.getElementById("total-expenses").textContent = `${totals.totalExpenses.toFixed(2)} EGP`;
  document.getElementById("current-balance").textContent = `${totals.balance.toFixed(2)} EGP`;
}

function calculateTotals(data) {
  let totalIncome = 0;
  let totalExpenses = 0;
  for (let i = 0; i < data.length; i++) {
    const amountEGP = data[i].amount * exchange[data[i].currency];
    if (data[i].type === "income") {
      totalIncome += amountEGP;
    } else if (data[i].type === "expense") {
      totalExpenses += amountEGP;
    }
  }
  const balance = totalIncome - totalExpenses;
  return { totalIncome, totalExpenses, balance };
}

//removing a record from transaction table
function deleteRow(id) {
  let updated = [];
  for (let i = 0; i < transactions.length; i++) {
    if (transactions[i].id !== id) {
      updated.push(transactions[i]);
    }
  }
  transactions = updated;
  localStorage.setItem("transactions", JSON.stringify(transactions));
  applyFilters();
  updateSummaryForSelectedPeriod();

}

applyFilterBtn.addEventListener('click', applyFilters);
clearAllBtn.addEventListener('click', clearAllFilters);

window.addEventListener("DOMContentLoaded", async function () {
  await fetchExchangeRates();
  renderFilteredTable(transactions);
  updateFooter();
  updateSummaryForSelectedPeriod();
  initializeCharts();
});

async function fetchExchangeRates() {
  try {
    const API = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await API.json();
    exchange = {
      USD: data.rates.EGP,
      GBP: data.rates.EGP / data.rates.GBP,
      EUR: data.rates.EGP / data.rates.EUR,
      EGP: 1
    };
    localStorage.setItem("exchange", JSON.stringify(exchange));
  } catch (error) {
    console.error("Using last known rates due to failure to load API", error);
  }
}



///////////////////
function validateDateRange() {
  const fromDate = document.getElementById('from-date').value;
  const toDate = document.getElementById('to-date').value;
  const applyBtn = document.getElementById('apply-btn');
  const fromDateInput = document.getElementById('from-date');
  const toDateInput = document.getElementById('to-date');
  const errorMessage = document.getElementById('date-range-error');

  if (fromDate && toDate) {
    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(toDate);

    if (toDateObj < fromDateObj) {
      applyBtn.disabled = true;
      applyBtn.style.opacity = '0.5';
      applyBtn.style.cursor = 'not-allowed';

      errorMessage.textContent = "To date cannot be earlier than From date";
      errorMessage.style.display = 'block';

      toDateInput.classList.add('date-input-error');
      fromDateInput.classList.add('date-input-error');
    } else {
      applyBtn.disabled = false;
      applyBtn.style.opacity = '1';
      applyBtn.style.cursor = 'pointer';

      errorMessage.style.display = 'none';

      toDateInput.classList.remove('date-input-error');
      fromDateInput.classList.remove('date-input-error');

    }
  } else {
    applyBtn.disabled = false;
    applyBtn.style.opacity = '1';
    applyBtn.style.cursor = 'pointer';

    errorMessage.style.display = 'none';

    toDateInput.classList.remove('date-input-error');
    fromDateInput.classList.remove('date-input-error');

  }
}


document.addEventListener('DOMContentLoaded', function () {
  const fromDateInput = document.getElementById('from-date');
  const toDateInput = document.getElementById('to-date');

  if (fromDateInput && toDateInput) {
    fromDateInput.addEventListener('change', validateDateRange);
    toDateInput.addEventListener('change', validateDateRange);
  }
});







//sort by in filtration 
let currentSort = { field: null, direction: 'asc' };

function applySorting(transactions) {
  if (!currentSort.field) {
    return transactions;
  }
  const copied = [];
  for (let i = 0; i < transactions.length; i++) {
    copied.push(transactions[i]);
  }
  const sorted = copied.sort((a, b) => {
    let aValue, bValue;
    if (currentSort.field === 'date') {
      aValue = new Date(a.date);
      bValue = new Date(b.date);
    } else if (currentSort.field === 'type') {
      aValue = a.type.toLowerCase();
      bValue = b.type.toLowerCase();
    } else if (currentSort.field === 'amount') {
      aValue = a.amount * exchange[a.currency];
      bValue = b.amount * exchange[b.currency];
    } else {
      return 0;
    }
    if (currentSort.direction === 'asc') {
      if (aValue > bValue) {
        return 1;
      } else {
        return -1;
      }
    } else {
      if (aValue < bValue) {
        return 1;
      } else {
        return -1;
      }
    }
  });
  return sorted;
}

document.addEventListener('DOMContentLoaded', function () {
  const sortFieldButtons = document.querySelectorAll('input[name="sort"]');
  const directionButtons = document.querySelectorAll('input[name="direction"]');

  for (let i = 0; i < sortFieldButtons.length; i++) {
    sortFieldButtons[i].addEventListener('change', function () {
      if (this.checked) {
        currentSort.field = this.value;
      }
    });
  }

  for (let i = 0; i < directionButtons.length; i++) {
    directionButtons[i].addEventListener('change', function () {
      if (this.checked) {
        currentSort.direction = this.value;
      }
    });
  }

  applyFilterBtn.addEventListener('click', function () {
    applyFilters();
  });
});



///////////////////////////////////////

//budget tracking
let budgetSettings = JSON.parse(localStorage.getItem("budgetSettings")) || {
  monthlyBudget: 0,
  currency: 'EGP',
  isActive: false,
  monthYear: getCurrentMonthYear()
};

let budgetHistory = JSON.parse(localStorage.getItem("budgetHistory")) || [];

function initializeBudgetSettings() {
  checkNewMonthReset();
  const budgetInput = document.getElementById('monthly-budget');
  const currencySelect = document.getElementById('budget-currency');
  const budgetDisplay = document.getElementById('current-budget-display');

  if (budgetSettings.isActive) {
    budgetInput.value = budgetSettings.monthlyBudget;
    currencySelect.value = budgetSettings.currency;
    budgetDisplay.textContent = `Current Budget (${formatMonthYear(budgetSettings.monthYear)}): ${budgetSettings.monthlyBudget} ${budgetSettings.currency}`;
  } else {
    budgetDisplay.textContent = 'No budget set';
  }
  updateSummaryForSelectedPeriod();
}

function checkNewMonthReset() {
  const currentMonthYear = getCurrentMonthYear();
  if (budgetSettings.monthYear !== currentMonthYear && budgetSettings.isActive) {
    saveToBudgetHistory();
    budgetSettings.monthlyBudget = 0;
    budgetSettings.monthYear = currentMonthYear;
    budgetSettings.isActive = false;
    localStorage.setItem("budgetSettings", JSON.stringify(budgetSettings));
  }
}

function saveToBudgetHistory() {
  const previousMonthYear = budgetSettings.monthYear;
  const spent = MonthlySpending(previousMonthYear);
  const historyEntry = {
    monthYear: previousMonthYear,
    budget: budgetSettings.monthlyBudget,
    spent: spent,
    currency: budgetSettings.currency,
    savedAt: new Date().toISOString()
  };
  let temp = [historyEntry];
  for (let i = 0; i < budgetHistory.length; i++) {
    temp.push(budgetHistory[i]);
  }
  budgetHistory = temp;
  localStorage.setItem("budgetHistory", JSON.stringify(budgetHistory));
}

function MonthlySpending(monthYear = budgetSettings.monthYear) {
  let totalSpent = 0;
  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];
    const transactionDate = new Date(transaction.date);
    const transactionMonthYear = `${transactionDate.getFullYear()}-${transactionDate.getMonth() + 1}`;
    if (transactionMonthYear === monthYear && transaction.type === 'expense') {
      const budgetCurrency = transaction.amount * exchange[transaction.currency] / exchange[budgetSettings.currency];
      totalSpent += budgetCurrency;
    }
  }
  return totalSpent;
}

function formatMonthYear(monthYear) {
  const dateParts = monthYear.split('-');
  const year = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]);
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  return `${monthNames[month - 1]} ${year}`;
}





function getCurrentMonthYear() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}`;
}

function saveBudget() {
  const budgetAmount = parseFloat(document.getElementById('monthly-budget').value);
  const currency = document.getElementById('budget-currency').value;
  const successMessage = document.getElementById('budget-success-message');

  //Clear previous errors and success message
  clearInputError('monthly-budget');
  successMessage.style.display = 'none';

  if (!budgetAmount || budgetAmount <= 0) {
    showInputError('monthly-budget', 'Please enter a valid budget amount');
    return;
  }

  budgetSettings = {
    monthlyBudget: budgetAmount,
    currency: currency,
    isActive: true,
    monthYear: getCurrentMonthYear()
  };
  localStorage.setItem("budgetSettings", JSON.stringify(budgetSettings));

  //success message
  successMessage.textContent = `Budget for ${formatMonthYear(budgetSettings.monthYear)} saved successfully!`;
  successMessage.style.display = 'block';
  setTimeout(() => {
    successMessage.style.display = 'none';
  }, 2000);

  initializeBudgetSettings();
  updateSummaryForSelectedPeriod();
}



function clearBudget() {
  budgetSettings = {
    monthlyBudget: 0,
    currency: 'EGP',
    isActive: false,
    monthYear: getCurrentMonthYear()
  };
  localStorage.setItem("budgetSettings", JSON.stringify(budgetSettings));

  //clear form
  document.getElementById('monthly-budget').value = '';

  document.getElementById('current-budget-display').textContent = 'No budget set';

  //alert for 2 seconds
  message.textContent = "Budget cleared successfully";
  alert.style.display = "flex";

  document.getElementById('Ok').style.display = 'none';
  document.body.classList.add('no-scroll');

  setTimeout(() => {
    alert.style.display = "none";
    document.getElementById('Ok').style.display = 'block';
    document.body.classList.remove('no-scroll');
  }, 2000);

  updateSummaryForSelectedPeriod();
}




let budgetAlertShown = false;

function checkBudgetAlert() {
  if (!budgetSettings.isActive) return;
  const spent = MonthlySpending();
  const percentage = (spent / budgetSettings.monthlyBudget) * 100;
  if ((percentage >= 100 || percentage >= 80) && !budgetAlertShown) {

    document.querySelector('.alert-box').classList.add('budget-alert');

    if (percentage >= 100) {

      const alertMessage = `Budget Exceeded! You've spent ${spent.toFixed(2)} ${budgetSettings.currency}, exceeding your ${budgetSettings.monthlyBudget} ${budgetSettings.currency} budget for ${formatMonthYear(budgetSettings.monthYear)}!`;
      showNotification("Budget Exceeded!", alertMessage);
      message.textContent = alertMessage;
      alert.style.display = "flex";
    }
    else if (percentage >= 80) {

      const alertMessage = `Budget Warning! You've used ${Math.round(percentage)}% of your ${budgetSettings.monthlyBudget} ${budgetSettings.currency} budget for ${formatMonthYear(budgetSettings.monthYear)}. Slow down!`;
      showNotification("Budget Warning", alertMessage);
      message.textContent = alertMessage;
      alert.style.display = "flex";
    }
    budgetAlertShown = true;
  }
  if (percentage < 80) {
    budgetAlertShown = false;
  }
}

function showNotification(title, message) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body: message });
  }
  console.log(`ALERT: ${title} - ${message}`);
}



document.addEventListener('DOMContentLoaded', function () {
  initializeBudgetSettings();

  //budget input
  const budgetInput = document.getElementById('monthly-budget');
  if (budgetInput) {
    budgetInput.addEventListener('input', function () {
      clearInputError('monthly-budget');
    });
  }

  //budget button
  document.getElementById('save-budget').addEventListener('click', saveBudget);
  document.getElementById('clear-budget').addEventListener('click', clearBudget);
});



//////////////////charts/////////////////////////
//instances
let monthlyTrendChart = null;
let expensePieChart = null;
let incomePieChart = null;

function initializeCharts() {

  createMonthlyTrendChart();

  createExpensePieChart();
  createIncomePieChart();
}

function createMonthlyTrendChart() {
  //this is the drawing board where Chart.js will paint the chart
  const ctx = document.getElementById('monthlyTrendChart').getContext('2d');

  monthlyTrendChart = new Chart(ctx, {
    type: 'line',
    data: {

      labels: [],

      datasets: [
        {
          label: 'Income',
          data: [],
          borderColor: '#44e77d',

        },
        {
          label: 'Expenses',
          data: [],
          borderColor: '#FF4444',

        }
      ]
    },
    options: {
      responsive: true,
      // the chart stretch to fill the container
      // without keeping a specific aspect ratio
      maintainAspectRatio: false,
      plugins: {
        legend: {
          //The box that shows what each line represents
          labels: {
            color: 'white'
          }
        },
        //tooltip appears when mouse is near a data point
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          ticks: {
            color: 'white'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.2)'
          }
        },
        y: {
          ticks: {
            color: 'white'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.2)'
          }
        }
      }
    }
  });
}

//expense Pie chart
function createExpensePieChart() {
  const ctx = document.getElementById('expensePieChart').getContext('2d');

  expensePieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
          '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'],
        borderColor: '#3a4a50',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: 'white',
            padding: 15
          }
        },
        //for percentages:
        datalabels: {
          color: 'white',
          font: {
            weight: 'bold',
            size: 14
          },
          formatter: (value, context) => {
            let total = 0;
            for (let i = 0; i < context.dataset.data.length; i++) {
              total = total + context.dataset.data[i];
            }

            let percentage;
            if (total > 0) {
              percentage = (value / total) * 100;
              percentage = percentage.toFixed(1) + '%';
            } else {
              percentage = '0%';
            }

            return percentage;
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

//income Pie Chart
function createIncomePieChart() {
  const ctx = document.getElementById('incomePieChart').getContext('2d');

  incomePieChart = new Chart(ctx, {
    type: 'pie',

    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [
          '#44e77d', '#36D1DC', '#5B86E5', '#8A2387', '#F27121',
          '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'
        ],
        borderColor: '#3a4a50',
        borderWidth: 2
      }]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: 'white',
            padding: 15
          }
        },
        datalabels: {
          color: 'white',
          font: {
            weight: 'bold',
            size: 14
          },
          formatter: (value, context) => {
            let total = 0;
            for (let i = 0; i < context.dataset.data.length; i++) {
              total = total + context.dataset.data[i];
            }

            let percentage;
            if (total > 0) {
              percentage = (value / total) * 100;
              percentage = percentage.toFixed(1) + '%';
            } else {
              percentage = '0%';
            }

            return percentage;
          }
        }
      }


    },
    plugins: [ChartDataLabels]
  });
}

//update with current data
function updateAllCharts() {
  updateMonthlyTrendChart();

  if (!expensePieChart || !incomePieChart) {
    return;
  }

  const { expenseData, incomeData } = calculatePieChartData();

  //update Expense pie Chart
  expensePieChart.data.labels = expenseData.labels;
  expensePieChart.data.datasets[0].data = expenseData.values;
  expensePieChart.update();
  //update income pie Chart
  incomePieChart.data.labels = incomeData.labels;
  incomePieChart.data.datasets[0].data = incomeData.values;
  incomePieChart.update();

}

function updateMonthlyTrendChart() {
  if (!monthlyTrendChart) {
    return;
  }

  const selectedYear = summaryFilterState.selectedYear;
  const { labels, incomeData, expenseData } = calculateTrendChartData(selectedYear);

  monthlyTrendChart.data.labels = labels;

  monthlyTrendChart.data.datasets[0].data = incomeData;
  monthlyTrendChart.data.datasets[1].data = expenseData;

  monthlyTrendChart.update();
}





function calculateTrendChartData(year) {

  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    //for mobile
    return {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      incomeData: [
        quarters(year, 1, 3, 'income'),
        quarters(year, 4, 6, 'income'),
        quarters(year, 7, 9, 'income'),
        quarters(year, 10, 12, 'income')
      ],
      expenseData: [
        quarters(year, 1, 3, 'expense'),
        quarters(year, 4, 6, 'expense'),
        quarters(year, 7, 9, 'expense'),
        quarters(year, 10, 12, 'expense')
      ]
    };
  } else {
    //for desktop monthly data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const incomeData = [];
    const expenseData = [];

    for (let month = 1; month <= 12; month++) {
      incomeData.push(calculateMonthlyTotal(year, month, 'income'));
      expenseData.push(calculateMonthlyTotal(year, month, 'expense'));
    }

    return {
      labels: monthNames,
      incomeData,
      expenseData
    };
  }
}

//to calculate quarterly totals
function quarters(year, startMonth, endMonth, type) {

  let total = 0;
  for (let i = startMonth; i <= endMonth; i++) {
    total += calculateMonthlyTotal(year, i, type);
  }

  return total;
}


//total amount for a specific month and transaction type
function calculateMonthlyTotal(year, month, type) {
  let total = 0;

  for (let i = 0; i < transactions.length; i++) {

    const transaction = transactions[i];

    const transactionDate = new Date(transaction.date);
    const transactionYear = transactionDate.getFullYear();
    const transactionMonth = transactionDate.getMonth() + 1;

    if (transactionYear === year && transactionMonth === month && transaction.type === type) {

      total += transaction.amount * exchange[transaction.currency];
    }
  }

  return total;
}



//only selected months
function calculatePieChartData() {
  const selectedYear = summaryFilterState.selectedYear;
  const selectedMonths = summaryFilterState.selectedMonths;

  const expenseCategories = {};
  const incomeCategories = {};


  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];
    const transactionDate = new Date(transaction.date);
    const transactionYear = transactionDate.getFullYear();
    const transactionMonth = transactionDate.getMonth() + 1;

    if (transactionYear === selectedYear && selectedMonths.includes(transactionMonth)) {
      const amountEGP = transaction.amount * exchange[transaction.currency];

      if (transaction.type === 'expense') {
        expenseCategories[transaction.category] = (expenseCategories[transaction.category] || 0) + amountEGP;
      } else if (transaction.type === 'income') {
        incomeCategories[transaction.category] = (incomeCategories[transaction.category] || 0) + amountEGP;
      }
    }
  }

  return {
    expenseData: {
      labels: Object.keys(expenseCategories),
      values: Object.values(expenseCategories)
    },
    incomeData: {
      labels: Object.keys(incomeCategories),
      values: Object.values(incomeCategories)
    }
  };
}

//on desktop 12 months, and on mobile 4 quarters
window.addEventListener('resize', function () {
  if (monthlyTrendChart) {
    updateMonthlyTrendChart();
  }
});







///////////////////////////
// CSV Export Functionality///
document.addEventListener('DOMContentLoaded', function () {
  const exportCsvBtn = document.getElementById('export-csv');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportToCSV);
  }
});

function exportToCSV() {
  const csvData = generateCSVData();
  const csvContent = formatCSVContent(csvData);
  downloadCSV(csvContent, `ExpenseReport_${getFormattedDate()}.csv`);
}

function generateCSVData() {
  const selectedYear = summaryFilterState.selectedYear;
  const selectedMonths = summaryFilterState.selectedMonths;
  const totals = calculateSummaryTotals();
  const budgetProgress = calculateBudgetProgress();
  const { expenseData, incomeData } = calculatePieChartData();

  //key performance indicators
  const kpis = calculateKPIs(expenseData, incomeData);

  return {
    header: {
      //converting the date object to a string showing only the date part
      generatedDate: new Date().toLocaleDateString(),
      reportPeriod: getReportPeriodText(selectedYear, selectedMonths),
      baseCurrency: 'EGP'
    },
    summary: {
      totalIncome: totals.totalIncome,
      totalExpenses: totals.totalExpenses,
      currentBalance: totals.balance,
      budgetProgress: `${budgetProgress.percentage.toFixed(1)}% (${budgetProgress.totalSpent.toFixed(2)}/${budgetProgress.totalBudget.toFixed(2)} EGP)`
    },
    kpis: kpis,
    expenseBreakdown: expenseData,
    incomeBreakdown: incomeData
  };
}


function calculateKPIs(expenseData, incomeData) {
  let largestExpense = { category: 'N/A', percentage: 0 };
  let smallestExpense = { category: 'N/A', percentage: 100 };
  let topIncome = { category: 'N/A', percentage: 0 };

  //largest and smallest expense 
  if (expenseData.labels.length > 0) {
    let totalExpenses = 0;
    for (let j = 0; j < expenseData.values.length; j++) {
      totalExpenses = totalExpenses + expenseData.values[j];
    }

    for (let i = 0; i < expenseData.labels.length; i++) {
      const categoryAmount = expenseData.values[i];

      const percentage = (categoryAmount / totalExpenses) * 100;

      if (percentage > largestExpense.percentage) {
        largestExpense = {
          category: expenseData.labels[i],
          percentage: percentage
        };
      }
      if (percentage < smallestExpense.percentage) {
        smallestExpense = {
          category: expenseData.labels[i],
          percentage: percentage
        };
      }
    }
  }

  //largesrt income source
  if (incomeData.labels.length > 0) {
    let totalIncome = 0;
    for (let j = 0; j < incomeData.values.length; j++) {

      totalIncome = totalIncome + incomeData.values[j];
    }

    for (let i = 0; i < incomeData.labels.length; i++) {

      const categoryAmount = incomeData.values[i];

      const percentage = (categoryAmount / totalIncome) * 100;

      if (percentage > topIncome.percentage) {
        topIncome = {
          category: incomeData.labels[i],
          percentage: percentage
        };
      }
    }
  }

  let largestExpenseText;
  if (largestExpense.category !== 'N/A') {
    largestExpenseText = `${largestExpense.category} (${largestExpense.percentage.toFixed(1)}%)`;
  } else {
    largestExpenseText = 'No data';
  }

  let smallestExpenseText;


  if (smallestExpense.category !== 'N/A') {
    smallestExpenseText = `${smallestExpense.category} (${smallestExpense.percentage.toFixed(1)}%)`;
  } else {
    smallestExpenseText = 'No data';
  }

  let topIncomeText;

  if (topIncome.category !== 'N/A') {
    topIncomeText = `${topIncome.category} (${topIncome.percentage.toFixed(1)}%)`;
  } else {
    topIncomeText = 'No data';
  }

  return {
    largestExpense: largestExpenseText,
    smallestExpense: smallestExpenseText,
    topIncome: topIncomeText
  };
}

function getReportPeriodText(year, months) {
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  if (months.length === 1) {
    return `${monthNames[months[0] - 1]} ${year}`;
  } else if (months.length === 12) {
    return `Full Year ${year}`;
  } else {
    let monthNamesArray = [];

    for (let i = 0; i < months.length; i++) {

      const monthNumber = months[i];
      const monthIndex = monthNumber - 1;
      const monthName = monthNames[monthIndex];
      monthNamesArray.push(monthName);
    }

    const monthNamesList = monthNamesArray.join(', ');

    return monthNamesList + ' ' + year;
  }
}

function formatCSVContent(data) {
  let csv = '';

  //1.header section

  csv += 'EXPENSE TRACKER REPORT\n';
  csv += `Generated on:,${data.header.generatedDate}\n`;
  csv += `Report Period:,${data.header.reportPeriod}\n`;
  csv += `Base Currency:,${data.header.baseCurrency}\n`;

  csv += '\n';




  //2.summary section
  csv += 'SUMMARY OVERVIEW\n';
  csv += `Total Income,${data.summary.totalIncome.toFixed(2)} EGP\n`;
  csv += `Total Expenses,${data.summary.totalExpenses.toFixed(2)} EGP\n`;
  csv += `Current Balance,${data.summary.currentBalance.toFixed(2)} EGP\n`;
  csv += `Budget Progress,${data.summary.budgetProgress}\n`;

  csv += '\n';


  //3.adding insights
  csv += 'KEY PERFORMANCE INDICATORS\n';
  csv += `Largest Expense Category,${data.kpis.largestExpense}\n`;
  csv += `Smallest Expense Category,${data.kpis.smallestExpense}\n`;
  csv += `Top Income Source,${data.kpis.topIncome}\n`;

  csv += '\n';



  //4.expenses 
  csv += 'EXPENSE BREAKDOWN BY CATEGORY\n';
  csv += 'Category,Amount in EGP,Percentage\n';
  if (data.expenseBreakdown.labels.length > 0) {

    let totalExpenses = 0;
    for (let j = 0; j < data.expenseBreakdown.values.length; j++) {
      totalExpenses = totalExpenses + data.expenseBreakdown.values[j];
    }

    for (let i = 0; i < data.expenseBreakdown.labels.length; i++) {

      let percentage;
      if (totalExpenses > 0) {
        const categoryAmount = data.expenseBreakdown.values[i];
        percentage = (categoryAmount / totalExpenses) * 100;
      } else {
        percentage = 0;
      }

      const categoryName = data.expenseBreakdown.labels[i];
      const amount = data.expenseBreakdown.values[i].toFixed(2);
      const percentageText = percentage.toFixed(1) + '%';

      csv += categoryName + ',' + amount + ',' + percentageText + '\n';
    }
  } else {
    csv += 'No expense data,0.00,0.0%\n';
  }
  csv += '\n';
  //5.income
  csv += 'INCOME BREAKDOWN BY CATEGORY\n';
  csv += 'Category,Amount in EGP,Percentage\n';
  if (data.incomeBreakdown.labels.length > 0) {

    let totalIncome = 0;
    for (let j = 0; j < data.incomeBreakdown.values.length; j++) {
      totalIncome = totalIncome + data.incomeBreakdown.values[j];
    }

    for (let i = 0; i < data.incomeBreakdown.labels.length; i++) {

      let percentage;
      if (totalIncome > 0) {
        const categoryAmount = data.incomeBreakdown.values[i];
        percentage = (categoryAmount / totalIncome) * 100;
      } else {
        percentage = 0;
      }

      const categoryName = data.incomeBreakdown.labels[i];

      const amount = data.incomeBreakdown.values[i].toFixed(2);
      const percentageText = percentage.toFixed(1) + '%';

      csv += categoryName + ',' + amount + ',' + percentageText + '\n';
    }
  } else {
    csv += 'No income data,0.00,0.0%\n';
  }

  return csv;
}




function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);


    message.textContent = 'CSV report downloaded successfully!';
    alert.style.display = 'flex';
    document.getElementById('Ok').style.display = 'none';
    document.body.classList.add('no-scroll');

    //after 2 seconds hide
    setTimeout(() => {
      alert.style.display = 'none';
      document.getElementById('Ok').style.display = 'block';
      document.body.classList.remove('no-scroll');
    }, 2000);
  }
}

function getFormattedDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}



//export table data as CSV
function exportTableToCSV() {
  const table = document.querySelector('.table');

  const rows = table.querySelectorAll('tr');
  let csvContent = '';

  //get table headers
  //skip the last column Delete
  const headers = [];
  const headerCells = rows[0].querySelectorAll('th');
  for (let i = 0; i < headerCells.length - 1; i++) {
    headers.push(headerCells[i].textContent.trim());
  }
  csvContent += headers.join(',') + '\n';

  //start from 1 to skip header row
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].querySelectorAll('td, th');
    const rowData = [];

    for (let j = 0; j < cells.length - 1; j++) {
      let cellText = cells[j].textContent.trim();
      //handle commas in data by wrapping in quotes
      if (cellText.includes(',')) {
        cellText = `"${cellText}"`;
      }
      rowData.push(cellText);
    }
    csvContent += rowData.join(',') + '\n';
  }

  downloadCSV(csvContent, `transactions_${getFormattedDate()}.csv`);
}



//for the export button
document.addEventListener('DOMContentLoaded', function () {

  const exportTableBtn = document.getElementById('export-table-csv');
  if (exportTableBtn) {
    exportTableBtn.addEventListener('click', exportTableToCSV);
  }
});













///////////////////////////
//PDF //
document.addEventListener('DOMContentLoaded', function () {
  const exportPdfBtn = document.getElementById('export-pdf');
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', exportToPDF);
  }
});







async function exportToPDF() {
  message.textContent = 'Generating PDF report...';
  alert.style.display = 'flex';
  document.getElementById('Ok').style.display = 'none';
  document.body.classList.add('no-scroll');


  await generatePDF();


  message.textContent = 'PDF report downloaded successfully!';

  //auto hide after 2 seconds
  setTimeout(() => {
    alert.style.display = 'none';
    document.getElementById('Ok').style.display = 'block';
    document.body.classList.remove('no-scroll');
  }, 2000);


}


//////////////////////////



async function generatePDF() {
  const data = generateCSVData();

  //new PDF document
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  let yPosition = 20;

  //header alone on top. then KPIs (right) and summary (left)
  //then pie charts beside each others, then expense and income summaries beside each others
  yPosition = addHeaderSection(pdf, data, yPosition);
  yPosition = KPIsAndSummary(pdf, data, yPosition);
  yPosition = await addPieChartsSection(pdf, yPosition);
  yPosition = tablesSection(pdf, data, yPosition);


  pdf.save(`ExpenseReport_${getFormattedDate()}.pdf`);
}

function addHeaderSection(pdf, data, yPosition) {

  pdf.setFontSize(16);

  pdf.setFont(undefined, 'bold');
  pdf.text('EXPENSE TRACKER REPORT', 105, yPosition, { align: 'center' });

  pdf.setFontSize(11);
  pdf.setFont(undefined, 'normal');

  pdf.text(`Period: ${data.header.reportPeriod}`, 105, yPosition + 7, { align: 'center' });
  pdf.text(`Generated: ${data.header.generatedDate}`, 105, yPosition + 14, { align: 'center' });
  pdf.text(`Currency: ${data.header.baseCurrency}`, 105, yPosition + 21, { align: 'center' });

  return yPosition + 40;
}



async function addPieChartsSection(pdf, yPosition) {

  //chart containers to images
  const expenseChartImg = await ChartToImage('expensePieChart');
  const incomeChartImg = await ChartToImage('incomePieChart');

  const chartWidth = 80;

  const chartHeight = 50;


  //expense pie chart in the left
  if (expenseChartImg) {
    pdf.addImage(expenseChartImg, 'PNG', 20, yPosition, chartWidth, chartHeight);
    pdf.setFontSize(12);

    pdf.setFont(undefined, 'bold');
    pdf.text('EXPENSE BREAKDOWN', 20, yPosition - 5);
  }


  //income pie chart in the right
  if (incomeChartImg) {
    pdf.addImage(incomeChartImg, 'PNG', 110, yPosition, chartWidth, chartHeight);
    pdf.setFontSize(12);

    pdf.setFont(undefined, 'bold');
    pdf.text('INCOME BREAKDOWN', 110, yPosition - 5);
  }


  return yPosition + chartHeight + 20;


}


//
function KPIsAndSummary(pdf, data, yPosition) {
  //if we need a new page
  if (yPosition > 180) {
    pdf.addPage();
    yPosition = 20;
  }


  //left -Summary Overview
  pdf.setFontSize(12);

  pdf.setFont(undefined, 'bold');
  pdf.text('SUMMARY OVERVIEW', 20, yPosition);

  pdf.setFontSize(11);
  pdf.setFont(undefined, 'normal');

  pdf.text(`Income: ${data.summary.totalIncome.toFixed(2)} EGP`, 20, yPosition + 9);
  pdf.text(`Expenses: ${data.summary.totalExpenses.toFixed(2)} EGP`, 20, yPosition + 16);

  pdf.text(`Balance: ${data.summary.currentBalance.toFixed(2)} EGP`, 20, yPosition + 23);
  pdf.text(`Budget: ${data.summary.budgetProgress.split(' ')[0]}`, 20, yPosition + 30);

  //right- KPIs
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('KEY PERFORMANCE INDICATORS', 110, yPosition);

  pdf.setFontSize(11);
  pdf.setFont(undefined, 'normal');
  pdf.text(`• Largest Expense: ${data.kpis.largestExpense}`, 110, yPosition + 9);
  pdf.text(`• Smallest Expense: ${data.kpis.smallestExpense}`, 110, yPosition + 16);
  pdf.text(`• Top Income Source: ${data.kpis.topIncome}`, 110, yPosition + 23);

  return yPosition + 53;
}




function tablesSection(pdf, data, yPosition) {
  const tableY = yPosition;

  //left 
  addTable(pdf, data.expenseBreakdown, 'EXPENSE SUMMARY', 20, tableY);

  //right 
  addTable(pdf, data.incomeBreakdown, 'INCOME SUMMARY', 110, tableY);

  return yPosition + 40;
}








/////////////////////


async function ChartToImage(chartId) {


  const chartElement = document.getElementById(chartId);

  if (!chartElement) {
    console.log(`Chart element not found: ${chartId}`);
    return null;
  }

  //parent chart container
  const chartContainer = chartElement.closest('.chart-container');
  if (!chartContainer) {

    console.log(`Chart container not found`);
    return null;
  }

  return new Promise((resolve) => {
    html2canvas(chartContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#3a4a50',
      width: chartContainer.scrollWidth,
      height: chartContainer.scrollHeight,
      onclone: function (clonedDoc) {

        const clonedContainer = clonedDoc.getElementById(chartContainer.id);
        if (clonedContainer) {
          clonedContainer.style.backgroundColor = '#3a4a50';
          clonedContainer.style.padding = '10px';
        }
      }
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      resolve(imgData);
    }).catch((error) => {
      console.error(`Error converting ${chartId} to image:`, error);
      resolve(null);
    });
  });
}







function addTable(pdf, breakdownData, title, xPosition, yPosition) {
  pdf.setFontSize(12);

  pdf.setFont(undefined, 'bold');
  pdf.text(title, xPosition, yPosition);

  yPosition += 10;

  //header
  pdf.setFont(undefined, 'bold');
  pdf.text('Category', xPosition, yPosition);

  pdf.text('Amount', xPosition + 40, yPosition);
  pdf.text('%', xPosition + 70, yPosition);

  yPosition += 5;

  pdf.line(xPosition, yPosition, xPosition + 85, yPosition);
  yPosition += 6;


  pdf.setFont(undefined, 'normal');

  if (breakdownData.labels.length > 0) {
    let total = 0;
    for (let j = 0; j < breakdownData.values.length; j++) {
      total += breakdownData.values[j];
    }

    for (let i = 0; i < breakdownData.labels.length; i++) {
      const category = breakdownData.labels[i];
      const amount = breakdownData.values[i].toFixed(2);
      let percentage;

      if (total > 0) {
        const categoryAmount = breakdownData.values[i];
        const calculated = (categoryAmount / total) * 100;
        percentage = calculated.toFixed(1);
      } else {
        percentage = '0.0';
      }
      pdf.text(category, xPosition, yPosition);
      pdf.text(amount, xPosition + 40, yPosition);
      pdf.text(percentage + '%', xPosition + 70, yPosition);

      yPosition += 5;

      //if we need a new page
      if (yPosition > 270) {
        pdf.addPage();

        yPosition = 20;
      }
    }
  } else {
    pdf.text('No data', xPosition, yPosition);

    yPosition += 5;
  }

  return yPosition;
}



////////////logout button////
document.getElementById('logout').addEventListener('click', function () {

  const alert = document.getElementById("Alert");
  const message = document.getElementById("Message");

  const okButton = document.getElementById("Ok");
  const noButton = document.getElementById("No");

  const originalMessage = message.textContent;

  const originalOkText = okButton.textContent;


  message.textContent = "Are you sure you want to logout?";
  okButton.textContent = "Yes";
  noButton.style.display = "block";

  alert.style.display = "flex";
  document.body.classList.add("no-scroll");

  // yes button
  function handleYes() {
    document.body.classList.remove("no-scroll");
    window.location.href = 'index.html';
  }
  //no button
  function handleNo() {

    message.textContent = originalMessage;
    okButton.textContent = originalOkText;

    noButton.style.display = "none";
    alert.style.display = "none";

    document.body.classList.remove("no-scroll");


    okButton.removeEventListener('click', handleYes);
    noButton.removeEventListener('click', handleNo);

    alert.removeEventListener('click', handleOverlay);
  }
  //clicking exactly on the dark background do the same as clicking "No" button
  function handleOverlay(e) {
    if (e.target === alert) {
      handleNo();
    }
  }


  okButton.addEventListener('click', handleYes);
  noButton.addEventListener('click', handleNo);
  alert.addEventListener('click', handleOverlay);
});

























