// ==========================================
// المتغيرات والإعدادات الأساسية
// ==========================================

// رابط التطبيق بعد نشره (ضع الرابط الخاص بك هنا)
var API_BASE_URL = 'https://script.google.com/macros/s/AKfycbxMog8gTa9QaTUX_36_RapCB4G0H4lyDTnr_n7X6BA76WDXp0343rfTnGA1yZ-uD8mzYg/exec';

// دالة الاتصال العامة بواجهة API
async function callGoogleAPI(action, data) {
  try {
    var payload = {
      action: action,
      data: data || []
    };

    var response = await fetch(API_BASE_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    // بما أننا نستخدم mode: 'no-cors'، نتعامل مع النص مباشرة
    var text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      // إذا لم يكن JSON صحيحاً، نعيد النص ككائن
      return { success: true, raw: text };
    }
  } catch (error) {
    console.error('خطأ في الاتصال بـ Google API:', error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// المتغيرات العالمية
// ==========================================
var globalCourses = [];
var globalAds = [
  { title: "سجل الآن في دبلوم إدارة الأعمال", type: "إعلان رئيسي", date: "ينتهي في 2026-12-31", img: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800", link: "#" },
  { title: "خصم 50% على دورات الذكاء الاصطناعي", type: "إعلان عاجل", date: "ينتهي في 2026-08-01", img: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800", link: "#" },
  { title: "الدفعة الجديدة للغة الإنجليزية", type: "إعلان عادي", date: "مستمر", img: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800", link: "#" }
];
var currentAdIndex = 0;

// ==========================================
// دوال التهيئة والتنقل
// ==========================================

function initializeWebsiteLayout() {
  try {
    // تحديث عدد الزيارات
    var totalViews = parseInt(localStorage.getItem('site_views')) || 0;
    totalViews += 1;
    localStorage.setItem('site_views', totalViews);
  } catch(e) {}

  // تحميل البيانات من الخادم
  loadCoursesFromServer();
  loadNewsFromServer();
  loadTestimonialsFromServer();
  
  // تهيئة السلايدر
  renderAdsSlider();
  
  // عرض النافذة المنبثقة
  setTimeout(function() {
    var popup = document.getElementById('welcome-popup');
    if (popup) popup.classList.remove('hidden');
  }, 1200);
  
  // تشغيل السلايدر التلقائي
  setInterval(function() { moveAdSlide(1); }, 5000);
}

function navigateTo(pageId) {
  // إخفاء جميع الصفحات
  document.querySelectorAll('.page-section').forEach(function(el) {
    el.classList.remove('active');
  });
  
  // إظهار الصفحة المطلوبة
  var target = document.getElementById('page-' + pageId);
  if (target) {
    target.classList.add('active');
  }
  
  // تحديث التنقل
  document.querySelectorAll('header nav a, .mobile-menu a').forEach(function(el) {
    el.classList.remove('nav-active');
  });
  
  var btn = document.getElementById('btn-' + pageId);
  if (btn) btn.classList.add('nav-active');
  
  // التمرير للأعلى
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobileMenu() {
  var menu = document.getElementById('mobile-menu');
  var icon = document.getElementById('menu-toggle-icon');
  
  if (menu) {
    if (menu.classList.contains('hidden')) {
      menu.classList.remove('hidden');
      if (icon) icon.innerHTML = "&#10006;";
    } else {
      menu.classList.add('hidden');
      if (icon) icon.innerHTML = "&#9776;";
    }
  }
}

function closePopup() {
  var popup = document.getElementById('welcome-popup');
  if (popup) popup.classList.add('hidden');
}

function popupActionRegister() {
  closePopup();
  navigateTo('register');
}

function trackButtonClick(buttonName) {
  if (buttonName === 'WhatsApp_Float') {
    try {
      var clicks = parseInt(localStorage.getItem('wa_clicks')) || 0;
      clicks += 1;
      localStorage.setItem('wa_clicks', clicks);
    } catch(e) {}
  }
  console.log('تم الضغط على:', buttonName);
}

// ==========================================
// دوال تحميل البيانات من الخادم
// ==========================================

async function loadCoursesFromServer() {
  var courses = await callGoogleAPI('fetchCoursesFromSheet');
  if (courses && !courses.error) {
    globalCourses = courses;
    renderCourses(courses);
    updateRegistrationDropdown(courses);
  } else {
    console.error('فشل تحميل الدورات:', courses);
  }
}

async function loadNewsFromServer() {
  var news = await callGoogleAPI('fetchNewsFromSheet');
  if (news && !news.error) {
    renderNews(news);
  } else {
    console.error('فشل تحميل الأخبار:', news);
  }
}

async function loadTestimonialsFromServer() {
  var data = await callGoogleAPI('fetchTestimonialsFromSheet');
  if (data && !data.error) {
    renderTestimonialsHome(data);
    renderTestimonialsAdmin(data);
  } else {
    console.error('فشل تحميل الآراء:', data);
  }
}

// ==========================================
// دوال عرض البيانات
// ==========================================

function renderCourses(courses) {
  var fullContainer = document.getElementById('courses-list-container');
  var homeFeaturedContainer = document.getElementById('home-featured-courses');
  var adminCoursesList = document.getElementById('admin-courses-list');
  
  if (fullContainer) fullContainer.innerHTML = '';
  if (homeFeaturedContainer) homeFeaturedContainer.innerHTML = '';
  if (adminCoursesList) adminCoursesList.innerHTML = '';
  
  courses.forEach(function(c, index) {
    var cardMarkup = `
    <div class="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden flex flex-col justify-between text-right transition hover:shadow-xl" data-category="${c.category || 'عامة'}">
      <img class="h-44 w-full object-cover" src="${c.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600'}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600'">
      <div class="p-5 flex-1 flex flex-col justify-between">
        <div class="mb-4">
          <span class="bg-slate-100 text-[#0B1F4D] text-[10px] font-bold px-2.5 py-1 rounded-md border border-slate-200">${c.category || 'عامة'}</span>
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
    
    if (fullContainer) fullContainer.insertAdjacentHTML('beforeend', cardMarkup);
    if (homeFeaturedContainer && index < 3) homeFeaturedContainer.insertAdjacentHTML('beforeend', cardMarkup);
    
    if (adminCoursesList) {
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
  var cards = document.querySelectorAll('#courses-list-container > div');
  cards.forEach(function(card) {
    var cat = card.getAttribute('data-category');
    if (category === 'all' || cat === category) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

function updateRegistrationDropdown(courses) {
  var selectBox = document.getElementById('reg-course');
  if (!selectBox) return;
  selectBox.innerHTML = '<option value="">-- انقر هنا لتحديد المسار التدريبي --</option>';
  courses.forEach(function(c) {
    selectBox.insertAdjacentHTML('beforeend', `<option value="${c.title}">${c.title}</option>`);
  });
}

function selectCourseDirectly(courseTitle) {
  var selectBox = document.getElementById('reg-course');
  if (selectBox) selectBox.value = courseTitle;
  showSelectedCourseDetails();
  navigateTo('register');
}

function showSelectedCourseDetails() {
  var selectedTitle = document.getElementById('reg-course').value;
  var display = document.getElementById('course-dynamic-info');
  if (!display) return;
  
  var course = globalCourses.find(function(c) { return c.title === selectedTitle; });
  
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
  
  if (container) {
    container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    container.innerHTML = '';
  }
  if (adminNewsList) adminNewsList.innerHTML = '';
  
  news.forEach(function(n) {
    var shareTxt = encodeURIComponent(n.title + " - شاهد التفاصيل عبر موقع أكاديمية اقرأ");
    var imgHtml = n.image ? `<img src="${n.image}" class="w-full h-40 object-cover rounded-xl mb-3" loading="lazy" onerror="this.style.display='none'">` : '';
    
    if (container) {
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
    
    if (adminNewsList) {
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

function renderTestimonialsHome(data) {
  var container = document.getElementById('testimonials-dynamic-container');
  if (!container) return;
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
  if (!container) return;
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
// دوال السلايدر
// ==========================================

function renderAdsSlider() {
  var container = document.getElementById('ads-slider-container');
  var dots = document.getElementById('ads-dots-container');
  if (!container) return;
  container.innerHTML = '';
  if (dots) dots.innerHTML = '';
  
  globalAds.forEach(function(ad, idx) {
    var badgeClass = ad.type === "إعلان عاجل" ? "bg-rose-600" : (ad.type === "إعلان رئيسي" ? "bg-[#D4A017]" : "bg-blue-600");
    container.innerHTML += `
    <div class="slide bg-slate-900 cursor-pointer" onclick="navigateTo('register')">
      <img src="${ad.img}" class="w-full h-full object-cover opacity-60" onerror="this.src='https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600'">
      <div class="absolute inset-0 flex flex-col justify-end p-8 text-white text-right bg-gradient-to-t from-black/80 to-transparent">
        <span class="${badgeClass} text-[10px] font-bold px-3 py-1 rounded-full w-max mb-3 shadow">${ad.type}</span>
        <h3 class="text-3xl font-black mb-2">${ad.title}</h3>
        <p class="text-xs text-slate-300 font-bold mb-4"><i class="fas fa-clock"></i> ${ad.date}</p>
      </div>
    </div>`;
    
    if (dots) {
      dots.innerHTML += `<div onclick="setAdSlide(${idx})" class="dot transition ${idx===0?'active':''}"></div>`;
    }
  });
}

function moveAdSlide(dir) {
  currentAdIndex = (currentAdIndex + dir + globalAds.length) % globalAds.length;
  setAdSlide(currentAdIndex);
}

function setAdSlide(idx) {
  currentAdIndex = idx;
  var slider = document.getElementById('ads-slider-container');
  if (slider) {
    slider.style.transform = "translateX(-" + (idx * 100) + "%)";
  }
  var dots = document.querySelectorAll('.dot');
  dots.forEach(function(d, i) {
    if (i === idx) d.classList.add('active');
    else d.classList.remove('active');
  });
}

// ==========================================
// دوال التسجيل والتواصل
// ==========================================

async function handleNewRegistration(e) {
  e.preventDefault();
  var submitBtn = document.getElementById('submit-btn');
  if (!submitBtn) return;
  var originalText = submitBtn.innerText;
  submitBtn.disabled = true;
  submitBtn.innerText = 'جاري التسجيل...';
  submitBtn.classList.add('opacity-70', 'cursor-not-allowed');
  
  var studentData = {
    nameAr: document.getElementById('reg-name-ar').value,
    nameEn: document.getElementById('reg-name-en').value,
    whatsapp: document.getElementById('reg-whatsapp').value,
    nationality: document.getElementById('reg-nationality').value,
    residence: document.getElementById('reg-residence').value || 'أصلي',
    governorate: document.getElementById('reg-governorate').value,
    course: document.getElementById('reg-course').value,
    gender: document.getElementById('reg-gender').value,
    degree: document.getElementById('reg-degree').value,
    platform: document.getElementById('reg-platform').value,
    marketerCode: localStorage.getItem('marketerRef') || ''
  };
  
  var res = await callGoogleAPI('registerTraineeFinal', [studentData]);
  
  if (res && res.success) {
    var formChildren = document.getElementById('registration-form').children;
    for (var i = 0; i < formChildren.length; i++) {
      if (formChildren[i].id !== 'successMessage') {
        formChildren[i].style.display = 'none';
      }
    }
    
    var successDiv = document.getElementById('successMessage');
    if (successDiv) {
      successDiv.classList.remove('hidden');
      successDiv.style.display = 'block';
      if (document.getElementById('displayOrderID')) {
        document.getElementById('displayOrderID').innerText = res.orderID;
      }
    }
    
    setTimeout(function() {
      window.open("https://whatsapp.com/channel/0029VbCDK6M4IBhBR3jvVY0Y", "_blank");
    }, 3000);
  } else {
    alert("❌ خطأ أثناء التسجيل: " + (res ? res.error : "غير معروف"));
    submitBtn.disabled = false;
    submitBtn.innerText = originalText;
    submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
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
  
  if (msgObj.method === 'whatsapp') {
    var waText = encodeURIComponent("مرحباً إدارة أكاديمية اقرأ،\nالاسم: " + msgObj.name + "\nالنوع: " + msgObj.type + "\nالرسالة: " + msgObj.text);
    window.open('https://wa.me/967777644293?text=' + waText, '_blank');
  } else if (msgObj.method === 'email') {
    var mailText = encodeURIComponent("الاسم: " + msgObj.name + "\nالرسالة: " + msgObj.text);
    window.open('mailto:aqraakadymyt51@gmail.com?subject=' + encodeURIComponent(msgObj.type) + '&body=' + mailText, '_blank');
  }
  
  btn.innerText = "تم التوجيه بنجاح!";
  setTimeout(function() {
    btn.innerText = "إرسال الرسالة الآن";
    e.target.reset();
  }, 3000);
}

async function runCertificateVerification() {
  var certId = document.getElementById('cert-search-input').value.trim();
  var resBox = document.getElementById('cert-result-box');
  if (!certId) {
    alert("لطفاً، أدخل رقم الشهادة الموحد.");
    return;
  }
  
  resBox.classList.remove('hidden');
  resBox.className = "mt-8 p-5 text-center text-xs font-bold border rounded-2xl bg-slate-50";
  resBox.innerHTML = "جاري فحص القيود والملفات الفورية بمخازن الأكاديمية...";
  
  var r = await callGoogleAPI('verifyCertificate', [certId]);
  renderVerificationResult(r);
}

function renderVerificationResult(result) {
  var resBox = document.getElementById('cert-result-box');
  resBox.classList.remove('hidden');
  
  if (result && result.found) {
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
// دوال تسجيل الدخول ولوحة التحكم
// ==========================================

function openLoginModal() {
  var modal = document.getElementById('loginModal');
  if (modal) modal.classList.remove('hidden');
}

function closeLoginModal() {
  var modal = document.getElementById('loginModal');
  if (modal) modal.classList.add('hidden');
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  var btn = document.getElementById('loginSubmitBtn');
  var user = document.getElementById('loginUser').value;
  var pass = document.getElementById('loginPass').value;
  
  btn.innerText = "جاري التحقق...";
  btn.disabled = true;
  
  var res = await callGoogleAPI('authenticateUser', [user, pass]);
  
  if (res && res.success) {
    sessionStorage.setItem('loggedIn', 'true');
    sessionStorage.setItem('role', res.role);
    sessionStorage.setItem('code', res.marketerCode);
    sessionStorage.setItem('name', res.name);
    
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('admin-content').style.display = 'block';
    
    document.getElementById('userNameDisplay').innerText = res.name;
    var roleAr = res.role === 'admin' ? "مدير النظام" : (res.role === 'marketer' ? "مسوق معتمد" : "مدرب معتمد");
    document.getElementById('userRoleDisplay').innerText = roleAr;
    
    if (res.role === 'marketer' && res.marketerCode) {
      document.getElementById('marketer-link-box').classList.remove('hidden');
      var siteUrl = window.location.href.split('?')[0];
      document.getElementById('marketer-link-input').value = siteUrl + "?ref=" + res.marketerCode;
    } else {
      document.getElementById('marketer-link-box').classList.add('hidden');
    }
    
    if (res.role !== 'admin') {
      var tabContent = document.getElementById('tab-btn-content');
      var tabSettings = document.getElementById('tab-btn-settings');
      if (tabContent) tabContent.style.display = 'none';
      if (tabSettings) tabSettings.style.display = 'none';
      var titleUsers = document.getElementById('tab-title-users');
      if (titleUsers) titleUsers.innerText = "طلابي المسجلين";
      switchAdminTab('tab-stats', document.getElementById('tab-btn-stats'));
    } else {
      var tabContent2 = document.getElementById('tab-btn-content');
      var tabSettings2 = document.getElementById('tab-btn-settings');
      if (tabContent2) tabContent2.style.display = 'block';
      if (tabSettings2) tabSettings2.style.display = 'block';
      var titleUsers2 = document.getElementById('tab-title-users');
      if (titleUsers2) titleUsers2.innerText = "إدارة المتدربين";
    }
    
    loadDashboardData(res.role, res.marketerCode, res.name);
    loadStatsData(res.role, res.marketerCode, res.name);
    closeLoginModal();
  } else {
    alert(res ? res.message : "خطأ في الاتصال بالخادم");
  }
  
  btn.innerText = "دخول";
  btn.disabled = false;
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
  
  var target = document.getElementById(tabId);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('block');
  }
  
  if (btnElement) {
    btnElement.classList.remove('bg-transparent', 'text-slate-600');
    btnElement.classList.add('bg-[#0B1F4D]', 'text-white', 'shadow');
  }
}

function copyMarketerLink() {
  var copyText = document.getElementById("marketer-link-input");
  if (!copyText) return;
  
  copyText.select();
  copyText.setSelectionRange(0, 99999);
  document.execCommand("copy");
  
  var btn = document.getElementById("btn-copy-link");
  if (btn) {
    btn.innerHTML = '<i class="fas fa-check"></i> تم النسخ!';
    btn.classList.replace('bg-emerald-600', 'bg-emerald-800');
    setTimeout(function() {
      btn.innerHTML = '<i class="fas fa-copy ml-1"></i> نسخ الرابط';
      btn.classList.replace('bg-emerald-800', 'bg-emerald-600');
    }, 3000);
  }
}

// ==========================================
// دوال لوحة التحكم
// ==========================================

async function loadDashboardData(role, code, name) {
  var data = await callGoogleAPI('getDashboardData', [role, code, name]);
  var tbody = document.getElementById('dataTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500 font-bold">لا يوجد متدربين حالياً لعرضهم.</td></tr>`;
    return;
  }
  
  if (data.error) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500 font-bold">خطأ: ${data.error}</td></tr>`;
    return;
  }
  
  var countElement = document.getElementById('totalRecordsCount');
  if (countElement) countElement.innerText = data.length;
  
  var safeRole = role ? role.toString().toLowerCase().trim() : '';
  var isAdmin = (safeRole === 'admin' || safeRole === 'مدير');
  
  data.forEach(function(row) {
    var currentStatus = row.status ? row.status.toString().trim() : 'جديد';
    var statusBadge = '';
    var actionButtons = '';
    
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
    
    var adminCell = isAdmin ? `<td class="p-3 border border-slate-100 text-center">${actionButtons}</td>` : `<td class="hidden"></td>`;
    
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
  if (actionCol) {
    if (isAdmin) actionCol.classList.remove('hidden');
    else actionCol.classList.add('hidden');
  }
}

async function loadStatsData(role, code, name) {
  var res = await callGoogleAPI('getAdminStats', [role, code, name]);
  if (res && res.success) {
    var statsElements = document.querySelectorAll('#tab-stats .grid .text-2xl');
    if (statsElements.length >= 4) {
      statsElements[0].innerText = res.studentsCount || 0;
      statsElements[1].innerText = res.certsCount || 0;
      
      if (res.userType === 'admin') {
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
  if (!confirm("هل تريد تغيير حالة الطلب إلى: " + newStatus + "؟")) return;
  
  var res = await callGoogleAPI('changeTraineeStatus', [orderId, newStatus]);
  
  if (res && res.success) {
    alert("✅ تم تغيير الحالة بنجاح إلى: " + res.newStatus);
    var currentRole = sessionStorage.getItem('role');
    var currentCode = sessionStorage.getItem('code');
    var currentName = sessionStorage.getItem('name');
    loadDashboardData(currentRole, currentCode, currentName);
    loadStatsData(currentRole, currentCode, currentName);
  } else {
    alert("❌ خطأ: " + (res ? res.error : "غير معروف"));
  }
}

// ==========================================
// دوال الإدارة (إضافة وحذف)
// ==========================================

function handleAddCourse(e) {
  e.preventDefault();
  var btn = document.getElementById('btn-submit-course');
  var originalText = btn.innerText;
  btn.innerText = "جاري الرفع...";
  btn.disabled = true;
  
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
    
    var res = await callGoogleAPI('addCourseFromAdmin', [data]);
    
    if (res && res.success) {
      alert("تم نشر الدورة بنجاح!");
      document.getElementById('form-add-course').reset();
      loadCoursesFromServer();
    } else {
      alert("خطأ: " + (res ? res.error : "غير معروف"));
    }
    
    btn.innerText = originalText;
    btn.disabled = false;
  };
  
  if (fileInput && fileInput.files.length > 0) {
    var reader = new FileReader();
    reader.onload = function(ev) { sendData(ev.target.result); };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    sendData("");
  }
}

async function deleteCourse(courseId) {
  if (!courseId || courseId === 'undefined') {
    alert("خطأ: المعرف فارغ!");
    return;
  }
  if (!confirm("هل أنت متأكد من حذف هذه الدورة؟")) return;
  
  var res = await callGoogleAPI('removeCourseFinal', [courseId]);
  
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
  btn.innerText = "جاري النشر...";
  btn.disabled = true;
  
  var fileInput = document.getElementById('adm-news-img');
  var sendData = async function(base64Img) {
    var data = {
      title: document.getElementById('adm-news-title').value,
      details: document.getElementById('adm-news-details').value,
      image: base64Img
    };
    
    var res = await callGoogleAPI('addNewsFromAdmin', [data]);
    
    if (res && res.success) {
      alert("تم بث الخبر بنجاح!");
      document.getElementById('form-add-news').reset();
      loadNewsFromServer();
    } else {
      alert("خطأ: " + (res ? res.error : "غير معروف"));
    }
    
    btn.innerText = originalText;
    btn.disabled = false;
  };
  
  if (fileInput && fileInput.files.length > 0) {
    var reader = new FileReader();
    reader.onload = function(ev) { sendData(ev.target.result); };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    sendData("");
  }
}

async function deleteNews(newsId) {
  if (!newsId || newsId === 'undefined') {
    alert("خطأ: المعرف فارغ!");
    return;
  }
  if (!confirm("هل أنت متأكد من حذف هذا الخبر؟")) return;
  
  var res = await callGoogleAPI('removeNewsFinal', [newsId]);
  
  if (res && res.success) {
    alert("✅ تم حذف الخبر بنجاح");
    loadNewsFromServer();
  } else {
    alert("❌ فشل الحذف: " + (res ? res.error : "خطأ غير معروف"));
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
  
  var res = await callGoogleAPI('saveSettingsFromAdmin', [settingsData]);
  
  if (res && res.success) {
    alert("تم حفظ الإعدادات بنجاح!");
  } else {
    alert("خطأ في الحفظ: " + (res ? res.error : "غير معروف"));
  }
  
  btn.innerHTML = originalText;
  btn.disabled = false;
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
// دوال صفحات الهبوط والتفاصيل
// ==========================================

async function openLandingPage(courseTitle) {
  var container = document.getElementById('landing-page-container');
  var loader = document.getElementById('lp-loader');
  if (container) container.classList.remove('hidden');
  if (loader) loader.style.display = 'block';
  
  var data = await callGoogleAPI('fetchCourseLandingData', [courseTitle]);
  
  if (loader) loader.style.display = 'none';
  
  if (data && data.success) {
    document.getElementById('lp-title').innerText = data.title;
    document.getElementById('lp-duration').innerText = data.duration || 'غير محدد';
    document.getElementById('lp-trainer').innerText = data.trainer || 'نخبة من المدربين';
    document.getElementById('lp-target').innerText = data.targetAudience || 'الجميع';
    document.getElementById('lp-desc').innerText = data.description || 'لا يوجد وصف حالياً.';
    document.getElementById('lp-fee').innerText = data.fee || 'تواصل معنا';
    
    // عرض الأهداف
    var objList = document.getElementById('lp-objectives');
    if (objList) {
      objList.innerHTML = '';
      if (data.objectives) {
        data.objectives.split('-').forEach(function(item) {
          if (item.trim()) {
            objList.innerHTML += `<li>${item.trim()}</li>`;
          }
        });
      }
    }
    
    // عرض المحاور
    var sylList = document.getElementById('lp-syllabus');
    if (sylList) {
      sylList.innerHTML = '';
      if (data.syllabus) {
        data.syllabus.split('-').forEach(function(item) {
          if (item.trim()) {
            sylList.innerHTML += `<li>${item.trim()}</li>`;
          }
        });
      }
    }
    
    // تحديث صورة الخلفية
    var img = document.getElementById('lp-image');
    if (img) {
      img.src = data.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600';
      img.onerror = function() { this.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600'; };
    }
    
    // تحديث رابط الواتساب
    var waLink = document.getElementById('lp-whatsapp');
    if (waLink) {
      waLink.href = 'https://wa.me/967777644293?text=' + encodeURIComponent('استفسار عن دورة: ' + data.title);
    }
    
    if (container) container.classList.remove('hidden');
  } else {
    alert("عذراً، لا توجد تفاصيل إضافية لهذه الدورة حالياً.");
    if (container) container.classList.add('hidden');
  }
}

function closeLandingPage() {
  var container = document.getElementById('landing-page-container');
  if (container) container.classList.add('hidden');
}

function registerFromLanding() {
  var title = document.getElementById('lp-title');
  if (title) {
    selectCourseDirectly(title.innerText);
  }
}

async function openDetailsModal(title, event) {
  document.getElementById('det-course-title').value = title;
  document.getElementById('det-course-name').innerText = title;
  document.getElementById('det-img').value = '';
  
  var btn = event ? event.currentTarget : null;
  var originalText = btn ? btn.innerText : 'التفاصيل';
  if (btn) { btn.innerText = "..."; btn.disabled = true; }
  
  var data = await callGoogleAPI('fetchCourseLandingData', [title]);
  
  if (btn) { btn.innerText = originalText; btn.disabled = false; }
  
  if (data && data.success) {
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

function closeDetailsModal() {
  document.getElementById('details-modal').classList.add('hidden');
}

function saveCourseDetails(event) {
  var btn = event.currentTarget;
  var originalText = btn.innerText;
  btn.innerText = "جاري الرفع والحفظ...";
  btn.disabled = true;
  
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
    
    var res = await callGoogleAPI('saveDetailsToSheet', [detailsData]);
    alert(res ? res.message || res.error || "تم التنفيذ" : "خطأ غير معروف");
    
    if (res && res.success) {
      closeDetailsModal();
    }
    
    btn.innerText = originalText;
    btn.disabled = false;
  };
  
  if (fileInput && fileInput.files.length > 0) {
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
  var res = await callGoogleAPI('updateCourseFromAdmin', [id, data]);
  alert(res && res.success ? "تم حفظ التعديلات!" : "خطأ في التعديل");
  loadCoursesFromServer();
}

async function addTestimonial() {
  var data = {
    name: document.getElementById('adm-test-name').value,
    rating: document.getElementById('adm-test-rating').value,
    text: document.getElementById('adm-test-text').value
  };
  
  var res = await callGoogleAPI('addTestimonialFromAdmin', [data]);
  
  if (res) {
    alert("تم الإضافة!");
    document.getElementById('adm-test-name').value = '';
    document.getElementById('adm-test-text').value = '';
    loadTestimonialsFromServer();
  }
}

async function deleteTestimonial(id) {
  if (confirm("حذف الرأي؟")) {
    await callGoogleAPI('deleteTestimonialFromAdmin', [id]);
    loadTestimonialsFromServer();
  }
}

// ==========================================
// تهيئة الموقع عند التحميل
// ==========================================

// بدء تشغيل التطبيق بعد تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  // إذا كان المستخدم مسجلاً دخوله، نعرض لوحة التحكم
  if (sessionStorage.getItem('loggedIn') === 'true') {
    var role = sessionStorage.getItem('role');
    var code = sessionStorage.getItem('code');
    var name = sessionStorage.getItem('name');
    
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('admin-content').style.display = 'block';
    
    document.getElementById('userNameDisplay').innerText = name;
    var roleAr = role === 'admin' ? "مدير النظام" : (role === 'marketer' ? "مسوق معتمد" : "مدرب معتمد");
    document.getElementById('userRoleDisplay').innerText = roleAr;
    
    if (role === 'marketer' && code) {
      document.getElementById('marketer-link-box').classList.remove('hidden');
      var siteUrl = window.location.href.split('?')[0];
      document.getElementById('marketer-link-input').value = siteUrl + "?ref=" + code;
    } else {
      document.getElementById('marketer-link-box').classList.add('hidden');
    }
    
    if (role !== 'admin') {
      var tabContent = document.getElementById('tab-btn-content');
      var tabSettings = document.getElementById('tab-btn-settings');
      if (tabContent) tabContent.style.display = 'none';
      if (tabSettings) tabSettings.style.display = 'none';
      var titleUsers = document.getElementById('tab-title-users');
      if (titleUsers) titleUsers.innerText = "طلابي المسجلين";
      switchAdminTab('tab-stats', document.getElementById('tab-btn-stats'));
    } else {
      var tabContent2 = document.getElementById('tab-btn-content');
      var tabSettings2 = document.getElementById('tab-btn-settings');
      if (tabContent2) tabContent2.style.display = 'block';
      if (tabSettings2) tabSettings2.style.display = 'block';
      var titleUsers2 = document.getElementById('tab-title-users');
      if (titleUsers2) titleUsers2.innerText = "إدارة المتدربين";
    }
    
    loadDashboardData(role, code, name);
    loadStatsData(role, code, name);
  }
  
  // تهيئة الموقع
  if (typeof initializeWebsiteLayout === 'function') {
    setTimeout(initializeWebsiteLayout, 300);
  }
});