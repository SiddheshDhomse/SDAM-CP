// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCh17JupaGm8uCV3UI9DWjvfJ7PaVt2o-g",
    authDomain: "pet-store-billing.firebaseapp.com",
    databaseURL: "https://pet-store-billing-default-rtdb.firebaseio.com",
    projectId: "pet-store-billing",
    storageBucket: "pet-store-billing.appspot.com",
    messagingSenderId: "146782373741",
    appId: "1:146782373741:web:f79a227313a43edc81fc64",
    measurementId: "G-W67RCM2HYT"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Function to load sales history
function loadSalesHistory() {
    const salesHistoryBody = document.getElementById('salesHistoryBody');
    const salesRef = database.ref('purchases');

    salesRef.once('value', snapshot => {
        salesHistoryBody.innerHTML = ''; // Clear existing data

        snapshot.forEach(childSnapshot => {
            const purchase = childSnapshot.val();
            const purchaseDate = new Date(purchase.timestamp);
            const dateFormatted = purchaseDate.toLocaleDateString(); // Format date
            const row = `
                <tr>
                    <td>${dateFormatted}</td>
                    <td>${purchase.customerName}</td>
                    <td>Rs ${parseFloat(purchase.totalPrice).toFixed(2)}</td>
                    <td>${purchase.paymentMethod}</td>
                </tr>
            `;
            salesHistoryBody.innerHTML += row; // Append new row
        });
    });
}

// Load sales history when the page loads
window.onload = function() {
    loadSalesHistory();
};
