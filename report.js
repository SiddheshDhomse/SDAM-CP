// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBT7etifTUOyek-0746lh4kZhTgVhmwBOw",
    authDomain: "sdam-7d6e5.firebaseapp.com",
    databaseURL: "https://sdam-7d6e5-default-rtdb.firebaseio.com",
    projectId: "sdam-7d6e5",
    storageBucket: "sdam-7d6e5.appspot.com",
    messagingSenderId: "741293808043",
    appId: "1:741293808043:web:e9764f23df9687af8bdaee"
};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

fetch('header.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('header-placeholder').innerHTML = data;
    });

const datePicker = document.getElementById('hiddenDatePicker');
const dateDisplay = document.getElementById('dateDisplay');

// Function to search for sales by date
function searchSalesByDate(selectedDate) {
    const salesRef = database.ref('purchases');
    
    // Set the start and end of the day in UTC
    const startOfDay = new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0));
    const endOfDay = new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59, 999));

    // Querying the sales for the selected date range
    salesRef.orderByChild('timestamp').startAt(startOfDay.getTime()).endAt(endOfDay.getTime()).once('value', snapshot => {
        const productTableBody = document.getElementById('productTable').getElementsByTagName('tbody')[0];
        productTableBody.innerHTML = ''; // Clear existing data

        let totalAmount = 0; // Initialize total amount variable
        let totalProductsSold = 0; // Initialize total products sold variable

        snapshot.forEach(childSnapshot => {
            const purchase = childSnapshot.val();
            totalAmount += parseFloat(purchase.finalAmount); // Add to total final amount
            totalProductsSold += purchase.items ? purchase.items.length : 1; // Count number of items sold

            const row = `
                <tr>
                    <td>${purchase.items ? purchase.items.map(item => item.name).join(', ') : 'N/A'}</td>
                    <td>${purchase.customerName}</td>
                    <td>Rs ${parseFloat(purchase.finalAmount).toFixed(2)}</td>
                    <td>${purchase.paymentMethod}</td>
                    <td>${purchase.paymentStatus}</td> <!-- Payment status displayed here -->
                </tr>
            `;
            productTableBody.innerHTML += row; // Append new row
        });

        // Display total amount in the "Total Expenses" card
        document.getElementById('totalExpenses').textContent = `Rs ${totalAmount.toFixed(2)}`;

        // Display total number of products sold in the "Products Sold" card
        document.getElementById('totalProductsSold').textContent = totalProductsSold;
    });
}


// Event listener for date picker
datePicker.addEventListener('change', function () {
    const selectedDate = new Date(this.value);
    
    // Check if the selected date is valid
    if (isNaN(selectedDate.getTime())) {
        console.error('Invalid date selected:', this.value);
        return; // Exit if the date is not valid
    }

    // Format the date for display
    const formattedDate = selectedDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    dateDisplay.textContent = formattedDate; // Update button text with selected date

    // Fetch sales data for the selected date
    searchSalesByDate(selectedDate);
});
