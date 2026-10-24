document.addEventListener("DOMContentLoaded", () => {
    let money = 500;
    let gems = 500;
    let collection = {};
    let conveyorItems = []; // Nueva lista para la cinta
    let packInventory = [];
    let activeWolves = [];
    let currentPage = 1;
    const CARDS_PER_PAGE = 9;
    const MAX_OPENING_SLOTS = 10;

    const PACK_TYPES = {
        classics: { price: 100, duration: 5000, name: "The Classics", icon: "📦" },
        colorful: { price: 1200, duration: 30000, name: "Colorful & Powerful", icon: "🌈" },
        unforgettable: { price: 14000, duration: 60000, name: "Unforgettable Fashion", icon: "✨" },
        birthday: { price: 6210, duration: 30000, name: "Happy Birthday Felix", icon: "🎂" },
        flower: { price: 164000, duration: 150000, name: "Flower Garden", icon: "🌸" }
    };

    // ... (Mantén tus pools de cartas aquí: classicsPool, colorfulPool, etc.) ...
    // Para no hacer el código eterno, asumo que ya tienes los arrays de cartas definidos como antes.
    // Si necesitas que te los vuelva a pasar, avísame, pero son los mismos del código anterior.

    const classicsPool = [
        { cardKey: "lobito", name: "🐺 Lobito", baseIncome: 2, rarity: "common", tags: [] },
        { cardKey: "cachorrito", name: "🐶 Cachorrito", baseIncome: 3, rarity: "common", tags: [] },
        { cardKey: "paletero", name: "🍦 Lobito Paletero", baseIncome: 4, rarity: "rare", tags: [] },
        { cardKey: "espadachin", name: "⚔️ Lobito Espadachín", baseIncome: 6, rarity: "epic", tags: [] },
        { cardKey: "resortero", name: "🪃 Lobito Resortero", baseIncome: 8, rarity: "legendary", tags: [] }
    ];
    
    // (Asegúrate de tener el resto de los pools: colorfulPool, unforgettablePool, birthdayPool, flowerPool)
    const colorfulPool = [ /* ... tu contenido anterior ... */ ]; 
    const unforgettablePool = [ /* ... tu contenido anterior ... */ ];
    const birthdayPool = [ /* ... tu contenido anterior ... */ ];
    const flowerPool = [ /* ... tu contenido anterior ... */ ];

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
        const needed = Math.pow(2, card.level + 1) - 1;
        return needed - card.copies;
    }

    function rollCardFromPool(pool, packType) {
        const r = Math.random() * 100;
        let targetRarity;
        // Lógica de probabilidades (la misma que tenías)
        if (packType === "classics") {
            if (r < 2) targetRarity = "legendary";
            else if (r < 12) targetRarity = "epic";
            else if (r < 42) targetRarity = "rare";
            else targetRarity = "common";
        } else if (packType === "colorful") {
            if (r < 3) targetRarity = "legendary";
            else if (r < 35) targetRarity = "epic";
            else targetRarity = "rare";
        } else if (packType === "unforgettable") {
            if (r < 3) targetRarity = "legendary";
            else if (r < 15) targetRarity = "epic";
            else if (r < 50) targetRarity = "rare";
            else targetRarity = "common";
        } else if (packType === "birthday") {
            if (r < 4) targetRarity = "legendary";
            else if (r < 30) targetRarity = "epic";
            else targetRarity = "rare";
        } else if (packType === "flower") {
            if (r < 5) targetRarity = "legendary";
            else if (r < 25) targetRarity = "epic";
            else if (r < 60) targetRarity = "rare";
            else targetRarity = "common";
        }

        const filtered = pool.filter(c => c.rarity === targetRarity);
        const usePool = filtered.length > 0 ? filtered : pool.filter(c => c.rarity === "common");
        return JSON.parse(JSON.stringify(usePool[Math.floor(Math.random() * usePool.length)]));
    }

    window.buyPack = function(packType) {
        const pack = PACK_TYPES[packType];
        if (money < pack.price) {
            alert(`❌ Dinero insuficiente. Necesitas $${pack.price}.`);
            return;
        }
        money -= pack.price;
        
        let pool;
        if (packType === "classics") pool = classicsPool;
        else if (packType === "colorful") pool = colorfulPool;
        else if (packType === "unforgettable") pool = unforgettablePool;
        else if (packType === "birthday") pool = birthdayPool;
        else pool = flowerPool;

        const card = rollCardFromPool(pool, packType);

        // Añadimos a la cinta en lugar de directamente al inventario
        conveyorItems.push({
            id: Date.now() + Math.random(),
            type: packType,
            icon: pack.icon,
            card: card
        });

        renderAll();
        saveGame();
    };

    // Mover de la cinta a los slots de apertura
    window.moveToOpening = function(itemId) {
        const openingCount = packInventory.filter(p => p.status === "opening").length;
        if (openingCount >= MAX_OPENING_SLOTS) {
            alert(`❌ Máximo ${MAX_OPENING_SLOTS} paquetes abriéndose.`);
            return;
        }

        const itemIndex = conveyorItems.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return;

        const item = conveyorItems[itemIndex];
        
        // Añadir al inventario de apertura
        packInventory.push({
            id: item.id,
            type: item.type,
            startedAt: null,
            duration: PACK_TYPES[item.type].duration,
            status: "waiting",
            card: item.card
        });

        // Eliminar de la cinta
        conveyorItems.splice(itemIndex, 1);
        
        // Empezar apertura automáticamente si quieres, o esperar clic en el slot
        startOpening(item.id); 

        renderAll();
        saveGame();
    };

    function startOpening(packId) {
        const pack = packInventory.find(p => p.id === packId);
        if (!pack || pack.status !== "waiting") return;
        pack.status = "opening";
        pack.startedAt = Date.now();
        renderAll();
        saveGame();
    }

    function collectCard(packId) {
        const pack = packInventory.find(p => p.id === packId);
        if (!pack || pack.status !== "ready") return;
        const card = pack.card;

        if (!collection[card.cardKey]) {
            collection[card.cardKey] = {
                name: card.name, baseIncome: card.baseIncome, level: 1, copies: 0,
                pendingMoney: 0, lastCollect: Date.now(), rarity: card.rarity,
                tags: card.tags || [], bgClass: card.bgClass || ''
            };
        }
        collection[card.cardKey].copies++;
        const leveled = checkLevelUp(collection[card.cardKey]);
        
        packInventory = packInventory.filter(p => p.id !== packId);
        
        if (leveled) {
            alert(`🎉 ¡${card.name} subió a LvL.${collection[card.cardKey].level}!`);
        }
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
        const income = getIncomePerSecond(card);
        card.pendingMoney += income * elapsed;
        card.lastCollect = now;
    }

    window.changePage = function(delta) {
        const totalPages = Math.max(1, Math.ceil(Object.keys(collection).length / CARDS_PER_PAGE));
        currentPage = Math.max(1, Math.min(totalPages, currentPage + delta));
        renderBinder();
    };

    function renderConveyor() {
        const belt = document.getElementById("conveyorBelt");
        belt.innerHTML = "";
        if (conveyorItems.length === 0) {
            belt.innerHTML = '<div style="color:#7f8c8d; width:100%; text-align:center;">La cinta está vacía. ¡Compra paquetes!</div>';
            return;
        }
        conveyorItems.forEach(item => {
            const div = document.createElement("div");
            div.className = "belt-item new-package";
            div.innerText = item.icon;
            div.onclick = () => moveToOpening(item.id);
            belt.appendChild(div);
        });
    }

    function renderSlots() {
        const grid = document.getElementById("slotsGrid");
        grid.innerHTML = "";
        const now = Date.now();
        packInventory.forEach(pack => {
            if (pack.status === "opening" && pack.startedAt) {
                const elapsed = now - pack.startedAt;
                if (elapsed >= pack.duration) pack.status = "ready";
            }
        });

        packInventory.forEach(pack => {
            const slot = document.createElement("div");
            slot.className = `slot ${pack.status}`;
            const packInfo = PACK_TYPES[pack.type];
            let content = `<div style="font-size:2rem">${packInfo.icon}</div>`;
            
            if (pack.status === "opening") {
                const elapsed = now - pack.startedAt;
                const progress = Math.min(100, (elapsed / pack.duration) * 100);
                content += `<div class="slot-progress"><div class="slot-progress-fill" style="width:${progress}%"></div></div>`;
            } else if (pack.status === "ready") {
                content += `<div style="color:#00ff88; font-weight:bold">¡LISTO!</div>`;
                slot.onclick = () => collectCard(pack.id);
            } else {
                content += `<div style="font-size:0.8rem">Esperando...</div>`;
            }
            slot.innerHTML = content;
            grid.appendChild(slot);
        });
        document.getElementById("slotsUsed").innerText = packInventory.filter(p => p.status === "opening").length;
    }

    function renderBinder() {
        const grid = document.getElementById("binderGrid");
        grid.innerHTML = "";
        const keys = Object.keys(collection);
        const totalPages = Math.max(1, Math.ceil(keys.length / CARDS_PER_PAGE));
        if (currentPage > totalPages) currentPage = totalPages;
        document.getElementById("currentPage").innerText = currentPage;
        document.getElementById("totalPages").innerText = totalPages;

        if (keys.length === 0) {
            grid.innerHTML = '<div class="empty-msg">Tu colección está vacía.</div>';
            return;
        }

        const startIdx = (currentPage - 1) * CARDS_PER_PAGE;
        const pageKeys = keys.slice(startIdx, startIdx + CARDS_PER_PAGE);

        pageKeys.forEach(cardKey => {
            const card = collection[cardKey];
            updatePendingMoney(card);
            const div = document.createElement("div");
            const bgClass = card.bgClass || '';
            div.className = `binder-card rarity-${card.rarity} ${bgClass}`;
            
            const income = getIncomePerSecond(card);
            const pending = Math.floor(card.pendingMoney);
            const nextLevel = getNextLevelRequirement(card);

            div.innerHTML = `
                <div class="card-level">Lv${card.level}</div>
                <div class="card-name">${card.name}</div>
                <div class="card-income">💰 $${income}/s</div>
                ${pending > 0 ? `<div class="card-pending" style="color:#00ff88">+$${pending}</div>` : ''}
                <div class="card-copies" style="font-size:0.7rem; color:#aaa">Copias: ${card.copies} (Faltan ${nextLevel})</div>
            `;
            div.onclick = () => collectCardIncome(cardKey);
            grid.appendChild(div);
        });
    }

    function renderUI() {
        document.getElementById("money").innerText = Math.floor(money).toLocaleString();
        document.getElementById("gems").innerText = gems;
        
        // Calcular ingreso total
        let totalIncome = 0;
        Object.values(collection).forEach(card => {
            totalIncome += getIncomePerSecond(card);
        });
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
        localStorage.setItem("wolfyCardCollectionV2", JSON.stringify({
            money, gems, collection, conveyorItems, packInventory, activeWolves, currentPage
        }));
    };

    function loadGame() {
        const data = JSON.parse(localStorage.getItem("wolfyCardCollectionV2") || "null");
        if (!data) return;
        money = data.money ?? 500;
        gems = data.gems ?? 500;
        collection = data.collection ?? {};
        conveyorItems = data.conveyorItems ?? [];
        packInventory = data.packInventory ?? [];
        activeWolves = data.activeWolves ?? [];
        currentPage = data.currentPage ?? 1;
        
        const now = Date.now();
        Object.values(collection).forEach(card => {
            if (!card.lastCollect) card.lastCollect = now;
            updatePendingMoney(card);
        });
    }

    window.resetGame = function() {
        if (!confirm("¿Borrar TODO el progreso?")) return;
        localStorage.removeItem("wolfyCardCollectionV2");
        location.reload();
    };

    setInterval(() => {
        renderSlots();
        renderUI();
    }, 1000);

    setInterval(() => {
        renderBinder();
        saveGame();
    }, 2000);

    loadGame();
    renderAll();
});
