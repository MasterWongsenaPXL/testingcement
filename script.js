document.addEventListener("DOMContentLoaded", function () {
    loadCards();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    setInterval(checkTimers, 1000);
    setInterval(autoSave, 2000); // 🔥 เซฟข้อมูลอัตโนมัติทุก 2 วินาที
    sortCards();
    refreshCards()
});

function loadCards() {
    const container = document.getElementById("card-container");
    container.innerHTML = "";

    const storedCards = localStorage.getItem("cards");
    const imageStorage = JSON.parse(localStorage.getItem("imageStorage")) || {};

    if (storedCards) {
        const cards = JSON.parse(storedCards);
        cards.forEach(card => {
            card.image = imageStorage[card.id] || null; // 🔥 โหลดรูปภาพที่บันทึกไว้
            addCardToDOM(card);
        });
    }
}






function saveAllCards() {
    let allCards = [];
    let imageStorage = JSON.parse(localStorage.getItem("imageStorage")) || {};

    document.querySelectorAll(".card").forEach(cardElement => {
        const cardId = parseInt(cardElement.getAttribute("data-id"));
        const title = cardElement.querySelector(".card-title").innerText;
        const time = cardElement.querySelector(".time").innerText;
        const color = cardElement.classList.contains("blue") ? "blue" :
            cardElement.classList.contains("yellow") ? "yellow" : "purple";
        const imageElement = cardElement.querySelector(".card-image");
        const imageSrc = imageElement ? imageElement.src : null;

        if (imageSrc) {
            imageStorage[cardId] = imageSrc; // 🔥 เก็บรูปแยกไว้ใน imageStorage
        }

        allCards.push({
            id: cardId,
            title: title,
            time: time,
            color: color
        });
    });

    localStorage.setItem("cards", JSON.stringify(allCards));
    localStorage.setItem("imageStorage", JSON.stringify(imageStorage)); // 🔥 บันทึกรูปภาพแยกไว้
    alert("บันทึกข้อมูลและรูปภาพทั้งหมดเรียบร้อย!");
}






// เพิ่มการ์ดใหม่
function addNewCard() {
    const currentTime = new Date().toLocaleTimeString("th-TH", { hour12: false });
    const newCard = {
        id: Date.now(),
        tag: "Tag " + (Math.floor(Math.random() * 5) + 1),
        title: "แก้ไขชื่อ",
        time: currentTime,
        color: getRandomColor(),
        image: null
    };
    sortCards();
    addCardToDOM(newCard);
    saveCard(newCard);
    refreshCards()
}

function saveCard(card) {
    let cards = JSON.parse(localStorage.getItem("cards")) || [];
    cards.push({
        ...card,
        image: card.image || null // 🔥 เพิ่มตรงนี้เพื่อให้แน่ใจว่ารูปถูกบันทึก
    });

    localStorage.setItem("cards", JSON.stringify(cards));
}




function addCardToDOM(card) {
    const container = document.getElementById("card-container");

    const cardElement = document.createElement("div");
    cardElement.classList.add("card", card.color);
    cardElement.setAttribute("data-id", card.id);
    cardElement.style.position = "relative"; // ทำให้ปุ่มลบอิงตามการ์ด

    let imageHTML = card.image
        ? `<img src="${card.image}" class="card-image">
           <button class="remove-image-btn" onclick="removeImage(${card.id})">ลบรูป</button>`
        : `<button class="add-image-btn" onclick="enablePasteImage(${card.id})">วางรูปจอ</button>`;

    cardElement.innerHTML = `
        <div class="card-header" style="display: flex; align-items: center; justify-content: space-between; position: relative;">
            <span class="queue-number">#${card.queueNumber}</span> <!-- ✅ ลำดับคิว -->
            <span class="card-title" id="title-${card.id}" onclick="editTitle(${card.id})">${card.title}</span>
            <span class="close-btn" onclick="removeCard(${card.id})" 
                  style="position: absolute; right: -70px; top: -5px; cursor: pointer; font-size: 18px; color: red;">
                  ✖
            </span>
        </div>
        <div class="image-container" id="image-container-${card.id}">
            ${imageHTML}
        </div>
        <div class="time" id="time-${card.id}" onclick="editTime(${card.id})">${card.time}</div>
        <div class="alert" id="alert-${card.id}" style="display: none;">หมดเวลา!</div>
        <div class="actions">
            <button class="start-btn" onclick="startTimer(${card.id})"
            style="margin: 20px;">+20 นาที</button>
            <button class="add-time-btn" onclick="addFiveMinutes(${card.id})"            
            style="margin: 20px;">+5 นาที</button>
        </div>
    `;

    container.appendChild(cardElement);
}


// ✅ ฟังก์ชันแก้ไขเวลา
function editTime(cardId) {
    const timeElement = document.getElementById(`time-${cardId}`);
    const currentTime = timeElement.innerText;

    // ✅ แปลงเวลาจาก HH:mm:ss ให้เหลือแค่ HH:mm (24 ชม.)
    const [hours, minutes] = currentTime.split(":");
    const formattedTime = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;

    // ✅ สร้าง input type="time" เพื่อแก้ไขเวลา (24 ชม.)
    const inputElement = document.createElement("input");
    inputElement.type = "time";
    inputElement.value = formattedTime;
    inputElement.classList.add("time-input");

    // ✅ เมื่อกด Enter หรือคลิกที่อื่น ให้บันทึกเวลาใหม่
    inputElement.addEventListener("blur", function () {
        updateCardTime(cardId, inputElement.value);
    });

    inputElement.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            updateCardTime(cardId, inputElement.value);
            inputElement.blur();
        }
    });

    // ✅ แทนที่ข้อความเดิมด้วย input
    timeElement.replaceWith(inputElement);
    inputElement.focus();
}



function editTitle(cardId) {
    const titleElement = document.getElementById(`title-${cardId}`);
    const currentTitle = titleElement.innerText;

    // สร้าง input เพื่อให้ผู้ใช้พิมพ์ชื่อใหม่
    const inputElement = document.createElement("input");
    inputElement.type = "text";
    inputElement.value = currentTitle;
    inputElement.classList.add("title-input");

    // เมื่อกด Enter หรือคลิกที่อื่น ให้บันทึกชื่อใหม่
    inputElement.addEventListener("blur", function () {
        updateCardTitle(cardId, inputElement.value);
    });

    inputElement.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            updateCardTitle(cardId, inputElement.value);
            inputElement.blur();
        }
    });

    // แทนที่ข้อความเดิมด้วย input
    titleElement.replaceWith(inputElement);
    inputElement.focus();
    sortCards();
    refreshCards()
}

function updateCardTitle(cardId, newTitle) {
    let cards = JSON.parse(localStorage.getItem("cards")) || [];
    cards = cards.map(card => {
        if (card.id === cardId) {
            card.title = newTitle;
        }
        return card;
    });

    localStorage.setItem("cards", JSON.stringify(cards));

    // สร้าง `<span>` ใหม่แทน `<input>`
    const titleElement = document.createElement("span");
    titleElement.classList.add("card-title");
    titleElement.id = `title-${cardId}`;
    titleElement.innerText = newTitle;
    titleElement.setAttribute("onclick", `editTitle(${cardId})`);

    const inputElement = document.querySelector(`.title-input`);
    if (inputElement) {
        inputElement.replaceWith(titleElement);
    }

    sortCards();
    refreshCards()
}

// ✅ คิวแจ้งเตือน (Array)
let toastQueue = [];
let isToastShowing = false;

// ✅ ฟังก์ชันแสดง Toast ทีละอัน (เรียงคิว)
function showToast(message, type = "success") {
    toastQueue.push({ message, type });

    // 🔥 ถ้ายังไม่มีแจ้งเตือนกำลังแสดง => แสดงอันแรก
    if (!isToastShowing) {
        processToastQueue();
    }
}

// ✅ ฟังก์ชันดึงแจ้งเตือนจากคิวและแสดงผล
function processToastQueue() {
    if (toastQueue.length === 0) {
        isToastShowing = false;
        return;
    }

    isToastShowing = true;
    const { message, type } = toastQueue.shift(); // ดึงอันแรกออกจากคิว

    const toast = document.createElement("div");
    toast.classList.add("toast", type);
    toast.innerText = message;
    document.body.appendChild(toast);

    // ✅ ตั้งเวลาให้หายไปเองใน 2 วินาที
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => {
            toast.remove();
            processToastQueue(); // ✅ แสดงแจ้งเตือนถัดไปจากคิว
        }, 500);
    }, 2000);
}



// ✅ ฟังก์ชันเพิ่มรูปภาพ และตรวจสอบขนาด
function enablePasteImage(cardId) {
    navigator.clipboard.read().then(items => {
        for (let item of items) {
            for (let type of item.types) {
                if (type.startsWith("image/")) {
                    item.getType(type).then(blob => {
                        let fileSizeKB = (blob.size / 1024).toFixed(2); // 🔥 ขนาดไฟล์จริง (KB)
                        let maxSizeKB = 500; // 🔥 ขนาดสูงสุดที่อนุญาต

                        if (blob.size > maxSizeKB * 1024) {
                            let excessSize = (fileSizeKB - maxSizeKB).toFixed(2);
                            showToast(`⚠️ ไฟล์ใหญ่เกินไป! (${fileSizeKB}KB, เกินมา: ${excessSize}KB) กำลังลดขนาดอัตโนมัติ...`);
                            resizeImage(blob, cardId); // ✅ บีบอัดอัตโนมัติ
                        } else {
                            processImage(blob, cardId);
                        }
                    }).catch(err => {
                        showToast("❌ ไม่สามารถอ่านไฟล์รูปภาพ!", "error");
                    });
                    return;
                }
            }
        }
    }).catch(err => {
        showToast("❌ ไม่พบรูปในคลิปบอร์ด!", "error");
    });
}


// ✅ ฟังก์ชันบีบอัดภาพอัตโนมัติ
function resizeImage(imageBlob, cardId) {
    const reader = new FileReader();
    reader.readAsDataURL(imageBlob);
    reader.onload = function (event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function () {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const maxSize = 256; // 🔥 ลดขนาดให้เหลือ 256x256px

            if (width > height) {
                if (width > maxSize) {
                    height *= maxSize / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width *= maxSize / height;
                    height = maxSize;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            // 🔥 แปลงเป็น WebP ที่คุณภาพ 50% เพื่อลดขนาด
            canvas.toBlob((blob) => {
                let newSizeKB = (blob.size / 1024).toFixed(2);
                showToast(`✅ ลดขนาดรูปเหลือ ${newSizeKB}KB เรียบร้อย!`, "success"); // ✅ ใช้ Toast แบบ Queue
                processImage(blob, cardId);
            }, "image/webp", 0.5);
        };
    };
}


// ✅ ฟังก์ชันบันทึกภาพใน localStorage
function processImage(blob, cardId) {
    let reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = function (e) {
        let base64Image = e.target.result;

        try {
            let imageStorage = JSON.parse(localStorage.getItem("imageStorage")) || {};
            imageStorage[cardId] = base64Image;
            localStorage.setItem("imageStorage", JSON.stringify(imageStorage));

            let imageContainer = document.getElementById(`image-container-${cardId}`);
            imageContainer.innerHTML = `
                <img src="${base64Image}" class="card-image">
                <button class="remove-image-btn" onclick="removeImage(${cardId})">ลบรูป</button>`;

            console.log(`✅ รูปถูกบันทึกสำเร็จ (${(base64Image.length / 1024).toFixed(2)} KB)`);
        } catch (error) {
            alert("❌ ไม่สามารถบันทึกรูปภาพได้! พื้นที่เก็บข้อมูลเต็ม!");
            console.error("❌ เกิดข้อผิดพลาดขณะเซฟรูป:", error);
        }
    };
}







// ลบรูปภาพ
function removeImage(cardId) {
    let imageStorage = JSON.parse(localStorage.getItem("imageStorage")) || {};
    delete imageStorage[cardId];
    localStorage.setItem("imageStorage", JSON.stringify(imageStorage));

    let imageContainer = document.getElementById(`image-container-${cardId}`);
    imageContainer.innerHTML = `<button class="add-image-btn" onclick="enablePasteImage(${cardId})">วางรูปจอ</button>`;
}




// เซฟอัตโนมัติทุก 2 วินาที
function autoSave() {
    let allCards = [];
    let imageStorage = JSON.parse(localStorage.getItem("imageStorage")) || {};

    document.querySelectorAll(".card").forEach(cardElement => {
        const cardId = parseInt(cardElement.getAttribute("data-id"));
        const title = cardElement.querySelector(".card-title").innerText;
        const time = cardElement.querySelector(".time").innerText;
        const color = cardElement.classList.contains("blue") ? "blue" :
            cardElement.classList.contains("yellow") ? "yellow" : "purple";
        const imageElement = cardElement.querySelector(".card-image");
        const imageSrc = imageElement ? imageElement.src : null;

        if (imageSrc) {
            imageStorage[cardId] = imageSrc;
        }

        allCards.push({
            id: cardId,
            title: title,
            time: time,
            color: color
        });
    });

    localStorage.setItem("cards", JSON.stringify(allCards));
    localStorage.setItem("imageStorage", JSON.stringify(imageStorage));
}



// ✅ ฟังก์ชันบันทึกเวลาใหม่
function updateCardTime(cardId, newTime) {
    let cards = JSON.parse(localStorage.getItem("cards")) || [];

    // ✅ แปลงเวลาเป็นรูปแบบ 24 ชั่วโมง HH:mm:ss
    const now = new Date();
    const [hours, minutes] = newTime.split(":");
    now.setHours(parseInt(hours), parseInt(minutes), 0);
    const formattedTime = now.toLocaleTimeString("th-TH", { hour12: false });

    // ✅ อัปเดตเวลาในการ์ด
    cards = cards.map(card => {
        if (card.id === cardId) {
            return { ...card, time: formattedTime };
        }
        return card;
    });

    localStorage.setItem("cards", JSON.stringify(cards));

    // ✅ อัปเดต UI ให้กลับเป็นปกติ
    const timeElement = document.createElement("span");
    timeElement.classList.add("time");
    timeElement.id = `time-${cardId}`;
    timeElement.innerText = formattedTime;
    timeElement.setAttribute("onclick", `editTime(${cardId})`);

    const inputElement = document.querySelector(`.time-input`);
    if (inputElement) {
        inputElement.replaceWith(timeElement);
    }

    sortCards();
}



function startTimer(cardId) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 20);
    const newTime = now.toLocaleTimeString("th-TH", { hour12: false });

    document.getElementById(`time-${cardId}`).innerText = newTime;
    updateCardTime(cardId, newTime);

    sortCards();

    // 🔥 Refresh หน้าใหม่หลังจากบันทึกเสร็จ
    setTimeout(() => {
        location.reload();
    }, 500);
}


function addFiveMinutes(cardId) {
    const timeElement = document.getElementById(`time-${cardId}`);
    if (!timeElement) return;

    const currentTime = timeElement.innerText;
    const now = new Date();
    const [hours, minutes, seconds] = currentTime.split(":").map(Number);

    now.setHours(hours);
    now.setMinutes(minutes + 5);
    now.setSeconds(seconds);

    const newTime = now.toLocaleTimeString("th-TH", { hour12: false });

    timeElement.innerText = newTime;
    updateCardTime(cardId, newTime);
    sortCards();

    // 🔥 Refresh หน้าใหม่หลังจากบันทึกเสร็จ
    setTimeout(() => {
        location.reload();
    }, 500);
}

// ✅ ฟังก์ชันล้างข้อมูลทั้งหมด
function clearAllData() {
    if (confirm("⚠️ คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลทั้งหมด?")) {
        localStorage.removeItem("cards"); // ล้างข้อมูลการ์ด
        localStorage.removeItem("imageStorage"); // ล้างข้อมูลรูปภาพ
        document.getElementById("card-container").innerHTML = ""; // ลบการ์ดทั้งหมดออกจาก DOM
        alert("✅ ล้างข้อมูลทั้งหมดสำเร็จ!");
        console.log("🗑 ข้อมูลทั้งหมดถูกลบออกจากระบบแล้ว!");
    }
}

// ✅ เพิ่มปุ่ม "ล้างข้อมูลทั้งหมด" ให้เรียกใช้ clearAllData()
document.getElementById("clear-all-btn").addEventListener("click", clearAllData);


// ✅ ฟังก์ชันตรวจสอบเวลา และแจ้งเตือน
function checkTimers() {
    let cards = JSON.parse(localStorage.getItem("cards")) || [];
    const now = new Date();

    cards.forEach(card => {
        const cardTime = new Date();
        const [hours, minutes, seconds] = card.time.split(":").map(Number);
        cardTime.setHours(hours);
        cardTime.setMinutes(minutes);
        cardTime.setSeconds(seconds);

        const timeDiff = Math.floor((cardTime - now) / 1000); // คำนวณเวลาที่เหลือเป็นวินาที
        const alertElement = document.getElementById(`alert-${card.id}`);
        const timeElement = document.getElementById(`time-${card.id}`);

        if (timeDiff <= 0) {
            // 🔥 หมดเวลา
            const overTime = Math.abs(timeDiff); // เวลาที่ล่าช้า
            const overMinutes = Math.floor(overTime / 60);
            const overSeconds = overTime % 60;

            alertElement.innerText = `⏰(เลยไปแล้ว ${overMinutes}:${overSeconds})`;
            alertElement.style.display = "block";
            alertElement.style.color = "red";
            timeElement.style.color = "gray";
        } else if (timeDiff <= 120) { // 🔥 แจ้งเตือนก่อนหมดเวลา 2 นาที
            const remainingMinutes = Math.floor(timeDiff / 60);
            const remainingSeconds = timeDiff % 60;

            alertElement.innerText = `⏳ ${remainingMinutes}:${remainingSeconds}`;
            alertElement.style.display = "block";
            alertElement.style.color = "orange";
            timeElement.style.color = "red";
        } else {
            // ✅ ซ่อนแจ้งเตือนหากยังไม่ถึงเวลา
            alertElement.style.display = "none";
            timeElement.style.color = "";
        }
    });
}

// ✅ เรียกฟังก์ชันนี้ทุกวินาทีเพื่ออัปเดตเวลา
setInterval(checkTimers, 1000);


function sortCards() {
    let cards = JSON.parse(localStorage.getItem("cards")) || [];

    // ✅ เรียงลำดับการ์ดตามเวลา (เวลาน้อยสุดอยู่ข้างหน้า)
    cards.sort((a, b) => {
        let timeA = new Date(`2000-01-01T${a.time}`);
        let timeB = new Date(`2000-01-01T${b.time}`);
        return timeA - timeB;
    });

    cards.forEach((card, index) => {
        card.queueNumber = index + 1; // เริ่มต้นที่ 1
    });

    // ✅ อัปเดตข้อมูลที่เรียงลำดับแล้วลง LocalStorage
    localStorage.setItem("cards", JSON.stringify(cards));

    // ✅ ล้างการ์ดเก่าก่อนโหลดใหม่
    document.getElementById("card-container").innerHTML = "";
    cards.forEach(card => addCardToDOM(card));
}






function removeCard(cardId) {
    // ✅ ลบการ์ดจาก DOM
    document.querySelector(`.card[data-id="${cardId}"]`).remove();

    // ✅ ดึงข้อมูลที่เก็บไว้จาก localStorage
    let cards = JSON.parse(localStorage.getItem("cards")) || [];
    let imageStorage = JSON.parse(localStorage.getItem("imageStorage")) || {};

    // ✅ ลบการ์ดออกจากอาร์เรย์
    cards = cards.filter(card => card.id !== cardId);

    // ✅ ลบรูปภาพออกจาก localStorage
    if (imageStorage[cardId]) {
        delete imageStorage[cardId];
    }

    // ✅ อัปเดตข้อมูลกลับไปยัง localStorage
    localStorage.setItem("cards", JSON.stringify(cards));
    localStorage.setItem("imageStorage", JSON.stringify(imageStorage));

    console.log(`🗑 การ์ด ${cardId} ถูกลบออกจากระบบแล้ว`);
}


function refreshCards() {
    document.getElementById("card-container").innerHTML = ""; // ล้างก่อนโหลดใหม่
    loadCards();
}



// แสดงเวลาปัจจุบัน
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString("th-TH", { hour12: false });
    document.getElementById("current-time").innerText = timeString + " น.";
}

// ฟังก์ชันสุ่มสีการ์ด
function getRandomColor() {
    const colors = ["blue", "yellow", "purple"];
    return colors[Math.floor(Math.random() * colors.length)];
}