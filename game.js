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

    // --- POOLS DE CARTAS CON WEIGHTS ---
    // Weight: 1 = 0.01%, 100 = 1%, 1000 = 10%, etc.
    
    const classicsPool = [
        { cardKey: "lobito", name: "🐺 Lobito", baseIncome: 2, rarity: "common", weight: 4250, tags: [] },
        { cardKey: "cachorrito", name: "🐶 Cachorrito", baseIncome: 3, rarity: "common", weight: 2750, tags: [] },
        { cardKey: "paletero", name: "🍦 Lobito Paletero", baseIncome: 4, rarity: "rare", weight: 1750, tags: [] },
        { cardKey: "espadachin", name: "⚔️ Lobito Espadachín", baseIncome: 6, rarity: "epic", weight: 900, tags: [] },
        { cardKey: "resortero", name: "🪃 Lobito Resortero", baseIncome: 8, rarity: "legendary", weight: 350, tags: [] }
    ];

    const colorfulPool = [
        { cardKey: "bobina_velocidad", name: "⚡ Lobito Bobina Velocidad", baseIncome: 50, rarity: "rare", weight: 800, tags: [], bgClass: "images/colorful-bg.png" },
        { cardKey: "bobina_gravitacional", name: "🌀 Lobito Bobina Gravitacional", baseIncome: 75, rarity: "epic", weight: 500, tags: [], bgClass: "images/colorful-bg.png" },
        { cardKey: "bobina_regenerativa", name: "💚 Lobito Bobina Regenerativa", baseIncome: 60, rarity: "epic", weight: 500, tags: [], bgClass: "images/colorful-bg.png" },
        { cardKey: "lobito_blue", name: "🔵 Lobito [Blue Team]", baseIncome: 10, rarity: "rare", weight: 700, tags: ["Blue Team"] },
        { cardKey: "paletero_blue", name: "🔵 Paletero [Blue Team]", baseIncome: 15, rarity: "rare", weight: 700, tags: ["Blue Team"] },
        { cardKey: "espadachin_blue", name: "🔵 Espadachín [Blue Team]", baseIncome: 25, rarity: "epic", weight: 400, tags: ["Blue Team"] },
        { cardKey: "resortero_blue", name: "🔵 Resortero [Blue Team]", baseIncome: 35, rarity: "epic", weight: 400, tags: ["Blue Team"] },
        { cardKey: "lobito_red", name: "🔴 Lobito [Red Team]", baseIncome: 10, rarity: "rare", weight: 700, tags: ["Red Team"] },
        { cardKey: "paletero_red", name: "🔴 Paletero [Red Team]", baseIncome: 15, rarity: "rare", weight: 700, tags: ["Red Team"] },
        { cardKey: "espadachin_red", name: "🔴 Espadachín [Red Team]", baseIncome: 25, rarity: "epic", weight: 400, tags: ["Red Team"] },
        { cardKey: "resortero_red", name: "🔴 Resortero [Red Team]", baseIncome: 35, rarity: "epic", weight: 400, tags: ["Red Team"] },
        { cardKey: "cachorrito_colorless", name: "⚪ Cachorrito [Colorless]", baseIncome: 100, rarity: "legendary", weight: 200, tags: ["Colorless"] }
    ];

    const unforgettablePool = [
        { cardKey: "uf_lobito", name: " Lobito", baseIncome: 3, rarity: "common", weight: 1500, tags: ["Unforgettable Fashion"] },
        { cardKey: "uf_boinero", name: "🎩 Lobito Boinero", baseIncome: 4, rarity: "common", weight: 1500, tags: ["Unforgettable Fashion"] },
        { cardKey: "uf_pantalonero", name: " Lobito Pantalonero", baseIncome: 10, rarity: "rare", weight: 800, tags: ["Unforgettable Fashion"] },
        { cardKey: "uf_fresco", name: "🪮 Lobito Fresco", baseIncome: 18, rarity: "rare", weight: 800, tags: ["Unforgettable Fashion"] },
        { cardKey: "uf_marinerito", name: "⚓ Lobito Marinerito", baseIncome: 14, rarity: "rare", weight: 800, tags: ["Unforgettable Fashion"] },
        { cardKey: "uf_timido", name: "😳 Lobito Tímido", baseIncome: 8, rarity: "common", weight: 1500, tags: ["Unforgettable Fashion"] },
        { cardKey: "uf_callejero", name: "🏙️ Lobito Callejero", baseIncome: 12, rarity: "rare", weight: 800, tags: ["Unforgettable Fashion"] },
        { cardKey: "uf_estiloso", name: "💅 Lobito Estiloso", baseIncome: 20, rarity: "epic", weight: 500, tags: ["Unforgettable Fashion"] },
        { cardKey: "uf_curiosa", name: "🔍 Lobita Curiosa", baseIncome: 22, rarity: "common", weight: 1500, tags: ["Unforgettable Fashion"] },
        { cardKey: "uf_softcore", name: " Lobito SoftCore", baseIncome: 35, rarity: "rare", weight: 800, tags: ["Unforgettable Fashion"] },
        { cardKey: "uf_brownie", name: "🍫 Lobito Brownie", baseIncome: 50, rarity: "rare", weight: 800, tags: ["Unforgettable Fashion"] },
        { cardKey: "uf_esponjoso", name: "☁️ Lobito Esponjosito", baseIncome: 30, rarity: "epic", weight: 500, tags: ["Unforgettable Fashion"] },
        { cardKey: "uf_alfa", name: " Lobito Alfa Supremo", baseIncome: 500, rarity: "legendary", weight: 100, tags: ["Unforgettable Fashion"] }
    ];

    const birthdayPool = [
        { cardKey: "felix_v1", name: "🎈 Lobito [Vol.1]", baseIncome: 150, rarity: "rare", weight: 800, tags: ["Felix Birthday"], bgClass: "images/felix-vol1.png" },
        { cardKey: "felix_cach_v1", name: "🎈 Cachorrito [Vol.1]", baseIncome: 225, rarity: "epic", weight: 500, tags: ["Felix Birthday"], bgClass: "images/felix-vol1.png" },
        { cardKey: "felix_v2", name: " Lobito [Vol.2]", baseIncome: 150, rarity: "rare", weight: 800, tags: ["Felix Birthday"], bgClass: "images/felix-vol2" },
        { cardKey: "felix_cach_v2", name: "🎈 Cachorrito [Vol.2]", baseIncome: 225, rarity: "epic", weight: 500, tags: ["Felix Birthday"], bgClass: "images/felix-vol2" },
        { cardKey: "felix_v3", name: "🎈 Lobito [Vol.3]", baseIncome: 150, rarity: "rare", weight: 800, tags: ["Felix Birthday"], bgClass: "bg-felix-vol2" },
        { cardKey: "felix_cach_v3", name: "🎈 Cachorrito [Vol.3]", baseIncome: 225, rarity: "epic", weight: 500, tags: ["Felix Birthday"], bgClass: "images/felix-vol2" },
        { cardKey: "felix_special", name: "🎂 Lobito Felix [20]", baseIncome: 2106, rarity: "legendary", weight: 100, tags: ["Felix Birthday"], bgClass: "images/felix-vol1" }
    ];

    const flowerPool = [
        { cardKey: "flower_lobito", name: "🌷 Lobito [Flower Garden]", baseIncome: 200, rarity: "common", weight: 1200, tags: ["Flower Garden"], bgClass: "images/flower-common.png" },
        { cardKey: "flower_cachorrito", name: "🌿 Cachorrito Nenúfar", baseIncome: 250, rarity: "common", weight: 1200, tags: ["Flower Garden"], bgClass: "images/flower-common.png" },
        { cardKey: "flower_pasto", name: " Lobito Pasto", baseIncome: 220, rarity: "common", weight: 1200, tags: ["Flower Garden"], bgClass: "images/flower-common.png" },
        { cardKey: "flower_jardinero", name: "🌻 Lobito Jardinero", baseIncome: 400, rarity: "rare", weight: 700, tags: ["Flower Garden"], bgClass: "images/flower-rare.png" },
        { cardKey: "flower_girasol", name: "🌼 Cachorrito Girasol", baseIncome: 450, rarity: "rare", weight: 700, tags: ["Flower Garden"], bgClass: "images/flower-rare.png" },
        { cardKey: "flower_sakura_cach", name: "🌸 Cachorrito Flor de Sakura", baseIncome: 700, rarity: "epic", weight: 400, tags: ["Flower Garden"], bgClass: "images/flower-epic.png" },
        { cardKey: "flower_cactus", name: "🌵 Lobito Cactus", baseIncome: 750, rarity: "epic", weight: 400, tags: ["Flower Garden"], bgClass: "images/flower-epic.png" },
        { cardKey: "flower_margarita", name: "🌼 Lobita Margarita", baseIncome: 800, rarity: "epic", weight: 400, tags: ["Flower Garden"], bgClass: "images/flower-epic.png" },
        { cardKey: "flower_primaveral", name: "🌷 Lobito Primaveral", baseIncome: 1500, rarity: "legendary", weight: 150, tags: ["Flower Garden"], bgClass: "images/flower-legendary.png" },
        { cardKey: "flower_sakura", name: "🌸 Lobita Flor de Sakura", baseIncome: 1800, rarity: "legendary", weight: 150, tags: ["Flower Garden"], bgClass: "images/flower-legendary.png" },
        { cardKey: "flower_lirio", name: "🤍 Lobita Lirio Blanco", baseIncome: 2000, rarity: "legendary", weight: 150, tags: ["Flower Garden"], bgClass: "images/flower-legendary.png" }
    ];

    // Pool de evento - Felix Day 2026 (aparece en todos los álbumes al final)
    const felixDay2026Pool = [
        { cardKey: "felix_day_common1", name: "🎉 Lobito Felix Day", baseIncome: 5, rarity: "common", weight: 3000, tags: ["Felix Day 2026"] },
        { cardKey: "felix_day_common2", name: "🎊 Cachorrito Felix Day", baseIncome: 8, rarity: "common", weight: 3000, tags: ["Felix Day 2026"] },
        { cardKey: "felix_day_rare1", name: "🎈 Lobito Festivo", baseIncome: 20, rarity: "rare", weight: 2000, tags: ["Felix Day 2026"] },
        { cardKey: "felix_day_epic1", name: "🎁 Lobito Regalo", baseIncome: 50, rarity: "epic", weight: 1000, tags: ["Felix Day 2026"] },
        { cardKey: "felix_day_legendary", name: "👑 Lobito Felix Day Especial", baseIncome: 100, rarity: "legendary", weight: 500, tags: ["Felix Day 2026"] }
    ];

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

    // Función para calcular el porcentaje de drop basado en weights
    function calculateDropPercentage(card, pool) {
        const totalWeight = pool.reduce((sum, c) => sum + c.weight, 0);
        return ((card.weight / totalWeight) * 100).toFixed(2);
    }

    function rollCardFromPool(pool, packType) {
        if (!pool || pool.length === 0) return classicsPool[0]; // Fallback
        
        // Calcular peso total
        const totalWeight = pool.reduce((sum, card) => sum + card.weight, 0);
        
        // Generar número aleatorio basado en el peso total
        let random = Math.random() * totalWeight;
        
        // Seleccionar carta basada en weights acumulativos
        for (const card of pool) {
            random -= card.weight;
            if (random <= 0) {
                return JSON.parse(JSON.stringify(card));
            }
        }
        
        // Fallback por si acaso
        return JSON.parse(JSON.stringify(pool[0]));
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
        else if (pack.type === "flower") pool = flowerPool;
        else pool = classicsPool;

        // Obtener carta del paquete usando el sistema de weights
        const card = rollCardFromPool(pool, pack.type);
        
        // También hay chance de obtener una carta de Felix Day 2026 (evento)
        const eventRoll = Math.random();
        if (eventRoll < 0.15) { // 15% de chance de obtener carta de evento
            const eventCard = rollCardFromPool(felixDay2026Pool, "felix_day");
            
            // Agregar la carta de evento también
            if (!collection[eventCard.cardKey]) {
                collection[eventCard.cardKey] = {
                    name: eventCard.name, baseIncome: eventCard.baseIncome, level: 1, copies: 0,
                    pendingMoney: 0, lastCollect: Date.now(), rarity: eventCard.rarity,
                    tags: eventCard.tags || [], bgClass: eventCard.bgClass || '',
                    weight: eventCard.weight
                };
            }
            collection[eventCard.cardKey].copies++;
            checkLevelUp(collection[eventCard.cardKey]);
        }
        
        // Agregar la carta principal del paquete
        if (!collection[card.cardKey]) {
            collection[card.cardKey] = {
                name: card.name, baseIncome: card.baseIncome, level: 1, copies: 0,
                pendingMoney: 0, lastCollect: Date.now(), rarity: card.rarity,
                tags: card.tags || [], bgClass: card.bgClass || '',
                weight: card.weight
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
        const totalPages = getTotalPages();
        currentPage = Math.max(1, Math.min(totalPages, currentPage + delta));
        renderBinder();
    };

    // Función para calcular el total de páginas basado en el orden del binder
    function getTotalPages() {
        const orderedCards = getOrderedCollection();
        return Math.max(1, Math.ceil(orderedCards.length / CARDS_PER_PAGE));
    }

    // Función para obtener las cartas ordenadas según el orden del binder
    function getOrderedCollection() {
        const cards = Object.entries(collection).map(([key, card]) => ({
            key,
            ...card
        }));

        // Definir el orden de los paquetes
        const packOrder = [
            'classics',
            'colorful', 
            'unforgettable',
            'flower'
        ];

        // Orden de rarezas (de común a legendario)
        const rarityOrder = ['common', 'rare', 'epic', 'legendary'];

        // Función para determinar a qué paquete pertenece una carta
        function getPackForCard(card) {
            if (card.tags.includes('Felix Day 2026')) return 'felix_day';
            if (card.tags.includes('Unforgettable Fashion')) return 'unforgettable';
            if (card.tags.includes('Flower Garden')) return 'flower';
            if (card.tags.includes('Felix Birthday')) return 'birthday';
            if (card.tags.includes('Blue Team') || card.tags.includes('Red Team') || card.tags.includes('Colorless')) return 'colorful';
            return 'classics';
        }

        // Función para obtener el pool correcto de una carta
        function getPoolForCard(card) {
            const pack = getPackForCard(card);
            switch(pack) {
                case 'classics': return classicsPool;
                case 'colorful': return colorfulPool;
                case 'unforgettable': return unforgettablePool;
                case 'birthday': return birthdayPool;
                case 'flower': return flowerPool;
                case 'felix_day': return felixDay2026Pool;
                default: return classicsPool;
            }
        }

        // Ordenar las cartas
        cards.sort((a, b) => {
            const packA = getPackForCard(a);
            const packB = getPackForCard(b);

            // Las cartas de Felix Day 2026 van al final
            if (packA === 'felix_day' && packB !== 'felix_day') return 1;
            if (packA !== 'felix_day' && packB === 'felix_day') return -1;

            // Si ambas son Felix Day, ordenar por rareza
            if (packA === 'felix_day' && packB === 'felix_day') {
                const rarityDiff = rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
                if (rarityDiff !== 0) return rarityDiff;
                return a.baseIncome - b.baseIncome;
            }

            // Para las demás, ordenar por paquete primero
            const packIndexA = packOrder.indexOf(packA);
            const packIndexB = packOrder.indexOf(packB);
            
            if (packIndexA !== packIndexB) {
                return packIndexA - packIndexB;
            }

            // Dentro del mismo paquete, ordenar por rareza
            const rarityDiff = rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
            if (rarityDiff !== 0) return rarityDiff;

            // Si tienen la misma rareza, ordenar por income
            return a.baseIncome - b.baseIncome;
        });

        return cards;
    }

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
        
        const orderedCards = getOrderedCollection();
        const totalPages = Math.max(1, Math.ceil(orderedCards.length / CARDS_PER_PAGE));
        
        if (currentPage > totalPages) currentPage = totalPages;
        
        document.getElementById("currentPage").innerText = currentPage;
        document.getElementById("totalPages").innerText = totalPages;

        const startIdx = (currentPage - 1) * CARDS_PER_PAGE;
        const pageCards = orderedCards.slice(startIdx, startIdx + CARDS_PER_PAGE);

        pageCards.forEach(cardData => {
            const card = collection[cardData.key];
            updatePendingMoney(card);
            const div = document.createElement("div");
            div.className = `binder-card rarity-${card.rarity}`;
            
            const income = getIncomePerSecond(card);
            const pending = Math.floor(card.pendingMoney);
            
            // Calcular porcentaje de drop
            const pool = getPoolForCard(cardData);
            const dropRate = calculateDropPercentage(cardData, pool);

            div.innerHTML = `
                <div class="card-level">Lv${card.level}</div>
                <div class="card-name">${card.name}</div>
                <div class="card-drop-rate" style="color: #aaa; font-size: 0.75em; margin: 3px 0;">${dropRate}%</div>
                <div class="card-income">💰 $${income}/s</div>
                ${pending > 0 ? `<div class="card-pending" style="color:#00ff88">+$${pending}</div>` : ''}
            `;
            div.onclick = () => collectCardIncome(cardData.key);
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
