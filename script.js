const destinations = [];
const goods = [];

// Add destination
function addDestination() {
    const destinationInput = document.getElementById('destination');
    const destination = destinationInput.value.trim();
    if (destination) {
        destinations.push(destination);
        updateList('destination-list', destinations);
        destinationInput.value = '';
    }
}

// Load goods
function loadGoods() {
    const goodsInput = document.getElementById('goods');
    const good = goodsInput.value.trim();
    if (good) {
        goods.push(good);
        updateList('goods-list', goods);
        goodsInput.value = '';
    }
}

// Update list
function updateList(elementId, items) {
    const listElement = document.getElementById(elementId);
    listElement.innerHTML = items.map(item => `<li>${item}</li>`).join('');
}

// Start delivery
function startDelivery() {
    if (destinations.length === 0 || goods.length === 0) {
        alert('Please add destinations and load goods before starting delivery!');
        return;
    }
    alert(`Starting delivery to ${destinations.length} destinations with ${goods.length} goods.`);
    // Logic for delivery can be added here
}
