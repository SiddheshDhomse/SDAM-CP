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

function searchSalesByPhone(phone) {
    const salesRef = database.ref('purchases');
    salesRef.orderByChild('customerPhone').equalTo(phone).once('value', snapshot => {
        const salesHistoryBody = document.getElementById('salesHistoryBody');
        salesHistoryBody.innerHTML = ''; // Clear existing data

        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const purchase = childSnapshot.val();
                const purchaseDate = new Date(purchase.timestamp).toLocaleDateString(); // Format date

                // Convert items to an array (whether it's an object or already an array)
                const items = purchase.items ? Object.values(purchase.items) : [];

                const row = `
                    <tr>
                        <td>${purchaseDate}</td>
                        <td>${purchase.customerName}</td>
                        <td>Rs ${parseFloat(purchase.totalPrice).toFixed(2)}</td>
                        <td>${items.map(item => item.name).join(', ')}</td>
                        <td>
                            <button class="btn btn-danger" onclick="onButtonClick('${childSnapshot.key}')">Select</button>
                        </td>
                    </tr>
                `;
                salesHistoryBody.innerHTML += row; // Append new row
            });
        } else {
            console.log("No data available for the given phone number.");
        }
    }).catch(error => {
        console.error("Error fetching sales by phone:", error);
    });
}


// Function to display items in the table when a button is clicked
function onButtonClick(billId) {
    const salesHistoryBody = document.getElementById('salesHistoryBody');
    salesHistoryBody.innerHTML = ''; // Clear any existing rows

    const itemsRef = database.ref(`purchases/${billId}/items`); // Reference to the bill's items

    // Fetch the items from Firebase
    itemsRef.once('value', (snapshot) => {
        const items = snapshot.val(); // Get the items from the snapshot

        if (items) {
            Object.keys(items).forEach(key => {
                const row = document.createElement('tr'); // Create a new table row element
                const item = items[key]; // Get the item object

                // Create <td> for each property you want to display
                const nameCell = document.createElement('td');
                nameCell.textContent = item.name;
                
                const priceCell = document.createElement('td');
                priceCell.textContent = `Rs ${parseFloat(item.price).toFixed(2)}`;

                const barcodeCell = document.createElement('td');
                barcodeCell.textContent = item.barcode;

                // Create the delete button
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.classList.add('btn', 'btn-danger', 'mx-2');
                deleteButton.onclick = () => deleteItem(billId, item.barcode); // Assign delete function

                // Create the update button
                const updateButton = document.createElement('button');
                updateButton.textContent = 'Update';
                updateButton.classList.add('btn', 'btn-primary');
                updateButton.onclick = () => updateItem(billId, item.barcode); // Assign update function

                const actionCell = document.createElement('td'); // Create a <td> for the buttons
                actionCell.appendChild(deleteButton); // Append delete button to the cell
                actionCell.appendChild(updateButton); // Append update button to the cell

                // Append all cells to the row
                row.appendChild(nameCell);
                row.appendChild(priceCell);
                row.appendChild(barcodeCell);
                row.appendChild(actionCell);

                // Append the row to the table body
                salesHistoryBody.appendChild(row);
            });
        } else {
            console.log('No items found in this bill.');
        }
    }).catch(error => {
        console.error('Error fetching items from Firebase:', error);
    });
}

// Function to update an item based on a new barcode and quantity entered by the user
function updateItem(billId, oldBarcode) {
    // Prompt for new barcode and quantity
    const newBarcode = prompt('Enter the new barcode for the product:', oldBarcode);
    const newQuantity = prompt('Enter the new quantity for the product:', '1'); // Default to 1 if not entered

    if (newBarcode && newQuantity) {
        const productsRef = database.ref(`products`);

        // Fetch the product details from the 'products' reference using the new barcode
        productsRef.orderByChild('barcode').equalTo(newBarcode).once('value', (snapshot) => {
            const productData = snapshot.val();

            if (productData) {
                const productKey = Object.keys(productData)[0]; // Get the product key
                const product = productData[productKey]; // Get the product object from the snapshot

                const itemsRef = database.ref(`purchases/${billId}/items`);

                // Fetch the items in the bill to find the product with the old barcode
                itemsRef.once('value', (snapshot) => {
                    const items = snapshot.val();
                    const itemKey = Object.keys(items).find(key => items[key].barcode === oldBarcode);

                    if (itemKey) {
                        const itemRef = database.ref(`purchases/${billId}/items/${itemKey}`);

                        // Update the item's name, price, barcode, and quantity
                        itemRef.update({
                            name: product.name,
                            price: parseFloat(product.price),
                            barcode: product.barcode,
                            quantity: parseInt(newQuantity) // Update quantity
                        }).then(() => {
                            console.log('Item updated successfully');

                            // Recalculate the total price after updating
                            recalculateTotalPrice(billId, items);
                        }).catch(error => {
                            console.error('Error updating item:', error);
                        });
                    } else {
                        console.log('Item with the given old barcode not found in this bill.');
                    }
                });
            } else {
                console.log('No product found with the given new barcode.');
            }
        }).catch(error => {
            console.error('Error fetching product from Firebase:', error);
        });
    } else {
        console.log('Update canceled. No new barcode or quantity entered.');
    }
}



// Function to delete an item based on barcode and adjust the total price
function deleteItem(billId, barcode) {
    const itemsRef = database.ref(`purchases/${billId}/items`);

    // Fetch the items to find the product with the given barcode
    itemsRef.once('value', (snapshot) => {
        const items = snapshot.val();

        // Find the item with the matching barcode
        const itemKey = Object.keys(items).find(key => items[key].barcode === barcode);

        if (itemKey) {
            const itemPrice = items[itemKey].price; // Get the item's price before deleting
            const itemQuantity = items[itemKey].quantity || 1; // Handle item quantity

            const itemRef = database.ref(`purchases/${billId}/items/${itemKey}`);
            const totalPriceRef = database.ref(`purchases/${billId}/totalPrice`);

            // Remove the item from Firebase
            itemRef.remove().then(() => {
                console.log('Item deleted successfully');

                // Recalculate the total price after deleting
                recalculateTotalPrice(billId, items, -itemPrice * itemQuantity);
            }).catch(error => {
                console.error('Error deleting item:', error);
            });
        } else {
            console.log('Item with the given barcode not found.');
        }
    });
}

// Function to recalculate the total price after an item is updated or deleted
function recalculateTotalPrice(billId, items, adjustment = 0) {
    let newTotalPrice = 0;

    // Loop through all items to calculate the new total price
    Object.keys(items).forEach(key => {
        newTotalPrice += parseFloat(items[key].price) * (items[key].quantity || 1);
    });

    // Apply any adjustment from deletion if applicable
    newTotalPrice += adjustment;

    // Update the total price in Firebase
    const totalPriceRef = database.ref(`purchases/${billId}/totalPrice`);
    totalPriceRef.set(newTotalPrice.toFixed(2))
        .then(() => {
            console.log('Total price recalculated successfully');
            onButtonClick(billId); // Refresh the table after update
        })
        .catch(error => {
            console.error('Error updating total price:', error);
        });
}


// Event listener for search button
document.getElementById('searchButton').addEventListener('click', () => {
    const phoneInput = document.getElementById('phoneInput').value;
    searchSalesByPhone(phoneInput);
});
