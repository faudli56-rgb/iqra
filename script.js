// ==========================================
// المحرك الأساسي للتواصل مع جوجل
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbxMog8gTa9QaTUX_36_RapCB4G0H4lyDTnr_n7X6BA76WDXp0343rfTnGA1yZ-uD8mzYg/exec";

// اختبار بسيط للتأكد من الربط عند فتح الموقع
async function testConnection() {
    try {
        const response = await fetch(API_URL + "?action=getCourses");
        const data = await response.json();
        console.log("نجح الربط! البيانات المستلمة:", data);
    } catch (e) {
        console.error("فشل الربط! تأكد من الرابط أو إعدادات النشر:", e);
    }
}
testConnection();
// ==========================================
// المتغيرات العالمية والتهيئة
// ==========================================
var globalCourses = [];
var globalAds = [
    { title: "سجل الآن في دبلوم إدارة الأعمال", type: "إعلان رئيسي", date: "ينتهي في 2026-12-31", img: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800", link: "#" },
    { title: "خصم 50% على دورات الذكاء الاصطناعي", type: "إعلان عاجل", date: "ينتهي في 2026-08-01", img: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800", link: "#" },
    { title: "الدفعة الجديدة للغة الإنجليزية", type: "إعلان عادي", date: "مستمر", img: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800", link: "#" }
];
var currentAdIndex = 0;

var totalViews = 1482;
var totalClicks = 342;
try {
    if(localStorage.getItem('site_views')) totalViews = parseInt(localStorage.getItem('site_views'), 10);
    if(localStorage.getItem('wa_clicks')) totalClicks = parseInt(localStorage.getItem('wa_clicks'), 10);
} catch(e) {}

function initializeWebsiteLayout() {
    try { totalViews += 1; localStorage.setItem('site_views', totalViews); } catch(e) {}
    loadCoursesFromServer();
    loadNewsFromServer();
    loadTestimonialsFromServer();
    renderAdsSlider();
    setTimeout(function() { document.getElementById('welcome-popup').classList.remove('hidden'); }, 1200);
    setInterval(function() { moveAdSlide(1); }, 5000);
}

// ==========================================
// دوال الواجهة والتنقل
// ==========================================
function toggleMobileMenu() {
    var menu = document.getElementById('mobile-menu');
    var icon = document.getElementById('menu-toggle-icon');
    if (menu.classList.contains('hidden')) { menu.classList.remove('hidden'); icon.innerHTML = "&#10006;"; }
    else { menu.classList.add('hidden'); icon.innerHTML = "&#9776;"; }
}

function closePopup() { document.getElementById('welcome-popup').classList.add('hidden'); }
function popupActionRegister() { closePopup(); navigateTo('register'); }

function navigateTo(pageId) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('header nav a').forEach(b => b.classList.remove('nav-active'));
    if(document.getElementById('page-' + pageId)) document.getElementById('page-' + pageId).classList.add('active');
    if(document.getElementById('btn-' + pageId)) document.getElementById('btn-' + pageId).classList.add('nav-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function trackButtonClick(buttonName) {
    if(buttonName === 'WhatsApp_Float') { try { totalClicks += 1; localStorage.setItem('wa_clicks', totalClicks); } catch(e) {} }
}

// ==========================================
// الإعلانات والسلايدر
// ==========================================
function renderAdsSlider() {
    var container = document.getElementById('ads-slider-container');
    var dots = document.getElementById('ads-dots-container');
    if(!container) return;
    container.innerHTML = ''; dots.innerHTML = '';
    
    globalAds.forEach(function(ad, idx) {
        let badgeClass = ad.type === "إعلان عاجل" ? "bg-rose-600" : (ad.type === "إعلان رئيسي" ? "bg-[#D4A017]" : "bg-blue-600");
        container.innerHTML += `
        <div class="slide bg-slate-900 cursor-pointer" onclick="navigateTo('register')">
            <img src="${ad.img}" class="w-full h-full object-cover opacity-60">
            <div class="absolute inset-0 flex flex-col justify-end p-8 text-white text-right bg-gradient-to-t from-black/80 to-transparent">
                <span class="${badgeClass} text-[10px] font-bold px-3 py-1 rounded-full w-max mb-3 shadow">${ad.type}</span>
                <h3 class="text-3xl font-black mb-2">${ad.title}</h3>
                <p class="text-xs text-slate-300 font-bold mb-4"><i class="fas fa-clock"></i> ${ad.date}</p>
            </div>
        </div>`;
        dots.innerHTML += `<div onclick="setAdSlide(${idx})" class="dot transition ${idx===0?'active':''}"></div>`;
    });
}

function moveAdSlide(dir) {
    currentAdIndex = (currentAdIndex + dir + globalAds.length) % globalAds.length;
    setAdSlide(currentAdIndex);
}

function setAdSlide(idx) {
    currentAdIndex = idx;
    var slider = document.getElementById('ads-slider-container');
    if(slider) slider.style.transform = "translateX(-" + (idx * 100) + "%)"; // تم تصحيح الإزاحة
    document.querySelectorAll('.dot').forEach(function(d, i) {
        if (i === idx) d.classList.add('active'); else d.classList.remove('active');
    });
}

// ==========================================
// جلب وعرض الدورات والأخبار (Vercel API)
// ==========================================
async function loadCoursesFromServer() {
    const courses = await callGoogleAPI('fetchCoursesFromSheet');
    if(courses && !courses.error) {
        globalCourses = courses;
        renderCourses(courses);
        updateRegistrationDropdown(courses);
    }
}

async function loadNewsFromServer() {
    const news = await callGoogleAPI('fetchNewsFromSheet');
    if(news && !news.error) renderNews(news);
}

async function loadTestimonialsFromServer() {
    const data = await callGoogleAPI('fetchTestimonialsFromSheet');
    if(data && !data.error) {
        renderTestimonialsHome(data);
        renderTestimonialsAdmin(data);
    }
}

// ==========================================
// دوال رسم وتصفية البيانات (HTML)
// ==========================================
function renderCourses(courses) {
    var fullContainer = document.getElementById('courses-list-container');
    var homeFeaturedContainer = document.getElementById('home-featured-courses');
    var adminCoursesList = document.getElementById('admin-courses-list');
    
    if(fullContainer) fullContainer.innerHTML = '';
    if(homeFeaturedContainer) homeFeaturedContainer.innerHTML = '';
    if(adminCoursesList) adminCoursesList.innerHTML = '';
    
    courses.forEach(function(c, index) {
        var cardMarkup = `
        <div class="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden flex flex-col justify-between text-right transition hover:shadow-xl" data-category="${c.category}">
            <img class="h-44 w-full object-cover" src="${c.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600'}" loading="lazy">
            <div class="p-5 flex-1 flex flex-col justify-between">
                <div class="mb-4">
                    <span class="bg-slate-100 text-[#0B1F4D] text-[10px] font-bold px-2.5 py-1 rounded-md border border-slate-200">${c.category}</span>
                    <h3 class="font-bold text-md text-[#0B1F4D] mt-3">${c.title}</h3>
                    <p class="text-xs text-slate-500 mt-1.5"><i class="fas fa-chalkboard-teacher ml-1.5 text-[#D4A017]"></i> المدرب: ${c.trainer}</p>
                    <p class="text-xs text-slate-400 mt-0.5"><i class="fas fa-clock ml-1.5 text-slate-400"></i> المدة: ${c.duration || '36 ساعة تدريبية'}</p>
                </div>
                <div class="flex justify-between items-center pt-4 border-t border-slate-50">
                    <span class="text-amber-600 font-extrabold text-sm">${c.fee}</span>
                    <div class="flex gap-2">
                        <button onclick="openLandingPage('${c.title}')" class="bg-slate-100 hover:bg-slate-200 text-[#0B1F4D] text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 transition cursor-pointer">التفاصيل</button>
                        <button onclick="selectCourseDirectly('${c.title}')" class="bg-[#0B1F4D] hover:bg-[#132F6B] text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md transition cursor-pointer">سجل الآن</button>
                    </div>
                </div>
            </div>
        </div>`;
        
        if(fullContainer) fullContainer.insertAdjacentHTML('beforeend', cardMarkup);
        if(homeFeaturedContainer && index < 3) homeFeaturedContainer.insertAdjacentHTML('beforeend', cardMarkup);

        if(adminCoursesList) {
            adminCoursesList.insertAdjacentHTML('beforeend', `
            <div class="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                <span class="font-bold text-[#0B1F4D] truncate w-1/3">${c.title}</span>
                <div class="flex gap-1">
                    <button onclick="openDetailsModal('${c.title}', event)" class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded shadow-sm transition">التفاصيل</button>
                    <button onclick="openEditCourseModal('${c.id}', '${c.title}', '${c.trainer}', '${c.duration}', '${c.fee}', '${c.category}')" class="bg-emerald-600 text-white px-2 py-1 rounded shadow-sm">تعديل</button>
                    <button onclick="deleteCourse('${c.id}')" class="bg-rose-500 text-white px-2 py-1 rounded shadow-sm">حذف</button>
                </div>
            </div>`);
        }
    });
}

function filterCourses(category) {
    document.querySelectorAll('#courses-list-container > div').forEach(function(card) {
        card.style.display = (category === 'all' || card.getAttribute('data-category') === category) ? 'flex' : 'none';
    });
}

function updateRegistrationDropdown(courses) {
    var selectBox = document.getElementById('reg-course');
    if(!selectBox) return;
    selectBox.innerHTML = '<option value="">-- انقر هنا لتحديد المسار التدريبي --</option>';
    courses.forEach(function(c) { selectBox.insertAdjacentHTML('beforeend', `<option value="${c.title}">${c.title}</option>`); });
}

function selectCourseDirectly(courseTitle) {
    document.getElementById('reg-course').value = courseTitle;
    showSelectedCourseDetails();
    navigateTo('register');
}

function showSelectedCourseDetails() {
    var selectedTitle = document.getElementById('reg-course').value;
    var course = null;
    for(var i=0; i<globalCourses.length; i++) {
        if(globalCourses[i].title === selectedTitle) { course = globalCourses[i]; break; }
    }
    var display = document.getElementById('course-dynamic-info');
    if(!display) return;
    
    if (course) {
        display.innerHTML = `
            <div class="flex items-center gap-2"><i class="fas fa-info-circle text-blue-500"></i> تفاصيل المسار المختار:</div>
            <ul class="list-disc list-inside font-bold mr-2 text-blue-900 mt-1 space-y-1">
                <li>المدة: ${course.duration || 'مفتوحة'}</li>
                <li>الرسوم: ${course.fee || 'مجاناً'}</li>
                <li>موعد البدء: قريباً (سيتم الإبلاغ عبر الواتساب)</li>
            </ul>`;
        display.classList.remove('hidden');
    } else {
        display.classList.add('hidden');
    }
}

function renderNews(news) {
    var container = document.getElementById('news-list-container');
    var adminNewsList = document.getElementById('admin-news-list');
    
    if(container) {
        container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
        container.innerHTML = '';
    }
    if(adminNewsList) adminNewsList.innerHTML = '';
    
    news.forEach(function(n) {
        let shareTxt = encodeURIComponent(n.title + " - شاهد التفاصيل عبر موقع أكاديمية اقرأ");
        let imgHtml = n.image ? `<img src="${n.image}" class="w-full h-40 object-cover rounded-xl mb-3" loading="lazy">` : '';
        
        if(container) {
            container.insertAdjacentHTML('beforeend', `
            <div class="bg-white p-5 rounded-2xl shadow border border-slate-100 text-right hover:shadow-lg transition cursor-pointer flex flex-col justify-between" onclick="window.open('https://whatsapp.com/channel/0029VbCDK6M4IBhBR3jvVY0Y', '_blank')">
                <div>
                    ${imgHtml}
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full"><i class="fas fa-calendar-alt"></i> ${n.date}</span>
                        <a href="https://wa.me/?text=${shareTxt}" target="_blank" onclick="event.stopPropagation()" class="text-emerald-500 hover:text-emerald-700 text-lg transition"><i class="fab fa-whatsapp"></i></a>
                    </div>
                    <h3 class="text-md font-bold text-[#0B1F4D] mb-2">${n.title}</h3>
                    <p class="text-slate-600 text-xs leading-relaxed line-clamp-2">${n.details}</p>
                </div>
            </div>`);
        }

        if(adminNewsList) {
            adminNewsList.insertAdjacentHTML('beforeend', `
            <div class="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs hover:bg-slate-100 transition">
                <span class="font-bold text-[#0B1F4D] truncate w-2/3">${n.title}</span>
                <button onclick="deleteNews('${n.id}')" class="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg shadow-sm transition"><i class="fas fa-trash-alt"></i></button>
            </div>`);
        }
    });
}

function searchNews() {
    var term = document.getElementById('news-search').value.toLowerCase();
    var cards = document.querySelectorAll('#news-list-container > div');
    cards.forEach(function(card) {
        var txt = card.innerText.toLowerCase();
        card.style.display = txt.includes(term) ? 'flex' : 'none';
    });
}

// ==========================================
// التسجيل والتواصل وفحص الشهادات (Vercel API)
// ==========================================
async function handleNewRegistration(e) {
    e.preventDefault();
    var submitBtn = document.getElementById('submit-btn');
    if(!submitBtn) return;
    var originalText = submitBtn.innerText;
    submitBtn.disabled = true;
    submitBtn.innerText = 'جاري التسجيل والربط...';
    submitBtn.classList.add('opacity-70', 'cursor-not-allowed');

    var studentData = {
        nameAr: document.getElementById('reg-name-ar') ? document.getElementById('reg-name-ar').value : '',
        nameEn: document.getElementById('reg-name-en') ? document.getElementById('reg-name-en').value : '',
        whatsapp: document.getElementById('reg-whatsapp') ? document.getElementById('reg-whatsapp').value : '',
        nationality: document.getElementById('reg-nationality') ? document.getElementById('reg-nationality').value : '',
        residence: document.getElementById('reg-residence') ? document.getElementById('reg-residence').value : 'أصلي',
        governorate: document.getElementById('reg-governorate') ? document.getElementById('reg-governorate').value : '',
        course: document.getElementById('reg-course') ? document.getElementById('reg-course').value : '',
        gender: document.getElementById('reg-gender') ? document.getElementById('reg-gender').value : '',
        degree: document.getElementById('reg-degree') ? document.getElementById('reg-degree').value : '',
        platform: document.getElementById('reg-platform') ? document.getElementById('reg-platform').value : '',
        marketerCode: localStorage.getItem('marketerRef') || ''
    };

    const res = await callGoogleAPI('registerTraineeFinal', [studentData]);
    
    if(res && res.success) {
        var formChildren = document.getElementById('registration-form').children;
        for (var i = 0; i < formChildren.length; i++) {
            if (formChildren[i].id !== 'successMessage') { formChildren[i].style.display = 'none'; }
        }
        
        var successDiv = document.getElementById('successMessage');
        if(successDiv) {
            successDiv.classList.remove('hidden');
            successDiv.style.display = 'block';
            if(document.getElementById('displayOrderID')) {
                document.getElementById('displayOrderID').innerText = res.orderID;
            }
        }
        setTimeout(function() { window.open("https://whatsapp.com/channel/0029VbCDK6M4IBhBR3jvVY0Y", "_blank"); }, 3000);
    } else {
        alert("❌ خطأ أثناء التسجيل: " + (res ? res.error : "غير معروف"));
        submitBtn.disabled = false; submitBtn.innerText = originalText; submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
}

function handleContactSubmit(e) {
    e.preventDefault();
    var btn = document.getElementById('contact-submit-btn');
    var msgObj = {
        name: document.getElementById('contact-name').value,
        type: document.getElementById('contact-type').value,
        method: document.getElementById('contact-method').value,
        text: document.getElementById('contact-msg').value
    };
    
    if(msgObj.method === 'whatsapp') {
        var waText = encodeURIComponent("مرحباً إدارة أكاديمية اقرأ،\nالاسم: " + msgObj.name + "\nالنوع: " + msgObj.type + "\nالرسالة: " + msgObj.text);
        window.open('https://wa.me/967777644293?text=' + waText, '_blank');
    } else if (msgObj.method === 'email') {
        var mailText = encodeURIComponent("الاسم: " + msgObj.name + "\nالرسالة: " + msgObj.text);
        window.open('mailto:aqraakadymyt51@gmail.com?subject=' + encodeURIComponent(msgObj.type) + '&body=' + mailText, '_blank');
    }
    
    btn.innerText = "تم التوجيه بنجاح!";
    setTimeout(function() { btn.innerText = "إرسال الرسالة الآن"; e.target.reset(); }, 3000);
}

async function runCertificateVerification() {
    var certId = document.getElementById('cert-search-input').value.trim();
    var resBox = document.getElementById('cert-result-box');
    if(!certId) { alert("لطفاً، أدخل رقم الشهادة الموحد."); return; }
    resBox.classList.remove('hidden');
    resBox.className = "mt-8 p-5 text-center text-xs font-bold border rounded-2xl bg-slate-50";
    resBox.innerHTML = "جاري فحص القيود والملفات الفورية بمخازن الأكاديمية...";
    
    const r = await callGoogleAPI('verifyCertificate', [certId]);
    renderVerificationResult(r);
}

function renderVerificationResult(result) {
    var resBox = document.getElementById('cert-result-box');
    resBox.classList.remove('hidden');
    if(result && result.found) {
        var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent(window.location.href + "?cert=" + result.id);
        resBox.className = "mt-8 p-6 rounded-2xl border bg-emerald-50/70 border-emerald-200 text-right space-y-3 text-xs text-slate-700 shadow-sm";
        resBox.innerHTML = `
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
            <div class="space-y-2 flex-1">
                <div class="text-emerald-700 font-black text-sm mb-2 flex items-center gap-1">الشهادة معتمدة وصحيحة ✅</div>
                <p><strong class="text-[#0B1F4D]">اسم المتدرب:</strong> ${result.studentAr}</p>
                <p><strong class="text-[#0B1F4D]">البرنامج:</strong> ${result.course}</p>
                <p><strong class="text-[#0B1F4D]">تاريخ الإصدار:</strong> ${result.date}</p>
                <div class="pt-2"><a href="${result.pdfUrl}" target="_blank" class="inline-block bg-[#0B1F4D] hover:bg-[#132F6B] text-white px-5 py-2 rounded-xl font-bold shadow">تحميل الشهادة pdf</a></div>
            </div>
            <div class="bg-white p-2 rounded-xl shadow border border-emerald-100"><img src="${qrUrl}" alt="QR" class="w-24 h-24 mx-auto"></div>
        </div>`;
    } else {
        resBox.className = "mt-8 p-6 rounded-2xl border bg-rose-50 border-rose-200 text-right text-xs shadow-sm text-slate-700 leading-relaxed";
        resBox.innerHTML = `<div class="text-rose-700 font-extrabold text-sm mb-2">✕ حظر التحقق الإلكتروني</div><p class="font-semibold text-slate-600">عذراً، لم نجد قيد رسمي يطابق هذا الرقم.</p>`;
    }
}

// ==========================================
// نظام تسجيل الدخول ولوحة التحكم (Vercel API)
// ==========================================
function openLoginModal() { document.getElementById('loginModal').classList.remove('hidden'); }
function closeLoginModal() { document.getElementById('loginModal').classList.add('hidden'); }

async function handleLoginSubmit(e) {
    e.preventDefault();
    var btn = document.getElementById('loginSubmitBtn');
    var user = document.getElementById('loginUser').value;
    var pass = document.getElementById('loginPass').value;
    
    btn.innerText = "جاري التحقق..."; btn.disabled = true;

    const res = await callGoogleAPI('authenticateUser', [user, pass]);
    
    if(res && res.success) {
        sessionStorage.setItem('loggedIn', 'true');
        sessionStorage.setItem('role', res.role);
        sessionStorage.setItem('code', res.marketerCode);
        sessionStorage.setItem('name', res.name);
        
        document.getElementById('main-content').style.display = 'none';
        document.getElementById('admin-content').style.display = 'block';
        
        document.getElementById('userNameDisplay').innerText = res.name;
        var roleAr = res.role === 'admin' ? "مدير النظام" : (res.role === 'marketer' ? "مسوق معتمد" : "مدرب معتمد");
        document.getElementById('userRoleDisplay').innerText = roleAr;
        
        if(res.role === 'marketer' && res.marketerCode) {
            document.getElementById('marketer-link-box').classList.remove('hidden');
            var siteUrl = window.location.href.split('?')[0];
            document.getElementById('marketer-link-input').value = siteUrl + "?ref=" + res.marketerCode;
        } else {
            document.getElementById('marketer-link-box').classList.add('hidden');
        }

        if(res.role !== 'admin') {
            document.getElementById('tab-btn-content').style.display = 'none';
            document.getElementById('tab-btn-settings').style.display = 'none';
            document.getElementById('tab-title-users').innerText = "طلابي المسجلين";
            switchAdminTab('tab-stats', document.getElementById('tab-btn-stats'));
        } else {
            document.getElementById('tab-btn-content').style.display = 'block';
            document.getElementById('tab-btn-settings').style.display = 'block';
            document.getElementById('tab-title-users').innerText = "إدارة المتدربين";
        }
        
        loadDashboardData(res.role, res.marketerCode, res.name);
        loadStatsData(res.role, res.marketerCode, res.name);
        closeLoginModal();
    } else {
        alert(res ? res.message : "خطأ في الاتصال بالخادم");
    }
    btn.innerText = "دخول"; btn.disabled = false;
}

function logout() {
    sessionStorage.clear();
    document.getElementById('admin-content').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    navigateTo('home');
}

function switchAdminTab(tabId, btnElement) {
    var contents = document.getElementsByClassName('admin-tab-content');
    for (var i = 0; i < contents.length; i++) {
        contents[i].classList.add('hidden');
        contents[i].classList.remove('block');
    }
    var btns = document.getElementsByClassName('admin-tab-btn');
    for (var j = 0; j < btns.length; j++) {
        btns[j].classList.remove('bg-[#0B1F4D]', 'text-white', 'shadow');
        btns[j].classList.add('bg-transparent', 'text-slate-600');
    }
    document.getElementById(tabId).classList.remove('hidden');
    document.getElementById(tabId).classList.add('block');
    btnElement.classList.remove('bg-transparent', 'text-slate-600');
    btnElement.classList.add('bg-[#0B1F4D]', 'text-white', 'shadow');
}

function copyMarketerLink() {
    var copyText = document.getElementById("marketer-link-input");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
    
    var btn = document.getElementById("btn-copy-link");
    btn.innerHTML = '<i class="fas fa-check"></i> تم النسخ!';
    btn.classList.replace('bg-emerald-600', 'bg-emerald-800');
    setTimeout(function() {
        btn.innerHTML = '<i class="fas fa-copy ml-1"></i> نسخ الرابط';
        btn.classList.replace('bg-emerald-800', 'bg-emerald-600');
    }, 3000);
}

// ==========================================
// دوال الإدارة والعمليات (Vercel API)
// ==========================================
async function loadDashboardData(role, code, name) {
    const data = await callGoogleAPI('getDashboardData', [role, code, name]);
    var tbody = document.getElementById('dataTableBody');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    if(data && data.length > 0 && data[0].error) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500 font-bold">خطأ: ${data[0].error}</td></tr>`;
        return;
    }
    if(!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500 font-bold">لا يوجد متدربين حالياً لعرضهم.</td></tr>`;
        return;
    }

    var countElement = document.getElementById('totalRecordsCount');
    if(countElement) countElement.innerText = data.length;
    
    let safeRole = role ? role.toString().toLowerCase().trim() : '';
    let isAdmin = (safeRole === 'admin' || safeRole === 'مدير');

    data.forEach(function(row) {
        let currentStatus = row.status ? row.status.toString().trim() : 'جديد';
        let statusBadge = '';
        let actionButtons = '';

        if (currentStatus === 'جديد' || currentStatus === '') {
            statusBadge = `<span class="text-blue-600 bg-blue-50 px-2 py-1 rounded">جديد</span>`;
            actionButtons = `
                <button onclick="updateStudentState('${row.orderID}', 'مقبول')" class="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 m-1">قبول</button>
                <button onclick="updateStudentState('${row.orderID}', 'مرفوض')" class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 m-1">رفض</button>`;
        } else if (currentStatus === 'مقبول') {
            statusBadge = `<span class="text-green-600 bg-green-50 px-2 py-1 rounded">مقبول</span>`;
            actionButtons = `
                <button onclick="updateStudentState('${row.orderID}', 'تم تسديد الشهادة')" class="bg-[#D4A017] text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 m-1 shadow-sm">سدد الشهادة</button>
                <button onclick="updateStudentState('${row.orderID}', 'لم يتم تسديد الشهادة')" class="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 m-1 shadow-sm">لم يسدد</button>`;
        } else if (currentStatus === 'تم تسديد الشهادة') {
            statusBadge = `<span class="text-[#D4A017] font-bold bg-yellow-50 px-2 py-1 rounded">تم تسديد الشهادة</span>`;
            actionButtons = `<span class="text-xs text-gray-400 font-bold">مكتمل ✔️</span>`;
        } else if (currentStatus === 'لم يتم تسديد الشهادة') {
            statusBadge = `<span class="text-gray-600 bg-gray-100 px-2 py-1 rounded">لم يسدد</span>`;
            actionButtons = `
                <button onclick="updateStudentState('${row.orderID}', 'تم تسديد الشهادة')" class="bg-[#D4A017] text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 m-1 shadow-sm">تأكيد التسديد</button>`;
        } else if (currentStatus === 'مرفوض') {
            statusBadge = `<span class="text-red-600 bg-red-50 px-2 py-1 rounded">مرفوض</span>`;
            actionButtons = `<span class="text-xs text-gray-400">-</span>`;
        } else {
            statusBadge = `<span class="text-gray-600">${currentStatus}</span>`;
            actionButtons = `<span class="text-xs text-gray-400">-</span>`;
        }

        let adminCell = isAdmin ? `<td class="p-3 border border-slate-100 text-center">${actionButtons}</td>` : `<td class="hidden"></td>`;

        tbody.innerHTML += `
        <tr class="hover:bg-slate-50 transition text-center">
            <td class="p-3 border border-slate-100 font-bold">${row.orderID}</td>
            <td class="p-3 border border-slate-100">${row.name}</td>
            <td class="p-3 border border-slate-100 text-blue-900 font-semibold">${row.course}</td>
            <td class="p-3 border border-slate-100 font-black">${statusBadge}</td>
            ${adminCell}
        </tr>`;
    });
    
    var actionCol = document.getElementById('actionColumn');
    if(actionCol) {
        if(isAdmin) actionCol.classList.remove('hidden');
        else actionCol.classList.add('hidden');
    }
}

async function loadStatsData(role, code, name) {
    const res = await callGoogleAPI('getAdminStats', [role, code, name]);
    if(res && res.success) {
        // جلب جميع العناصر التي تحتوي على class 'text-2xl' في مكان الإحصائيات
        // نستخدم محددات أكثر دقة بناءً على هيكل الصفحة
        var statsElements = document.querySelectorAll('#tab-stats .grid .text-2xl');
        if(statsElements.length >= 4) {
            statsElements[0].innerText = res.studentsCount || 0;
            statsElements[1].innerText = res.certsCount || 0;
            if (res.userType === 'admin') {
                // عرض قائمة المسوقين
                statsElements[2].innerHTML = '<select class="w-full text-center bg-transparent border-0 focus:ring-0 cursor-pointer" style="font-size:16px; outline:none; appearance:none;"><option value="">العدد: ' + res.marketersCount + ' 🔽</option>' + (res.marketersOptions || '') + '</select>';
                statsElements[3].innerHTML = '<select class="w-full text-center bg-transparent border-0 focus:ring-0 cursor-pointer text-green-700 font-bold" style="font-size:16px; outline:none; appearance:none;"><option value="">الإجمالي: ' + res.totalRevenueStr + ' 🔽</option>' + (res.revenueOptions || '') + '</select>';
            } else {
                statsElements[2].innerText = "-";
                statsElements[3].innerText = res.personalRevenue || '0$';
            }
        }
    }
}

async function updateStudentState(orderId, newStatus) {
    if(!confirm("هل تريد تغيير حالة الطلب إلى: " + newStatus + "؟")) return;
    const res = await callGoogleAPI('changeTraineeStatus', [orderId, newStatus]);
    if(res && res.success) {
        alert("✅ تم تغيير الحالة بنجاح إلى: " + res.newStatus);
        let currentRole = sessionStorage.getItem('role');
        let currentCode = sessionStorage.getItem('code');
        let currentName = sessionStorage.getItem('name');
        loadDashboardData(currentRole, currentCode, currentName);
        loadStatsData(currentRole, currentCode, currentName);
    } else {
        alert("❌ خطأ: " + (res ? res.error : "غير معروف"));
    }
}

async function handleSaveSettings() {
    var btn = document.getElementById('btn-save-settings');
    var originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
    btn.disabled = true;

    var settingsData = {
        name: document.getElementById('set-name').value,
        whatsapp: document.getElementById('set-whatsapp').value,
        email: document.getElementById('set-email').value,
        channel: document.getElementById('set-channel').value,
        trainer_pct: document.getElementById('set-trainer-pct').value,
        marketer_pct: document.getElementById('set-marketer-pct').value
    };

    const res = await callGoogleAPI('saveSettingsFromAdmin', [settingsData]);
    if(res && res.success) { alert("تم حفظ الإعدادات بنجاح!"); }
    else { alert("خطأ في الحفظ: " + (res ? res.error : "غير معروف")); }
    
    btn.innerHTML = originalText;
    btn.disabled = false;
}

function handleAddCourse(e) {
    e.preventDefault();
    var btn = document.getElementById('btn-submit-course');
    var originalText = btn.innerText;
    btn.innerText = "جاري الرفع..."; btn.disabled = true;

    var fileInput = document.getElementById('adm-course-img');
    var sendData = async function(base64Img) {
        var data = {
            title: document.getElementById('adm-course-title').value,
            trainer: document.getElementById('adm-course-trainer').value,
            fee: document.getElementById('adm-course-fee').value,
            category: document.getElementById('adm-course-cat').value,
            duration: document.getElementById('adm-course-duration').value,
            image: base64Img
        };
        const res = await callGoogleAPI('addCourseFromAdmin', [data]);
        if(res && res.success){
            alert("تم نشر الدورة بنجاح!");
            document.getElementById('form-add-course').reset();
            loadCoursesFromServer();
        } else {
            alert("خطأ: " + (res ? res.error : "غير معروف"));
        }
        btn.innerText = originalText; btn.disabled = false;
    };

    if (fileInput.files.length > 0) {
        var reader = new FileReader();
        reader.onload = function(ev) { sendData(ev.target.result); };
        reader.readAsDataURL(fileInput.files[0]);
    } else { sendData(""); }
}

async function deleteCourse(courseId) {
    if (!courseId || courseId === 'undefined') { alert("خطأ: المعرف فارغ!"); return; }
    if (!confirm("هل أنت متأكد من حذف هذه الدورة؟")) return;
    const res = await callGoogleAPI('removeCourseFinal', [courseId]);
    if (res && res.success) {
        alert("✅ تم حذف الدورة بنجاح");
        loadCoursesFromServer();
    } else {
        alert("❌ فشل الحذف: " + (res ? res.error : "خطأ غير معروف"));
    }
}

function handleAddNews(e) {
    e.preventDefault();
    var btn = document.getElementById('btn-submit-news');
    var originalText = btn.innerText;
    btn.innerText = "جاري النشر..."; btn.disabled = true;

    var fileInput = document.getElementById('adm-news-img');
    var sendData = async function(base64Img) {
        var data = {
            title: document.getElementById('adm-news-title').value,
            details: document.getElementById('adm-news-details').value,
            image: base64Img
        };
        const res = await callGoogleAPI('addNewsFromAdmin', [data]);
        if(res && res.success){
            alert("تم بث الخبر بنجاح!");
            document.getElementById('form-add-news').reset();
            loadNewsFromServer();
        } else {
            alert("خطأ: " + (res ? res.error : "غير معروف"));
        }
        btn.innerText = originalText; btn.disabled = false;
    };

    if (fileInput.files.length > 0) {
        var reader = new FileReader();
        reader.onload = function(ev) { sendData(ev.target.result); };
        reader.readAsDataURL(fileInput.files[0]);
    } else { sendData(""); }
}

async function deleteNews(newsId) {
    if (!newsId || newsId === 'undefined') { alert("خطأ: المعرف فارغ!"); return; }
    if (!confirm("هل أنت متأكد من حذف هذا الخبر؟")) return;
    const res = await callGoogleAPI('removeNewsFinal', [newsId]);
    if (res && res.success) {
        alert("✅ تم حذف الخبر بنجاح");
        loadNewsFromServer();
    } else {
        alert("❌ فشل الحذف: " + (res ? res.error : "خطأ غير معروف"));
    }
}

function filterAdminTable() {
    var input = document.getElementById("admin-search-box");
    if (!input) return;
    var filter = input.value.toLowerCase().trim();
    
    var table = document.getElementById("dataTableBody");
    if (!table) return;
    var tr = table.getElementsByTagName("tr");

    for (var i = 0; i < tr.length; i++) {
        var tdOrder = tr[i].getElementsByTagName("td")[0];
        var tdName = tr[i].getElementsByTagName("td")[1];
        
        if (tdOrder && tdName) {
            var txtOrder = tdOrder.textContent || tdOrder.innerText;
            var txtName = tdName.textContent || tdName.innerText;
            
            if (txtOrder.toLowerCase().indexOf(filter) > -1 || txtName.toLowerCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}

// ==========================================
// صفحات الهبوط وإدارة التفاصيل (Vercel API)
// ==========================================
async function openLandingPage(courseTitle) {
    // تحقق من وجود عناصر الصفحة (يمكن إضافتها في HTML لاحقاً)
    // بما أنك لم تدرج صفحة الهبوط في HTML، سأضيف تنبيه بدلاً من ذلك
    alert("سيتم فتح صفحة هبوط الدورة: " + courseTitle);
    // يمكنك لاحقاً إضافة الكود لفتح صفحة هبوط كما هو موضح في الكود الأصلي
}

function closeLandingPage() {
    // دالة إغلاق صفحة الهبوط
}

function registerFromLanding() {
    // دالة التسجيل من صفحة الهبوط
}

async function openDetailsModal(title, event) {
    document.getElementById('det-course-title').value = title;
    document.getElementById('det-course-name').innerText = title;
    document.getElementById('det-img').value = '';
    
    var btn = event ? event.currentTarget : null;
    var originalText = btn ? btn.innerText : 'التفاصيل';
    if(btn) { btn.innerText = "..."; btn.disabled = true; }

    const data = await callGoogleAPI('fetchCourseLandingData', [title]);
    if(btn) { btn.innerText = originalText; btn.disabled = false; }
    
    if(data && data.success) {
        document.getElementById('det-desc').value = data.description || '';
        document.getElementById('det-obj').value = data.objectives || '';
        document.getElementById('det-syl').value = data.syllabus || '';
        document.getElementById('det-target').value = data.targetAudience || '';
    } else {
        document.getElementById('det-desc').value = '';
        document.getElementById('det-obj').value = '';
        document.getElementById('det-syl').value = '';
        document.getElementById('det-target').value = '';
    }
    document.getElementById('details-modal').classList.remove('hidden');
}

function closeDetailsModal() { document.getElementById('details-modal').classList.add('hidden'); }

function saveCourseDetails(event) {
    var btn = event.currentTarget;
    var originalText = btn.innerText;
    btn.innerText = "جاري الرفع والحفظ..."; btn.disabled = true;
    
    var fileInput = document.getElementById('det-img');
    
    var sendData = async function(base64Img) {
        var detailsData = {
            title: document.getElementById('det-course-title').value,
            description: document.getElementById('det-desc').value,
            objectives: document.getElementById('det-obj').value,
            syllabus: document.getElementById('det-syl').value,
            targetAudience: document.getElementById('det-target').value,
            image: base64Img
        };

        const res = await callGoogleAPI('saveDetailsToSheet', [detailsData]);
        alert(res ? res.message || res.error || "تم التنفيذ" : "خطأ غير معروف");
        if(res && res.success) closeDetailsModal();
        btn.innerText = originalText; btn.disabled = false;
    };

    if (fileInput.files.length > 0) {
        var reader = new FileReader();
        reader.onload = function(ev) { sendData(ev.target.result); };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        sendData("");
    }
}

function openEditCourseModal(id, title, trainer, dur, fee, cat) {
    document.getElementById('edit-course-id').value = id;
    document.getElementById('edit-title').value = title;
    document.getElementById('edit-trainer').value = trainer;
    document.getElementById('edit-dur').value = dur;
    document.getElementById('edit-fee').value = fee;
    document.getElementById('edit-cat').value = cat;
    document.getElementById('edit-course-modal').classList.remove('hidden');
}

async function submitCourseEdit() {
    var id = document.getElementById('edit-course-id').value;
    var data = {
        title: document.getElementById('edit-title').value,
        trainer: document.getElementById('edit-trainer').value,
        duration: document.getElementById('edit-dur').value,
        fee: document.getElementById('edit-fee').value,
        category: document.getElementById('edit-cat').value
    };
    
    document.getElementById('edit-course-modal').classList.add('hidden');
    const res = await callGoogleAPI('updateCourseFromAdmin', [id, data]);
    alert("تم حفظ التعديلات!");
    loadCoursesFromServer();
}

async function addTestimonial() {
    var data = {
        name: document.getElementById('adm-test-name').value,
        rating: document.getElementById('adm-test-rating').value,
        text: document.getElementById('adm-test-text').value
    };
    const res = await callGoogleAPI('addTestimonialFromAdmin', [data]);
    if(res) {
        alert("تم الإضافة!");
        document.getElementById('adm-test-name').value = '';
        document.getElementById('adm-test-text').value = '';
        loadTestimonialsFromServer();
    }
}

async function deleteTestimonial(id) {
    if(confirm("حذف الرأي؟")) {
        await callGoogleAPI('deleteTestimonialFromAdmin', [id]);
        loadTestimonialsFromServer();
    }
}

function renderTestimonialsHome(data) {
    var container = document.getElementById('testimonials-dynamic-container');
    if(!container) return;
    container.className = 'grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8';
    container.innerHTML = '';
    
    data.forEach(function(t) {
        var stars = '⭐'.repeat(t.rating || 5);
        container.insertAdjacentHTML('beforeend', `
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative text-right flex flex-col justify-between h-full hover:shadow-md transition-shadow duration-300">
                <div>
                    <div class="text-[#D4A017] opacity-10 text-4xl absolute top-4 left-4"><i class="fas fa-quote-left"></i></div>
                    <div class="text-xs mb-3 text-amber-400">${stars}</div>
                    <p class="text-xs text-slate-600 leading-relaxed mb-4">"${t.text}"</p>
                </div>
                <div class="font-bold text-[#0B1F4D] text-sm mt-auto">- ${t.name}</div>
            </div>`);
    });
}

function renderTestimonialsAdmin(data) {
    var container = document.getElementById('admin-testimonials-list');
    if(!container) return;
    container.innerHTML = '';
    data.forEach(function(t) {
        container.insertAdjacentHTML('beforeend', `
        <div class="flex justify-between items-center p-2 bg-white border rounded-lg text-xs">
            <span><strong>${t.name}</strong>: ${t.text}</span>
            <button onclick="deleteTestimonial('${t.id}')" class="text-rose-600 px-2 font-bold hover:underline">حذف</button>
        </div>`);
    });
}

// ==========================================
// تهيئة الموقع عند التحميل
// ==========================================
window.addEventListener('DOMContentLoaded', function() {
    if (typeof initializeWebsiteLayout === 'function') {
        setTimeout(initializeWebsiteLayout, 300);
    }
});