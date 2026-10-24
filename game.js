document.addEventListener("DOMContentLoaded", () => {
    let money = 500;
    let gems = 500;
    let collection = {};
    let conveyorItems = []; // Paquetes en la cinta
    let packInventory = []; // Paquetes abriéndose
    let activeWolves = [];
    let currentPage = 1;
    
    const CARDS_PER_PAGE = 9;
    const MAX_OPENING_SLOTS = 10;
    const PACKAGE_LIFETIME = 15000; // 15 segundos de vida en la cinta
    const SPAWN_CHANCE = 0.4; // 40% de probabilidad de spawn cada segundo

    const PACK_TYPES = {
        classics: { price: 100, duration: 5000, name: "The Classics", icon: "📦" },
        colorful: { price: 1200, duration: 30000, name: "Colorful & Powerful", icon: "🌈" },
        unforgettable: { price: 14000, duration: 60000, name: "Unforgettable Fashion", icon: "✨" },
        birthday: { price: 6210, duration: 30000, name: "Happy Birthday Felix", icon: "🎂" },
        flower: { price: 164000, duration: 150000, name: "Flower Garden", icon: "🌸" }
    };

    // --- POOLS DE CARTAS (Mismos que antes) ---
    const classicsPool = [
        { cardKey: "lobito", name: "🐺 Lobito", baseIncome: 2, rarity: "common", tags: [] },
        { cardKey: "cachorrito", name: "🐶 Cachorrito", baseIncome: 3, rarity: "common", tags: [] },
        { cardKey: "paletero", name: "🍦 Lobito Paletero", baseIncome: 4, rarity: "rare", tags: [] },
        { cardKey: "espadachin", name: "⚔️ Lobito Espadachín", baseIncome: 6, rarity: "epic", tags: [] },
        { cardKey: "resortero", name: "🪃 Lobito Resortero", baseIncome: 8, rarity: "legendary", tags: [] }
    ];
    // (Asegúrate de tener los otros pools definidos aquí o importarlos)
    const colorfulPool = []; 
    const unforgettablePool = [];
    const birthdayPool = [];
    const flowerPool = [];

    function getIncomePerSecond(card) {
        return Math.floor(card.baseIncome * (card.level + 1) / 2);
    }

    function checkLevelUp(card) {
        let leveled = false;
        while (card.copies >= Math.pow(2, card.level + 1) - 1) {
            card.level++;
            leveled = true;
        }
        return leveled;
    }

    function getNextLevelRequirement(card) {
        return Math.pow(2, card.level + 1) - 1 - card.copies;
    }

    function rollCardFromPool(pool, packType) {
        if (!pool || pool.length === 0) return classicsPool[0]; // Fallback
        const r = Math.random() * 100;
        let targetRarity = "common";
        
        // Lógica simplificada de rareza para el ejemplo
        if (r < 5) targetRarity = "legendary";
        else if (r < 20) targetRarity = "epic";
        else if (r < 50) targetRarity = "rare";

        const filtered = pool.filter(c => c.rarity === targetRarity);
        const usePool = filtered.length > 0 ? filtered : pool;
        return JSON.parse(JSON.stringify(usePool[Math.floor(Math.random() * usePool.length)]));
    }

    // --- SISTEMA DE CINTA MECÁNICA ---
    
    function startConveyorSystem() {
        setInterval(() => {
            // 1. Intentar Spawnear
            if (Math.random() < SPAWN_CHANCE && conveyorItems.length < 8) {
                spawnRandomPackage();
            }
            // 2. Eliminar Expirados
            removeExpiredPackages();
            // 3. Renderizar para actualizar barras de tiempo
            renderConveyor();
        }, 1000);
    }

    function spawnRandomPackage() {
        const types = Object.keys(PACK_TYPES);
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        conveyorItems.push({
            id: Date.now() + Math.random(),
            type: randomType,
            icon: PACK_TYPES[randomType].icon,
            createdAt: Date.now(),
            expiresAt: Date.now() + PACKAGE_LIFETIME
        });
    }

    function removeExpiredPackages() {
        const now = Date.now();
        const beforeLen = conveyorItems.length;
        conveyorItems = conveyorItems.filter(item => item.expiresAt > now);
        if (conveyorItems.length !== beforeLen) renderConveyor();
    }

    window.buyFromConveyor = function(itemId) {
        const itemIndex = conveyorItems.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return;

        const item = conveyorItems[itemIndex];
        const packPrice = PACK_TYPES[item.type].price;

        if (money < packPrice) {
            alert(`❌ Necesitas $${packPrice} para este paquete.`);
            return;
        }

        money -= packPrice;
        
        // Mover a zona de apertura
        packInventory.push({
            id: item.id,
            type: item.type,
            startedAt: Date.now(),
            duration: PACK_TYPES[item.type].duration,
            status: "opening",
            card: null // Se generará al finalizar
        });

        conveyorItems.splice(itemIndex, 1);
        renderAll();
        saveGame();
    };

    function finishOpening(packId) {
        const pack = packInventory.find(p => p.id === packId);
        if (!pack) return;

        let pool;
        // Asignar pool según tipo
        if (pack.type === "classics") pool = classicsPool;
        else if (pack.type === "colorful") pool = colorfulPool;
        else if (pack.type === "unforgettable") pool = unforgettablePool;
        else if (pack.type === "birthday") pool = birthdayPool;
        else pool = flowerPool;

        const card = rollCardFromPool(pool, pack.type);
        
        if (!collection[card.cardKey]) {
            collection[card.cardKey] = {
                name: card.name, baseIncome: card.baseIncome, level: 1, copies: 0,
                pendingMoney: 0, lastCollect: Date.now(), rarity: card.rarity,
                tags: card.tags || [], bgClass: card.bgClass || ''
            };
        }
        collection[card.cardKey].copies++;
        checkLevelUp(collection[card.cardKey]);
        
        packInventory = packInventory.filter(p => p.id !== packId);
        renderAll();
        saveGame();
    }

    window.collectCardIncome = function(cardKey) {
        const card = collection[cardKey];
        if (!card) return;
        updatePendingMoney(card);
        if (card.pendingMoney <= 0) return;
        money += Math.floor(card.pendingMoney);
        card.pendingMoney = 0;
        card.lastCollect = Date.now();
        renderAll();
        saveGame();
    };

    function updatePendingMoney(card) {
        const now = Date.now();
        const elapsed = (now - card.lastCollect) / 1000;
        card.pendingMoney += getIncomePerSecond(card) * elapsed;
        card.lastCollect = now;
    }

    window.changePage = function(delta) {
        const totalPages = Math.max(1, Math.ceil(Object.keys(collection).length / CARDS_PER_PAGE));
        currentPage = Math.max(1, Math.min(totalPages, currentPage + delta));
        renderBinder();
    };

    // --- RENDERIZADO ---

    function renderConveyor() {
        const belt = document.getElementById("conveyorBelt");
        belt.innerHTML = "";
        const now = Date.now();

        if (conveyorItems.length === 0) {
            belt.innerHTML = '<div style="color:#7f8c8d; width:100%; text-align:center; padding-top:40px;">Esperando producción...</div>';
            return;
        }

        conveyorItems.forEach(item => {
            const div = document.createElement("div");
            div.className = "belt-item";
            div.innerText = item.icon;
            
            // Barra de tiempo restante
            const timeLeft = Math.max(0, item.expiresAt - now);
            const percentage = (timeLeft / PACKAGE_LIFETIME) * 100;
            
            const timerBar = document.createElement("div");
            timerBar.className = "item-timer-bar";
            timerBar.style.width = `${percentage}%`;
            
            // Alerta visual si queda poco tiempo
            if (percentage < 30) div.classList.add("urgent");

            div.appendChild(timerBar);
            div.onclick = () => buyFromConveyor(item.id);
            belt.appendChild(div);
        });
    }

    function renderSlots() {
        const grid = document.getElementById("slotsGrid");
        grid.innerHTML = "";
        const now = Date.now();

        packInventory.forEach(pack => {
            const elapsed = now - pack.startedAt;
            if (elapsed >= pack.duration) {
                finishOpening(pack.id);
                return;
            }

            const slot = document.createElement("div");
            slot.className = `slot opening`;
            const progress = Math.min(100, (elapsed / pack.duration) * 100);
            
            slot.innerHTML = `
                <div style="font-size:2rem">${PACK_TYPES[pack.type].icon}</div>
                <div class="slot-progress"><div class="slot-progress-fill" style="width:${progress}%"></div></div>
            `;
            grid.appendChild(slot);
        });
        document.getElementById("slotsUsed").innerText = packInventory.length;
    }

    function renderBinder() {
        const grid = document.getElementById("binderGrid");
        grid.innerHTML = "";
        const keys = Object.keys(collection);
        const totalPages = Math.max(1, Math.ceil(keys.length / CARDS_PER_PAGE));
        if (currentPage > totalPages) currentPage = totalPages;
        
        document.getElementById("currentPage").innerText = currentPage;
        document.getElementById("totalPages").innerText = totalPages;

        const startIdx = (currentPage - 1) * CARDS_PER_PAGE;
        const pageKeys = keys.slice(startIdx, startIdx + CARDS_PER_PAGE);

        pageKeys.forEach(cardKey => {
            const card = collection[cardKey];
            updatePendingMoney(card);
            const div = document.createElement("div");
            div.className = `binder-card rarity-${card.rarity}`;
            
            const income = getIncomePerSecond(card);
            const pending = Math.floor(card.pendingMoney);

            div.innerHTML = `
                <div class="card-level">Lv${card.level}</div>
                <div class="card-name">${card.name}</div>
                <div class="card-income">💰 $${income}/s</div>
                ${pending > 0 ? `<div class="card-pending" style="color:#00ff88">+$${pending}</div>` : ''}
            `;
            div.onclick = () => collectCardIncome(cardKey);
            grid.appendChild(div);
        });
    }

    function renderUI() {
        document.getElementById("money").innerText = Math.floor(money).toLocaleString();
        document.getElementById("gems").innerText = gems;
        
        let totalIncome = 0;
        Object.values(collection).forEach(card => totalIncome += getIncomePerSecond(card));
        document.getElementById("incomeRate").innerText = totalIncome.toLocaleString();
    }

    function renderAll() {
        renderUI();
        renderConveyor();
        renderSlots();
        renderBinder();
    }

    window.saveGame = function() {
        Object.values(collection).forEach(updatePendingMoney);
        localStorage.setItem("wolfyIncrementalV2", JSON.stringify({
            money, gems, collection, conveyorItems, packInventory, currentPage
        }));
    };

    function loadGame() {
        const data = JSON.parse(localStorage.getItem("wolfyIncrementalV2") || "null");
        if (!data) return;
        money = data.money ?? 500;
        gems = data.gems ?? 500;
        collection = data.collection ?? {};
        packInventory = data.packInventory ?? [];
        currentPage = data.currentPage ?? 1;
        
        const now = Date.now();
        Object.values(collection).forEach(card => {
            if (!card.lastCollect) card.lastCollect = now;
            updatePendingMoney(card);
        });
    }

    window.resetGame = function() {
        if (!confirm("¿Borrar TODO?")) return;
        localStorage.removeItem("wolfyIncrementalV2");
        location.reload();
    };

    // Inicialización
    startConveyorSystem();
    setInterval(renderSlots, 100); // Animación fluida de apertura
    setInterval(() => { renderUI(); renderBinder(); saveGame(); }, 2000);
    
    loadGame();
    renderAll();
});
