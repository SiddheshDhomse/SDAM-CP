document.addEventListener('DOMContentLoaded', () => {
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

    let totalAmount = 0;
    let discountAmount = 0;

    const customerNameInput = document.getElementById('customerName');
    const customerPhoneInput = document.getElementById('customerPhone');
    const dogBreedInput = document.getElementById('dogBreed');
    const dogSexInput = document.getElementById('dogSex');
    const dogAgeInput = document.getElementById('dogAge');
    const barcodeInput = document.getElementById('barcodeInput');
    const proceedButton = document.querySelector('button[onclick="proceedToCheckout()"]');

    // Check form validity
    function checkFormValidity() {
        const isNameFilled = customerNameInput.value.trim() !== '';
        const isPhoneFilled = customerPhoneInput.value.trim() !== '';
        proceedButton.disabled = !(isNameFilled && isPhoneFilled);
    }

    // Add event listeners to input fields
    customerNameInput.addEventListener('input', checkFormValidity);
    customerPhoneInput.addEventListener('input', checkFormValidity);

    // Handle barcode input
    function handleBarcodeInput(event) {
        if (event.key === 'Enter') {
            const barcode = barcodeInput.value.trim();
            if (barcode) {
                addProductToBill(barcode);
                barcodeInput.value = ''; // Clear barcode input field
            } else {
                console.error('Barcode input is empty');
            }
        }
    }

    barcodeInput.addEventListener('keypress', handleBarcodeInput);

    function addProductToBill(barcode) {
        database.ref('products').orderByChild('barcode').equalTo(barcode).once('value', snapshot => {
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const product = childSnapshot.val();
                    const tableBody = document.querySelector('#billTable tbody');
                    let row = Array.from(tableBody.getElementsByTagName('tr')).find(row => row.cells[0].textContent === barcode);

                    if (row) {
                        // Update existing row
                        let quantityCell = row.cells[2];
                        let priceCell = row.cells[3];
                        let quantity = parseInt(quantityCell.textContent) + 1;
                        let totalPrice = product.price * quantity;

                        quantityCell.textContent = quantity;
                        priceCell.textContent = totalPrice.toFixed(2);
                    } else {
                        // Add new row
                        row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${product.barcode}</td>
                            <td>${product.name}</td>
                            <td>1</td>
                            <td>${product.price.toFixed(2)}</td>
                            <td><button type="button" onclick="removeProduct(this)">Remove</button></td>
                        `;
                        tableBody.appendChild(row);
                    }

                    updateTotals();
                });
            } else {
                console.error('No such product!');
            }
        }).catch((error) => {
            console.error('Error getting product:', error);
        });
    }

    window.removeProduct = function(button) {
        const row = button.closest('tr');
        const price = parseFloat(row.cells[3].textContent);
        const quantity = parseInt(row.cells[2].textContent);
        totalAmount -= price * quantity;
        row.remove();
        updateTotals();
    };

    function updateTotals() {
        totalAmount = Array.from(document.querySelectorAll('#billTable tbody tr')).reduce((sum, row) => {
            const quantity = parseInt(row.cells[2].textContent);
            const price = parseFloat(row.cells[3].textContent) / quantity;
            return sum + (quantity * price);
        }, 0);

        const discountValue = (discountAmount / 100) * totalAmount;
        const finalAmount = totalAmount - discountValue;

        document.getElementById('totalAmount').textContent = `Rs${totalAmount.toFixed(2)}`;
        document.getElementById('discountAmount').textContent = `Rs${discountValue.toFixed(2)}`;
        document.getElementById('finalAmount').textContent = `Rs${finalAmount.toFixed(2)}`;
    }

    window.proceedToCheckout = function() {
        const cartItems = Array.from(document.querySelectorAll('#billTable tbody tr'));
        if (cartItems.length === 0) {
            alert('Your cart is empty. Please add products before proceeding to checkout.');
            return;
        }

        const customerName = customerNameInput.value.trim();
        const customerPhone = customerPhoneInput.value.trim();

        if (!customerName || !customerPhone) {
            alert('Please fill in your name and phone number before proceeding.');
            return;
        }

        const cartDetails = cartItems.map(row => ({
            barcode: row.cells[0].textContent,
            name: row.cells[1].textContent,
            quantity: parseInt(row.cells[2].textContent),
            price: parseFloat(row.cells[3].textContent)
        }));

        sessionStorage.setItem('customerName', customerName);
        sessionStorage.setItem('customerPhone', customerPhone);
        sessionStorage.setItem('cartItems', JSON.stringify(cartDetails));
        sessionStorage.setItem('discount', discountAmount);

        // Redirect to checkout page
        window.location.href = 'checkout.html';
    };
});
