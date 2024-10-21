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

// Search for sales by phone number
function searchSalesByPhone(phone) {
    const salesRef = database.ref('purchases');
    salesRef.orderByChild('customerPhone').equalTo(phone).once('value', snapshot => {
        const salesHistoryBody = document.getElementById('salesHistoryBody');
        const totalOutstandingElement = document.getElementById('totalOutstanding');
        salesHistoryBody.innerHTML = ''; // Clear existing data
        let totalOutstanding = 0; // Initialize total outstanding amount

        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const purchase = childSnapshot.val();
                const isPaid = purchase.paymentStatus === 'Paid';
                const outstandingAmount = isPaid ? 0 : purchase.outstandingAmount;

                totalOutstanding += outstandingAmount; // Add to total outstanding

                const row = `
                    <tr>
                        <td>${purchase.items ? purchase.items.map(item => item.name).join(', ') : 'N/A'}</td>
                        <td>${purchase.customerName}</td>
                        <td>Rs ${parseFloat(purchase.finalAmount).toFixed(2)}</td>
                        <td id="amountPaid-${childSnapshot.key}">Rs ${parseFloat(purchase.finalAmountPaid || 0).toFixed(2)}</td>
                        <td>
                            <span id="outstanding-${childSnapshot.key}">
                                ${isPaid ? 'No Outstanding' : `Rs ${parseFloat(outstandingAmount).toFixed(2)}`}
                            </span>
                        </td>
                        <td>
                            <div class="d-flex">
                                <input type="number" id="paymentInput-${childSnapshot.key}" class="form-control" placeholder="Amount Paid" min="0" ${isPaid ? 'disabled' : ''}>
                                <button class="btn btn-success ml-2" onclick="updatePayment('${childSnapshot.key}')" ${isPaid ? 'disabled' : ''}>Update</button>
                            </div>
                        </td>
                    </tr>
                `;
                salesHistoryBody.innerHTML += row; // Append new row
            });

            // Update the total outstanding amount displayed
            totalOutstandingElement.textContent = `Rs ${totalOutstanding.toFixed(2)}`;
        } else {
            const noDataRow = `<tr><td colspan="6" class="text-center">No data available for the given phone number.</td></tr>`;
            salesHistoryBody.innerHTML = noDataRow;
            totalOutstandingElement.textContent = `Rs 0.00`; // Reset total outstanding when no data
        }
    }).catch(error => {
        console.error("Error fetching sales by phone:", error);
    });
}

// Update payment and outstanding amount
function updatePayment(billId) {
    const paymentInput = parseFloat(document.getElementById(`paymentInput-${billId}`).value);

    if (!isNaN(paymentInput) && paymentInput >= 0) {
        const purchaseRef = database.ref(`purchases/${billId}`);

        // Get the current purchase data
        purchaseRef.once('value').then(snapshot => {
            if (snapshot.exists()) {
                const purchase = snapshot.val();

                // Calculate the new amounts
                const currentAmountPaid = purchase.finalAmountPaid || 0; // Default to 0 if not set
                const newAmountPaid = currentAmountPaid + paymentInput;
                const newOutstanding = purchase.finalAmount - newAmountPaid;

                // Update the database
                purchaseRef.update({
                    finalAmountPaid: newAmountPaid,
                    outstandingAmount: newOutstanding >= 0 ? newOutstanding : 0,
                    paymentStatus: newOutstanding === 0 ? 'Paid' : purchase.paymentStatus // Update payment status
                }).then(() => {
                    console.log('Payment updated successfully');

                    // Update the display dynamically
                    const outstandingElement = document.getElementById(`outstanding-${billId}`);
                    const amountPaidElement = document.getElementById(`amountPaid-${billId}`);
                    const isPaid = newOutstanding === 0;

                    outstandingElement.textContent = isPaid ? 'No Outstanding' : `Rs ${Math.max(newOutstanding, 0).toFixed(2)}`; // Update outstanding amount in UI
                    amountPaidElement.textContent = `Rs ${newAmountPaid.toFixed(2)}`; // Update amount paid in UI

                    // Disable the input and button if paid
                    if (isPaid) {
                        document.getElementById(`paymentInput-${billId}`).disabled = true;
                        document.getElementById(`paymentInput-${billId}`).nextElementSibling.disabled = true;
                    }
                }).catch(error => {
                    console.error('Error updating payment:', error);
                    alert('Error updating the payment. Please try again.');
                });
            } else {
                console.error('Purchase not found in the database.');
                alert('The purchase record does not exist. Please check the phone number and try again.');
            }
        }).catch(error => {
            console.error('Error fetching purchase data:', error);
            alert('Error fetching purchase data. Please try again.');
        });
    } else {
        alert('Please enter a valid number for the payment amount (0 or greater).');
    }
}

// Event listener for search button
document.getElementById('searchButton').addEventListener('click', () => {
    const phoneInput = document.getElementById('phoneInput').value;
    if (phoneInput) {
        searchSalesByPhone(phoneInput);
    } else {
        alert('Please enter a phone number.');
    }
});