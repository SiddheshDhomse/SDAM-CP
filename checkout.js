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

// Populate checkout table and calculations
function populateCheckout() {
    const customerName = sessionStorage.getItem('customerName');
    const customerPhone = sessionStorage.getItem('customerPhone');
    const cartItems = JSON.parse(sessionStorage.getItem('cartItems')) || [];
    const discount = parseFloat(sessionStorage.getItem('discount')) || 0;

    document.getElementById('customerName').value = customerName || '';
    document.getElementById('customerPhone').value = customerPhone || '';

    const checkoutTableBody = document.getElementById('checkoutTable').getElementsByTagName('tbody')[0];
    checkoutTableBody.innerHTML = '';

    let totalPrice = 0;

    cartItems.forEach(item => {
        const row = checkoutTableBody.insertRow();
        row.insertCell(0).textContent = item.barcode;
        row.insertCell(1).textContent = item.name;
        row.insertCell(2).textContent = item.quantity;
        const itemTotal = item.price * item.quantity;
        row.insertCell(3).textContent = itemTotal.toFixed(2);
        totalPrice += itemTotal;
    });

    const discountAmount = (totalPrice * (discount / 100)).toFixed(2);
    const finalAmount = (totalPrice - discountAmount).toFixed(2);

    document.getElementById('totalPrice').textContent = `Rs ${totalPrice.toFixed(2)}`;
    document.getElementById('discountAmount').textContent = `Rs ${discountAmount}`;
    document.getElementById('finalAmount').textContent = `Rs ${finalAmount}`;

    // Prepopulate outstanding amount (initially set to 0)
    document.getElementById('outstandingAmount').textContent = 'Rs 0.00';
}

// Calculate outstanding amount
function calculateOutstandingAmount() {
    const finalAmount = parseFloat(document.getElementById('finalAmount').textContent.replace('Rs ', '')) || 0;
    const finalAmountPaid = parseFloat(document.getElementById('finalAmountPaid').value) || 0;
    const outstandingAmount = (finalAmount - finalAmountPaid).toFixed(2);

    document.getElementById('outstandingAmount').textContent = `Rs ${outstandingAmount}`;
}

// Complete the purchase and save to Firebase with a timestamp
// Complete the purchase and save to Firebase with a timestamp
function completePurchase() {
    const customerName = document.getElementById('customerName').value;
    const customerPhone = document.getElementById('customerPhone').value;
    const finalAmount = parseFloat(document.getElementById('finalAmount').textContent.replace('Rs ', '')) || 0;
    const finalAmountPaid = parseFloat(document.getElementById('finalAmountPaid').value) || 0;
    const outstandingAmount = finalAmount - finalAmountPaid;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const paymentStatus = outstandingAmount > 0 ? 'Unpaid' : 'Paid';

    // Get the cart items from session storage
    const cartItems = JSON.parse(sessionStorage.getItem('cartItems')) || [];

    // Get the current timestamp
    const timestamp = Date.now(); // Returns the timestamp in milliseconds

    // Save data to Firebase
    const purchaseData = {
        customerName,
        customerPhone,
        finalAmount,
        finalAmountPaid,
        outstandingAmount,
        paymentMethod,
        paymentStatus,
        items: cartItems, // Include the purchased items
        timestamp // Store the timestamp
    };

    const newPurchaseKey = firebase.database().ref().child('purchases').push().key;
    firebase.database().ref('purchases/' + newPurchaseKey).set(purchaseData)
        .then(() => {
            alert('Purchase completed successfully!');
        })
        .catch((error) => {
            alert('Error completing purchase: ' + error.message);
        });
}


// Print PDF Invoice
function printPDF() {
    const customerName = document.getElementById('customerName').value;
    const customerPhone = document.getElementById('customerPhone').value;
    const finalAmount = document.getElementById('finalAmount').textContent;
    const finalAmountPaid = document.getElementById('finalAmountPaid').value;
    const outstandingAmount = document.getElementById('outstandingAmount').textContent;
    const paymentStatus = outstandingAmount === 'Rs 0.00' ? 'Paid' : 'Unpaid';

    const docDefinition = {
        content: [
            { text: 'Invoice', style: 'header' },
            {
                columns: [
                    { width: '*', text: `Customer Name: ${customerName}` },
                    { width: '*', text: `Phone: ${customerPhone}` }
                ]
            },
            { text: 'Items', style: 'subheader', margin: [0, 20] },
            {
                table: {
                    widths: ['*', '*', '*', '*'],
                    body: [
                        ['Product Name', 'Quantity', 'Price (Rs)', 'Total (Rs)'],
                        ...JSON.parse(sessionStorage.getItem('cartItems')).map(item => [
                            item.name,
                            item.quantity,
                            item.price,
                            item.price * item.quantity
                        ]),
                    ]
                }
            },
            { text: `Total: Rs ${document.getElementById('totalPrice').textContent.replace('Rs ', '')}`, margin: [0, 20] },
            { text: `Discount: Rs ${document.getElementById('discountAmount').textContent.replace('Rs ', '')}`, margin: [0, 5] },
            { text: `Final Amount: Rs ${document.getElementById('finalAmount').textContent.replace('Rs ', '')}`, margin: [0, 5] },
            { text: `Final Payment: Rs ${finalAmountPaid}`, margin: [0, 5] },
            { text: `Outstanding Amount: Rs ${outstandingAmount}`, margin: [0, 5] },
            { text: `Payment Status: ${paymentStatus}`, margin: [0, 5] },
        ],
        styles: {
            header: { fontSize: 18, bold: true, alignment: 'center' },
            subheader: { fontSize: 14, bold: true }
        }
    };

    pdfMake.createPdf(docDefinition).download('invoice.pdf');
}

// Populate checkout data on page load
window.onload = populateCheckout;
