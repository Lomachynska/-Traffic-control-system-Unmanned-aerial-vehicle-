const destinations = [];
const goods = [];
let map, markerLayer, droneMarker;
let currentDestinationIndex = 0;
let droneLocation = { lat: 48.3794, lng: 31.1656 };  // Початкове місце БПЛА
let routeLine = null;  // Змінна для зберігання маршруту
let isGoodsLoaded = false;  // Стан, чи вантаж завантажений
let pathCoordinates = [];  // Масив для збереження координат шляху

// Ініціалізація карти
function initializeMap() {
    map = L.map('map').setView([droneLocation.lat, droneLocation.lng], 6); // Центр України
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    markerLayer = L.layerGroup().addTo(map);

    // Додаємо маркер для БПЛА на поточному місці
    droneMarker = L.marker([droneLocation.lat, droneLocation.lng], { icon: createAirplaneIcon() }).addTo(map);

    // Спробуємо отримати поточне місце БПЛА за допомогою геолокації
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(updateDroneLocation, handleError, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
    } else {
        alert("Геолокація не підтримується цим браузером.");
    }
}

// Оновлення місцезнаходження БПЛА на карті
function updateDroneLocation(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    // Оновлюємо місцезнаходження БПЛА та маркер
    droneLocation = { lat, lng };
    droneMarker.setLatLng([lat, lng]);

    // За бажанням, карта може слідувати за БПЛА
    map.setView([lat, lng], 12); // Збільшуємо масштаб карти
}

// Обробка помилок геолокації
function handleError(error) {
    console.warn(`ERROR(${error.code}): ${error.message}`);
}

// Створення користувацької іконки для БПЛА
function createAirplaneIcon() {
    return L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/2991/2991123.png', // URL для іконки літака
        iconSize: [40, 40], // Розмір іконки
        iconAnchor: [20, 20], // Центр іконки
    });
}

// Додавання нового пункту призначення з геолокацією
function addDestination() {
    const destinationInput = document.getElementById('destination');
    const destinationName = destinationInput.value.trim();

    if (!destinationName) {
        alert('Будь ласка, введіть назву пункту призначення!');
        return;
    }

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${destinationName}`)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                alert('Не вдалося знайти місце для вказаного пункту призначення.');
                return;
            }

            const { lat, lon } = data[0];
            const latLng = [parseFloat(lat), parseFloat(lon)];

            destinations.push({ name: destinationName, latLng });
            updateDestinationsList();
            addMarker(latLng, destinationName);
        })
        .catch(error => {
            console.error('Помилка при отриманні геолокації:', error);
        });

    destinationInput.value = '';
}

// Додавання маркера на карту
function addMarker(latLng, label) {
    L.marker(latLng)
        .addTo(markerLayer)
        .bindPopup(label)
        .openPopup();
}

// Оновлення списку пунктів призначення
function updateDestinationsList() {
    const listElement = document.getElementById('destination-list');
    listElement.innerHTML = destinations
        .map(dest => `<li>${dest.name} (Lat: ${dest.latLng[0]}, Lon: ${dest.latLng[1]})</li>`)
        .join('');
}

// Завантаження товару
function loadGoods() {
    const goodsInput = document.getElementById('goods');
    const good = goodsInput.value.trim();
    if (good) {
        goods.push(good);
        updateList('goods-list', goods);
        goodsInput.value = '';
        isGoodsLoaded = true; // Вантаж завантажено
        alert('Товар успішно завантажено!');
    }
}

// Вивантаження товару
function unloadGoods() {
    if (!isGoodsLoaded) {
        alert('Немає товару для вивантаження!');
        return;
    }

    goods.length = 0;  // Очищаємо список товару
    updateList('goods-list', goods);
    isGoodsLoaded = false; // Вантаж вивантажено
    alert('Товар успішно вивантажено!');
}

// Оновлення списку товарів
function updateList(elementId, items) {
    const listElement = document.getElementById(elementId);
    listElement.innerHTML = items.map(item => `<li>${item}</li>`).join('');
}

// Початок доставки
function startDelivery() {
    if (destinations.length === 0 || goods.length === 0) {
        alert('Будь ласка, додайте пункти призначення та завантажте товар перед початком доставки!');
        return;
    }

    currentDestinationIndex = 0;
    pathCoordinates = [];  // Очищаємо шлях перед початком доставки
    moveToNextDestination();
}

// Переміщення БПЛА до наступного пункту призначення
function moveToNextDestination() {
    if (currentDestinationIndex >= destinations.length) {
        alert('Доставка завершена!');
        unloadGoods(); // Вивантажуємо товар після доставки
        showPath(); // Показуємо весь шлях БПЛА
        return;
    }

    const nextDestination = destinations[currentDestinationIndex];
    animateDroneTo(nextDestination.latLng, () => {
        currentDestinationIndex++;
        moveToNextDestination();
    });
}

// Анімація переміщення маркера БПЛА до певного місця
function animateDroneTo(targetLatLng, callback) {
    const startLatLng = droneMarker.getLatLng();
    const duration = 5000; // Тривалість анімації (мс)
    const frameRate = 50; // Кількість кадрів на секунду
    const steps = duration / frameRate; // Кількість кроків

    // Додаємо координати поточного кроку до шляху
    pathCoordinates.push(startLatLng);

    let step = 0;
    const interval = setInterval(() => {
        step++;
        const progress = step / steps;

        const lat = startLatLng.lat + (targetLatLng[0] - startLatLng.lat) * progress;
        const lng = startLatLng.lng + (targetLatLng[1] - startLatLng.lng) * progress;

        droneMarker.setLatLng([lat, lng]);

        if (step >= steps) {
            clearInterval(interval);
            pathCoordinates.push(targetLatLng); // Додаємо кінцеву точку маршруту
            if (callback) callback();
        }
    }, 1000 / frameRate);
}

// Відображення шляху БПЛА на карті
function showPath() {
    if (pathCoordinates.length > 1) {
        // Створюємо лінію маршруту з координат
        const path = L.polyline(pathCoordinates, { color: 'green', weight: 3, opacity: 0.7 }).addTo(map);
        map.fitBounds(path.getBounds()); // Масштаб карти під маршрут
    } else {
        alert('Шлях не був побудований.');
    }
}

// Ініціалізація карти при завантаженні сторінки
document.addEventListener('DOMContentLoaded', initializeMap);
