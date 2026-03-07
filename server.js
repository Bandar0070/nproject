require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const requestIp = require('request-ip'); // أضف هذا السطر
const geoip = require('geoip-lite');    // أضف هذا السطر
const app = express();
// ... باقي الكود

// 2. الموديلات (تعريفها أولاً)
const DevAdvice = mongoose.models.DevAdvice || mongoose.model('DevAdvice', new mongoose.Schema({
    developerName: String,
    isHelpful: String,
    role: String,
    advice: String,
    ip: String,
    location: String,
    userAgent: String,
    createdAt: { type: Date, default: Date.now }
}));

app.get('/', (req, res) => {
  res.send('مرحباً! السيرفر يعمل بنجاح.');
});
// 3. المسارات
app.get('/admin-dev', async (req, res) => {
    try {
        // جلب البيانات والإحصائيات
        const [tips, totalCount] = await Promise.all([
            DevAdvice.find().sort({ createdAt: -1 }),
            DevAdvice.countDocuments()
        ]);

        res.send(`
            <html dir="rtl"><head>
            <meta charset="UTF-8">
            <style>
                body { background: #0f172a; color: white; font-family: sans-serif; padding: 20px; }
                .stats-container { display: flex; gap: 20px; margin-bottom: 30px; }
                .stat-card { background: #1e293b; padding: 20px; border-radius: 15px; border: 1px solid #334155; flex: 1; text-align: center; }
                .stat-card h2 { margin: 0; color: #38bdf8; font-size: 2em; }
                table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 10px; overflow: hidden; }
                th { background: #334155; padding: 15px; text-align: right; }
                td { padding: 12px; border-bottom: 1px solid #334155; }
            </style>
            </head><body>
                <h1>🚀 لوحة تحكم المطورين</h1>
                <div class="stats-container">
                    <div class="stat-card"><h2>${totalCount}</h2><p>إجمالي النصائح</p></div>
                </div>
                <table>
                    <thead><tr><th>المطور</th><th>النصيحة</th><th>IP</th><th>التاريخ</th></tr></thead>
                    <tbody>
                        ${tips.map(t => `<tr>
                            <td>${t.developerName || 'غير معروف'}</td>
                            <td>${t.advice}</td>
                            <td>${t.ip}</td>
                            <td>${new Date(t.createdAt).toLocaleDateString('ar-SA')}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </body></html>
        `);
    } catch (err) {
        res.status(500).send("خطأ في التحميل: " + err.message);
    }
});

const dbURI = process.env.MONGO_URI;

if (!dbURI) {
    console.error("❌ خطأ: لم يتم العثور على MONGO_URI في ملف .env!");
    process.exit(1); // إيقاف السيرفر فوراً لأن الاتصال غير آمن
}

// 2. الموديلات (Models)
const departmentsList = ['ER', 'ICU', 'Ward', 'Surgery', 'OBGYN', 'Pediatrics', 'OPD'];

const StaffAction = mongoose.model('StaffAction', new mongoose.Schema({
    type: { type: String, enum: ['Patient', 'DAMA', 'Admission', 'Nursing'] },
    department: { type: String, enum: departmentsList },
    createdAt: { type: Date, default: Date.now }
}));

const Patient = mongoose.model('Patient', new mongoose.Schema({
    name: String,
    financialType: { type: String, enum: ['Free', 'Payment', 'Insurance'] },
    companyName: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
}));

const Approval = mongoose.model('Approval', new mongoose.Schema({
    parentCompany: String,
    subCompany: String,
    count: Number,
    amount: Number,
    isClaimed: { type: Boolean, default: false }, 
    createdAt: { type: Date, default: Date.now }
}));

const Survey = mongoose.model('Survey', new mongoose.Schema({
    nurseRespect: { type: Number, min: 1, max: 4 },    
    nurseListen: { type: Number, min: 1, max: 4 },    
    docRespect: { type: Number, min: 1, max: 4 },      
    docListen: { type: Number, min: 1, max: 4 },        
    cleanliness: { type: Number, min: 1, max: 4 },    
    quietness: { type: Number, min: 1, max: 4 },        
    staffHelp: { type: Number, min: 1, max: 4 },        
    medExplain: { type: Number, min: 1, max: 4 },       
    dischargeInfo: { type: Number, min: 1, max: 4 },  
    overallRating: { type: Number, min: 0, max: 10 },
    patientComments: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
}));
// 3. محرك التصميم (الألوان المحسنة)
const getStyles = () => `
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&family=Tajawal:wght@400;700;900&display=swap');
        * { box-sizing: border-box; }
        :root { 
            --bg: #05070a; 
            --card: #0c1017; 
            --primary: #00d2ff; 
            --text: #f8fafc; 
            --accent: #00ff87; 
            --danger: #ff4d4d; 
            --warning: #ffcc00; 
            --purple: #a855f7; 
            --panel-bg: rgba(13, 20, 33, 0.9); 
            --border: rgba(255, 255, 255, 0.08);
        }
        body { background: var(--bg); color: var(--text); font-family: 'Tajawal', sans-serif; margin: 0; direction: rtl; height: 100vh; overflow: hidden; }
        .layout { display: flex; height: 100vh; width: 100vw; }
        .sidebar { width: 260px; background: #000; border-left: 1px solid var(--border); padding: 40px 20px; position: fixed; height: 100vh; right: 0; z-index: 100; overflow-y: auto; }
        .main { flex: 1; margin-right: 260px; padding: 40px; background: radial-gradient(circle at top left, #0d1421 0%, #05070a 100%); height: 100vh; overflow-y: auto; }
        .glass-card { background: var(--panel-bg); border-radius: 24px; border: 1px solid var(--border); padding: 25px; backdrop-filter: blur(20px); margin-bottom: 25px; position: relative; transition: all 0.3s ease; }
        .glass-card:hover { border-color: var(--primary); box-shadow: 0 0 20px rgba(0, 210, 255, 0.1); }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .kpi-value { font-size: 32px; font-weight: 900; font-family: 'Plus Jakarta Sans'; margin-bottom: 5px; color: #fff; }
        .kpi-label { font-size: 14px; color: #94a3b8; font-weight: 700; }
        .nav-link { display: flex; align-items: center; padding: 14px 18px; color: #94a3b8; text-decoration: none; border-radius: 14px; margin-bottom: 8px; font-weight: 700; transition: 0.3s; }
        .nav-link.active { background: rgba(0, 210, 255, 0.1); color: var(--primary); border-right: 4px solid var(--primary); }
        .btn-ui { background: var(--primary); color: #000; border: none; padding: 12px 28px; border-radius: 12px; font-weight: 800; cursor: pointer; width: 100%; transition: 0.3s; }
        .btn-ui:hover { filter: brightness(1.2); }
        .btn-action { padding: 8px 12px; border-radius: 8px; font-weight: 700; cursor: pointer; border: none; margin: 2px; }
        .btn-del { background: var(--danger); color: white; }
        .btn-edit { background: var(--warning); color: black; }
        .input-custom, .cal-select { font-family: 'Tajawal'; font-size: 14px; margin-bottom: 15px; padding: 12px; border: 1px solid #334155; color: white; width: 100%; background: #0c1017; border-radius: 10px; }
        canvas { max-height: 280px !important; width: 100% !important; }
        .survey-row { background: rgba(255,255,255,0.03); padding: 20px; border-radius: 16px; margin-bottom: 15px; border: 1px solid var(--border); }
        .comment-box { background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; font-size: 13px; color: #cbd5e1; margin-top: 10px; border-right: 3px solid var(--primary); }
        .approval-table { width: 100%; border-collapse: collapse; margin-top: 20px; background: rgba(255,255,255,0.02); border-radius: 15px; overflow: hidden; }
        .approval-table th, .approval-table td { padding: 15px; text-align: center; border-bottom: 1px solid var(--border); }
        .approval-table th { background: rgba(255,255,255,0.05); color: var(--primary); }
    </style>
`;

const getSidebar = (activePage, currentMonth) => `
    <div class="sidebar">
        <div style="margin-bottom:40px; text-align:center;">
            <h2 style="color:var(--primary); font-weight:900; margin:0;">ER VISION</h2>
            <small style="color:#475569;">COMMAND CENTER 2026</small>
        </div>
        <a href="/dashboard?month=${currentMonth}" class="nav-link ${activePage==='dashboard'?'active':''}">🏠 لوحة التحكم</a>
        <a href="/patients-list" class="nav-link ${activePage==='patients'?'active':''}">👥 سجل المرضى</a>
        <a href="/departments?month=${currentMonth}" class="nav-link ${activePage==='dept'?'active':''}">🏥 الأقسام</a>
        <a href="/approvals?month=${currentMonth}" class="nav-link ${activePage==='approvals'?'active':''}">✅ الموافقات</a>
        <a href="/companies?month=${currentMonth}" class="nav-link ${activePage==='companies'?'active':''}">🏢 الشركات</a>
        <a href="/satisfaction?month=${currentMonth}" class="nav-link ${activePage==='survey'?'active':''}">📊 نتائج الرضا</a>
        <a href="/dev-tips" class="nav-link ${activePage==='dev'?'active':''}">💡 نصيحة المبرمج</a>
        <hr style="border:0; border-top:1px solid var(--border); margin:15px 0;">
        <a href="/survey-form" class="nav-link ${activePage==='survey-form'?'active':''}">📋 نموذج التقييم</a>
        <a href="/input-action" class="nav-link ${activePage==='input-act'?'active':''}">⚡ إدخال نشاط</a>
        <a href="/input-insurance" class="nav-link ${activePage==='input'?'active':''}">📝 تسجيل مريض</a>
        <a href="/input-approval" class="nav-link ${activePage==='add-app'?'active':''}">➕ إضافة موافقة</a>
        <div style="margin-top:30px; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 18px;">
            <label style="color:#94a3b8; font-size:12px;">تحديد شهر العرض:</label>
            <select class="cal-select" onchange="window.location.href='?month='+this.value">
                ${["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
                    .map((m, i) => `<option value="${i}" ${currentMonth == i ? 'selected' : ''}>${m}</option>`).join('')}
            </select>
        </div>
    </div>
`;

const getFilter = (month) => {
    const m = parseInt(month) || new Date().getMonth();
    return { createdAt: { $gte: new Date(2026, m, 1), $lt: new Date(2026, m + 1, 1) } };
};

// --- ROUTES ---

app.get('/dashboard', async (req, res) => {
    const month = req.query.month || new Date().getMonth();
    const filter = getFilter(month);
    const totalPatients = await StaffAction.countDocuments({ ...filter, type: 'Patient' });
    const totalAdmissions = await StaffAction.countDocuments({ ...filter, type: 'Admission' });
    const totalDama = await StaffAction.countDocuments({ ...filter, type: 'DAMA' });
    const approvals = await Approval.find(filter);
    const totalAmount = approvals.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalApprovalCount = approvals.reduce((acc, curr) => acc + (curr.count || 0), 0);
    const surveyStats = await Survey.aggregate([{ $match: filter }, { $group: { _id: null, avgOverall: { $avg: "$overallRating" }, count: { $sum: 1 } }}]);
    const avgScore = surveyStats[0]?.avgOverall?.toFixed(1) || 0;

    res.send(`<html dir="rtl"><head><meta charset="UTF-8">${getStyles()}</head><body>
    <div class="layout">${getSidebar('dashboard', month)}
    <div class="main">
        <h1>🚀 لوحة القيادة المركزية - 2026</h1>
        <div class="kpi-grid">
            <div class="glass-card" onclick="location.href='/departments?month=${month}'"><div class="kpi-value">${totalPatients + totalAdmissions}</div><div class="kpi-label">إجمالي العمليات الإكلينيكية</div></div>
            <div class="glass-card" onclick="location.href='/approvals?month=${month}'"><div class="kpi-value">${totalAmount.toLocaleString()}</div><div class="kpi-label">إجمالي التحصيل المالي (ر.س)</div></div>
            <div class="glass-card" onclick="location.href='/satisfaction?month=${month}'"><div class="kpi-value">${avgScore}/10</div><div class="kpi-label">متوسط رضا المرضى</div></div>
            <div class="glass-card" onclick="location.href='/departments?month=${month}'"><div class="kpi-value" style="color:var(--danger)">${totalDama}</div><div class="kpi-label">حالات الخروج (DAMA)</div></div>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 25px;">
            <div class="glass-card"><h3>🔔 التنبيهات الفورية</h3>
                <div style="padding: 12px; border-bottom: 1px solid var(--border);"><b>الإنتاجية:</b> ${totalPatients > 50 ? 'مستوى نشاط مرتفع.' : 'مستوى النشاط طبيعي.'}</div>
                <div style="padding: 12px; border-bottom: 1px solid var(--border);"><b>المالية:</b> تم إنجاز ${totalApprovalCount} موافقة.</div>
                <div style="padding: 12px;"><b>الجودة:</b> ${avgScore >= 7 ? 'مؤشرات الرضا ممتازة.' : 'تنبيه: مراجعة تجربة المريض مطلوبة.'}</div>
            </div>
            <div class="glass-card"><h3>📋 ملخص الأداء الشهري</h3>
                <p style="color:#94a3b8; font-size:14px;">يستعرض هذا النظام تدفق العمليات، الموافقات، وجودة الرعاية.</p>
                <div style="margin-top:20px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;"><span>حالات التنويم (Admission)</span><b>${totalAdmissions}</b></div>
                    <div style="display:flex; justify-content:space-between;"><span>إجمالي استبيانات الجودة</span><b>${surveyStats[0]?.count || 0}</b></div>
                </div>
            </div>
        </div>
    </div></div></body></html>`);
});

app.get('/dev-tips', (req, res) => {
    res.send(`<html dir="rtl"><head><meta charset="UTF-8">${getStyles()}</head><body>
    <div class="layout">${getSidebar('dev', new Date().getMonth())}
    <div class="main">
        <div class="glass-card" style="max-width:600px; margin:auto;">
            <h1>💡 شاركنا رأيك</h1>
            <form action="/api/add-dev-tip" method="POST">
                <input type="text" name="developerName" class="input-custom" placeholder="الاسم" required>
                <label>هل أفادك الموقع؟</label>
                <select name="isHelpful" class="cal-select"><option>نعم</option><option>لا</option></select>
                <label>صفتك الوظيفية:</label>
                <select name="role" class="cal-select">
                    <option>موظف تأمين</option><option>مدير مستشفى</option><option>مدير مناوب</option><option>شخص آخر</option>
                </select>
                <input type="text" name="advice" class="input-custom" placeholder="نصيحة " required>
                <button type="submit" class="btn-ui">إرسال التقييم ✅</button>
            </form>
        </div>
    </div></div></body></html>`);
});
app.post('/api/add-dev-tip', async (req, res) => {
    // الآن المتغير requestIp معرف ومتاح
    const clientIp = requestIp.getClientIp(req); 
    const geo = geoip.lookup(clientIp);
    const locationInfo = geo ? `${geo.city}, ${geo.country}` : 'غير معروف';
    
    await DevAdvice.create({
        ...req.body,
        ip: clientIp,
        location: locationInfo,
        userAgent: req.headers['user-agent']
    });
    res.redirect('/dev-tips');
});

// --- إكمال بقية مساراتك الأصلية دون تغيير ---

app.get('/patients-list', async (req, res) => {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.send(`<html dir="rtl"><head><meta charset="UTF-8">${getStyles()}</head><body><div class="layout">${getSidebar('patients', new Date().getMonth())}<div class="main"><h1>👥 سجل المرضى</h1><div class="glass-card"><table class="approval-table"><thead><tr><th>الاسم</th><th>النوع المالي</th><th>الشركة</th><th>الإجراءات</th></tr></thead><tbody>${patients.map(p => `<tr><td>${p.name}</td><td>${p.financialType}</td><td>${p.companyName}</td><td><a href="/edit-patient/${p._id}" class="btn-action btn-edit">تعديل</a><form action="/api/delete-patient/${p._id}" method="POST" style="display:inline;"><button type="submit" class="btn-action btn-del" onclick="return confirm('هل أنت متأكد؟')">حذف</button></form></td></tr>`).join('')}</tbody></table></div></div></div></body></html>`);
});

app.get('/edit-patient/:id', async (req, res) => {
    const p = await Patient.findById(req.params.id);
    res.send(`<html dir="rtl"><head><meta charset="UTF-8">${getStyles()}</head><body><div class="layout">${getSidebar('patients', new Date().getMonth())}<div class="main"><div class="glass-card" style="max-width:500px; margin:auto;"><h2>✏️ تعديل بيانات مريض</h2><form action="/api/update-patient/${p._id}" method="POST"><input type="text" name="name" class="input-custom" value="${p.name}" required><select name="financialType" class="cal-select"><option value="Insurance" ${p.financialType=='Insurance'?'selected':''}>تأمين</option><option value="Payment" ${p.financialType=='Payment'?'selected':''}>كاش</option><option value="Free" ${p.financialType=='Free'?'selected':''}>مجاني</option></select><input type="text" name="companyName" class="input-custom" value="${p.companyName}"><button type="submit" class="btn-ui">تحديث البيانات 🔄</button></form></div></div></div></body></html>`);
});

app.post('/api/update-patient/:id', async (req, res) => {
    await Patient.findByIdAndUpdate(req.params.id, req.body);
    res.redirect('/patients-list');
});

app.post('/api/delete-patient/:id', async (req, res) => {
    await Patient.findByIdAndDelete(req.params.id);
    res.redirect('/patients-list');
});

app.get('/approvals', async (req, res) => {
    const month = req.query.month || new Date().getMonth();
    const approvals = await Approval.find(getFilter(month));
    const totalCount = approvals.reduce((acc, curr) => acc + (curr.count || 0), 0);
    const totalAmount = approvals.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    res.send(`<html dir="rtl"><head><meta charset="UTF-8">${getStyles()}</head><body><div class="layout">${getSidebar('approvals', month)}<div class="main"><h1>✅ مركز الموافقات</h1><div class="glass-card"><table class="approval-table"><thead><tr><th>الشركة الأم</th><th>الشركة</th><th>العدد</th><th>المبلغ</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>${approvals.map(a => `<tr><td>${a.parentCompany}</td><td>${a.subCompany}</td><td>${a.count}</td><td>${a.amount}</td><td>${a.isClaimed ? '✅ تم الرفع' : '⏳ معلق'}</td><td><a href="/edit-approval/${a._id}" class="btn-action btn-edit">تعديل</a><form action="/api/delete-approval/${a._id}" method="POST" style="display:inline;"><button type="submit" class="btn-action btn-del" onclick="return confirm('هل أنت متأكد؟')">حذف</button></form></td></tr>`).join('')}</tbody></table><div style="padding: 20px; background: rgba(0,210,255,0.1); border-radius: 10px; margin-top: 15px; text-align: center;"><h3 style="margin:0;">مجموع الموافقات: ${totalCount}</h3><p style="margin:5px 0 0 0; color: var(--primary);">إجمالي المبلغ: ${totalAmount} ريال</p></div></div></div></div></body></html>`);
});

app.get('/input-approval', (req, res) => {
    res.send(`<html dir="rtl"><head><meta charset="UTF-8">${getStyles()}</head><body><div class="layout">${getSidebar('add-app', new Date().getMonth())}<div class="main"><div class="glass-card" style="max-width:500px; margin:auto;"><h2>➕ تسجيل موافقة جديدة</h2><form action="/api/add-approval" method="POST"><input type="text" name="parentCompany" class="input-custom" placeholder="الشركة الأم" required><input type="text" name="subCompany" class="input-custom" placeholder="الشركة" required><input type="number" name="count" class="input-custom" placeholder="عدد الموافقات" required><input type="number" name="amount" class="input-custom" placeholder="المبلغ (بالريال)" required><label style="display:block; margin-bottom:5px;">حالة المطالبة:</label><select name="isClaimed" class="cal-select"><option value="false">معلق</option><option value="true">تم الرفع</option></select><button type="submit" class="btn-ui">حفظ البيانات ✅</button></form></div></div></div></body></html>`);
});

app.get('/edit-approval/:id', async (req, res) => {
    const appData = await Approval.findById(req.params.id);
    res.send(`<html dir="rtl"><head><meta charset="UTF-8">${getStyles()}</head><body><div class="layout">${getSidebar('approvals', new Date().getMonth())}<div class="main"><div class="glass-card" style="max-width:500px; margin:auto;"><h2>✏️ تعديل الموافقة</h2><form action="/api/update-approval/${appData._id}" method="POST"><input type="text" name="parentCompany" class="input-custom" value="${appData.parentCompany}" required><input type="text" name="subCompany" class="input-custom" value="${appData.subCompany}" required><input type="number" name="count" class="input-custom" value="${appData.count}" required><input type="number" name="amount" class="input-custom" value="${appData.amount}" required><select name="isClaimed" class="cal-select"><option value="false" ${!appData.isClaimed ? 'selected' : ''}>معلق</option><option value="true" ${appData.isClaimed ? 'selected' : ''}>تم الرفع</option></select><button type="submit" class="btn-ui">تحديث البيانات 🔄</button></form></div></div></div></body></html>`);
});

app.post('/api/add-approval', async (req, res) => { 
    const data = { ...req.body, isClaimed: req.body.isClaimed === 'true' };
    await Approval.create(data); 
    res.redirect('/approvals'); 
});

app.post('/api/update-approval/:id', async (req, res) => {
    const data = { ...req.body, isClaimed: req.body.isClaimed === 'true' };
    await Approval.findByIdAndUpdate(req.params.id, data);
    res.redirect('/approvals');
});

app.post('/api/delete-approval/:id', async (req, res) => {
    await Approval.findByIdAndDelete(req.params.id);
    res.redirect('/approvals');
});

app.get('/satisfaction', async (req, res) => {
    const month = req.query.month || new Date().getMonth();
    const filter = getFilter(month);
    const surveys = await Survey.find(filter).sort({createdAt: -1}).limit(5);
    const statsArray = await Survey.aggregate([{ $match: filter }, { $group: { _id: null, avgNurses: { $avg: { $cond: [{ $eq: ["$nurseRespect", 4] }, 100, 0] } }, avgDocs: { $avg: { $cond: [{ $eq: ["$docRespect", 4] }, 100, 0] } }, avgClean: { $avg: { $cond: [{ $eq: ["$cleanliness", 4] }, 100, 0] } }, avgMeds: { $avg: { $cond: [{ $eq: ["$medExplain", 4] }, 100, 0] } }, avgHelp: { $avg: { $cond: [{ $eq: ["$staffHelp", 4] }, 100, 0] } }, avgOverall: { $avg: "$overallRating" }, count: { $sum: 1 } }}]);
    const s = statsArray[0] || { avgNurses:0, avgDocs:0, avgClean:0, avgMeds:0, avgHelp:0, avgOverall:0, count:0 };
    const avgScore = Number(s.avgOverall);
    const isLowSatisfaction = s.count > 0 && avgScore < 7;
    const warningBox = isLowSatisfaction ? `
        <div class="glass-card" style="border-right: 4px solid var(--danger); background: rgba(255, 77, 77, 0.05);">
            <h3 style="color: var(--danger); margin-top:0;">⚠️ تنبيه: مستوى رضا المرضى منخفض</h3>
            <p>التقييم الحالي (${avgScore.toFixed(1)}/10) أقل من المعدل المستهدف.</p>
        </div>` : '';
    res.send(`<html dir="rtl"><head><meta charset="UTF-8"><script src="https://cdn.jsdelivr.net/npm/chart.js"></script>${getStyles()}</head><body><div class="layout">${getSidebar('survey', month)}<div class="main"><h1>📊 تحليل تجربة المريض</h1>
    ${warningBox}
    <div class="kpi-grid">
        <div class="glass-card" style="border-right: 4px solid ${isLowSatisfaction ? 'var(--danger)' : 'var(--accent)'};">
            <div class="kpi-value" style="color:${isLowSatisfaction ? 'var(--danger)' : 'var(--accent)'};">${avgScore.toFixed(1)}/10</div>
            <div class="kpi-label">التقييم العام</div>
        </div>
        <div class="glass-card" style="border-right: 4px solid var(--primary);"><div class="kpi-value" style="color:var(--primary);">${s.count}</div><div class="kpi-label">إجمالي الاستبيانات</div></div>
    </div>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:25px;"><div class="glass-card" style="min-height:400px;"><h3>📈 مؤشرات الجودة (%)</h3><canvas id="qualityChart"></canvas></div><div class="glass-card"><h3>💬 آخر الملاحظات</h3>${surveys.filter(sv => sv.patientComments).map(sv => `<div class="comment-box">"${sv.patientComments}"</div>`).join('') || '<p>لا توجد ملاحظات.</p>'}</div></div></div></div><script>new Chart(document.getElementById('qualityChart'), { type: 'radar', data: { labels: ['التمريض', 'الأطباء', 'النظافة', 'الأدوية', 'المساعدة'], datasets: [{ label: 'الرضا', data: [${s.avgNurses.toFixed(1)}, ${s.avgDocs.toFixed(1)}, ${s.avgClean.toFixed(1)}, ${s.avgMeds.toFixed(1)}, ${s.avgHelp.toFixed(1)}], borderColor: '#00d2ff', backgroundColor: 'rgba(0, 210, 255, 0.2)' }] }, options: { maintainAspectRatio: false, scales: { r: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, pointLabels: { color: '#94A3B8' } } } } });</script></body></html>`);
});

app.get('/departments', async (req, res) => {
    const month = req.query.month || new Date().getMonth();
    const acts = await StaffAction.find(getFilter(month));
    const stats = { totalPatients: acts.filter(a => a.type === 'Patient').length, admission: acts.filter(a => a.type === 'Admission').length, dama: acts.filter(a => a.type === 'DAMA').length, nursing: acts.filter(a => a.type === 'Nursing').length };
    let deptData = {};
    departmentsList.forEach(d => { deptData[d] = acts.filter(a => a.department === d).length; });
    res.send(`<html dir="rtl"><head><meta charset="UTF-8"><script src="https://cdn.jsdelivr.net/npm/chart.js"></script>${getStyles()}</head><body><div class="layout">${getSidebar('dept', month)}<div class="main"><h1>🏥 مراقبة الأقسام</h1><div class="kpi-grid"><div class="glass-card" style="border-right: 4px solid var(--purple);"><div class="kpi-value" style="color:var(--purple);">${stats.totalPatients}</div><div class="kpi-label">إجمالي المرضى</div></div><div class="glass-card" style="border-right: 4px solid var(--accent);"><div class="kpi-value" style="color:var(--accent);">${stats.admission}</div><div class="kpi-label">Admission</div></div><div class="glass-card" style="border-right: 4px solid var(--danger);"><div class="kpi-value" style="color:var(--danger);">${stats.dama}</div><div class="kpi-label">DAMA</div></div><div class="glass-card" style="border-right: 4px solid var(--warning);"><div class="kpi-value" style="color:var(--warning);">${stats.nursing}</div><div class="kpi-label">إجمالي التمريض</div></div></div><div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:25px;"><div class="glass-card" style="min-height:400px;"><h3>📊 توزيع الحالات</h3><canvas id="deptChart"></canvas></div><div class="glass-card"><h3>📋 القائمة</h3>${departmentsList.map(d => `<div style="display:flex; justify-content:space-between; padding:12px; background:rgba(255,255,255,0.02); margin-bottom:8px; border-radius:10px;"><b>${d}</b><span>${deptData[d]} حالة</span></div>`).join('')}</div></div></div></div><script>new Chart(document.getElementById('deptChart'), { type: 'doughnut', data: { labels: ${JSON.stringify(departmentsList)}, datasets: [{ data: ${JSON.stringify(departmentsList.map(d => deptData[d]))}, backgroundColor: ['#00d2ff', '#00ff87', '#ffcc00', '#ff4d4d', '#a855f7'], borderWidth: 0 }] }, options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94A3B8' } } } } });</script></body></html>`);
});

app.get('/companies', async (req, res) => {
    const month = req.query.month || new Date().getMonth();
    const patients = await Patient.find(getFilter(month));
    const stats = { total: patients.length, insurance: patients.filter(p => p.financialType === 'Insurance').length, cash: patients.filter(p => p.financialType === 'Payment').length, free: patients.filter(p => p.financialType === 'Free').length };
    let compStats = {};
    patients.forEach(p => { if(p.financialType === 'Insurance') { const name = p.companyName || 'غير محدد'; compStats[name] = (compStats[name] || 0) + 1; } });
    const sorted = Object.entries(compStats).sort((a,b) => b[1]-a[1]);
    res.send(`<html dir="rtl"><head><meta charset="UTF-8"><script src="https://cdn.jsdelivr.net/npm/chart.js"></script>${getStyles()}</head><body><div class="layout">${getSidebar('companies', month)}<div class="main"><h1>🏢 مراقبة الشركات</h1><div class="kpi-grid"><div class="glass-card" style="border-right: 4px solid var(--primary);"><div class="kpi-value">${stats.total}</div><div class="kpi-label">إجمالي المرضى</div></div><div class="glass-card" style="border-right: 4px solid var(--accent);"><div class="kpi-value" style="color:var(--accent);">${stats.insurance}</div><div class="kpi-label">تأمين</div></div><div class="glass-card" style="border-right: 4px solid var(--warning);"><div class="kpi-value" style="color:var(--warning);">${stats.cash}</div><div class="kpi-label">كاش</div></div><div class="glass-card" style="border-right: 4px solid var(--danger);"><div class="kpi-value" style="color:var(--danger);">${stats.free}</div><div class="kpi-label">مجاني</div></div></div><div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:25px;"><div class="glass-card" style="min-height:400px;"><h3>📊 أعلى الشركات</h3><canvas id="compChart"></canvas></div><div class="glass-card"><h3>📋 القائمة</h3>${sorted.map(e => `<div style="display:flex; justify-content:space-between; padding:12px; background:rgba(255,255,255,0.02); margin-bottom:8px; border-radius:10px;"><b>${e[0]}</b><span>${e[1]} حالة</span></div>`).join('')}</div></div></div></div><script>new Chart(document.getElementById('compChart'), { type: 'bar', data: { labels: ${JSON.stringify(sorted.slice(0,7).map(e=>e[0]))}, datasets: [{ label: 'المرضى', data: ${JSON.stringify(sorted.slice(0,7).map(e=>e[1]))}, backgroundColor: '#00ff87' }] }, options: { maintainAspectRatio: false, scales: { y: { ticks: { color: '#94A3B8' } }, x: { ticks: { color: '#94A3B8' } } } } });</script></body></html>`);
});

app.get('/survey-form', (req, res) => {
    const q = [{ id: 'nurseRespect', q: 'لطف واحترام طاقم التمريض' }, { id: 'nurseListen', q: 'استماع طاقم التمريض لك بعناية' }, { id: 'docRespect', q: 'لطف واحترام الأطباء' }, { id: 'docListen', q: 'استماع الأطباء لك بعناية' }, { id: 'cleanliness', q: 'نظافة الغرفة والحمام' }, { id: 'quietness', q: 'الهدوء في المنطقة المحيطة ليلاً' }, { id: 'staffHelp', q: 'الحصول على المساعدة بمجرد حاجتك إليها' }, { id: 'medExplain', q: 'شرح الغرض من الأدوية الجديدة' }, { id: 'dischargeInfo', q: 'تلقي معلومات مكتوبة عن أعراض ما بعد الخروج' }];
    res.send(`<html dir="rtl"><head><meta charset="UTF-8">${getStyles()}</head><body><div class="layout">${getSidebar('survey-form', new Date().getMonth())}<div class="main"><div class="glass-card" style="max-width:700px; margin:auto;"><h2>📋 استبيان جودة الرعاية</h2><form action="/api/add-survey" method="POST">${q.map(f => `<div class="survey-row"><label>${f.q}</label><br><input type="radio" name="${f.id}" value="1" required> مطلقاً <input type="radio" name="${f.id}" value="2"> أحياناً <input type="radio" name="${f.id}" value="3"> عادةً <input type="radio" name="${f.id}" value="4"> دائماً</div>`).join('')}<textarea name="patientComments" class="input-custom" placeholder="ملاحظات إضافية..."></textarea><input type="number" name="overallRating" class="input-custom" placeholder="التقييم العام (من 10)" required><button type="submit" class="btn-ui">إرسال التقييم ✅</button></form></div></div></div></body></html>`);
});

app.get('/input-action', async (req, res) => {
    const actions = await StaffAction.find().sort({createdAt: -1}).limit(10);
    res.send(`<html dir="rtl"><head><meta charset="UTF-8">${getStyles()}</head><body><div class="layout">${getSidebar('input-act', new Date().getMonth())}<div class="main"><div class="glass-card" style="max-width:500px; margin:auto;"><h2>⚡ إضافة نشاط</h2><form action="/api/add-action" method="POST"><input type="date" name="date" class="input-custom" value="${new Date().toISOString().split('T')[0]}" required><select name="department" class="cal-select">${departmentsList.map(d=>`<option>${d}</option>`).join('')}</select><select name="type" class="cal-select"><option>Patient</option><option>Admission</option><option>DAMA</option><option>Nursing</option></select><input type="number" name="count" value="1" class="input-custom"><button type="submit" class="btn-ui">حفظ ✅</button></form></div><div class="glass-card"><table class="approval-table"><thead><tr><th>القسم</th><th>النوع</th><th>التاريخ</th><th>حذف</th></tr></thead><tbody>${actions.map(a => `<tr><td>${a.department}</td><td>${a.type}</td><td>${a.createdAt.toLocaleDateString()}</td><td><form action="/api/delete-action/${a._id}" method="POST"><button type="submit" class="btn-action btn-del">حذف</button></form></td></tr>`).join('')}</tbody></table></div></div></div></body></html>`);
});

app.get('/input-insurance', (req, res) => {
    res.send(`<html dir="rtl"><head><meta charset="UTF-8">${getStyles()}</head><body><div class="layout">${getSidebar('input', new Date().getMonth())}<div class="main"><div class="glass-card" style="max-width:500px; margin:auto;"><h2>📝 تسجيل مريض</h2><form action="/api/add-patient" method="POST"><input type="date" name="date" class="input-custom" value="${new Date().toISOString().split('T')[0]}" required><input type="text" name="name" class="input-custom" placeholder="اسم المريض" required><select name="financialType" class="cal-select"><option value="Insurance">تأمين</option><option value="Payment">كاش</option><option value="Free">مجاني</option></select><input type="text" name="companyName" class="input-custom" placeholder="اسم الشركة"><button type="submit" class="btn-ui">تسجيل ✅</button></form></div></div></div></body></html>`);
});
app.get('/admin-dev', async (req, res) => {
    // جلب كل البيانات من قاعدة البيانات
    const tips = await DevAdvice.find().sort({ createdAt: -1 });

    res.send(`
        <html dir="rtl"><head><meta charset="UTF-8">${getStyles()}
        <style>
            .dev-panel { background: #0c1017; padding: 30px; border-radius: 20px; border: 1px solid var(--primary); }
            .data-table { width: 100%; border-collapse: collapse; margin-top: 20px; color: #fff; }
            .data-table th, .data-table td { padding: 12px; border: 1px solid var(--border); text-align: right; }
            .data-table th { background: rgba(0, 210, 255, 0.1); color: var(--primary); }
        </style>
        </head><body>
        <div class="layout" style="padding: 40px; overflow-y: auto;">
            <div class="dev-panel" style="width: 100%; max-width: 1100px; margin: auto;">
                <h1 style="color:var(--primary);">🛡️ لوحة التحكم البرمجية (Full Audit)</h1>
                
                <h3>📋 سجل المستخدمين والإحصائيات</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>الاسم</th>
                            <th>الاستفادة</th>
                            <th>الصفة</th>
                            <th>النصيحة/التعليق</th>
                            <th>IP</th>
                            <th>الموقع</th>
                            <th>التاريخ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tips.map(t => `<tr>
                            <td>${t.developerName}</td>
                            <td>${t.isHelpful}</td>
                            <td>${t.role}</td>
                            <td>${t.advice}<br><small style="color:#64748b;">${t.comment || ''}</small></td>
                            <td style="font-family:monospace; color:var(--accent);">${t.ip || 'N/A'}</td>
                            <td>${t.location || 'غير محدد'}</td>
                            <td style="font-size:11px;">${t.createdAt.toLocaleString('ar-SA')}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div></body></html>
    `);
});

// موديل للملاحظات الخاصة بالمبرمج
const DevNote = mongoose.model('DevNote', new mongoose.Schema({
    note: String,
    createdAt: { type: Date, default: Date.now }
}));

app.post('/api/admin/add-note', async (req, res) => {
    await DevNote.create({ note: req.body.note });
    res.redirect('/admin-dev');
});
app.post('/api/add-survey', async (req, res) => { await Survey.create(req.body); res.redirect('/satisfaction'); });
app.post('/api/delete-survey/:id', async (req, res) => { await Survey.findByIdAndDelete(req.params.id); res.redirect('/satisfaction'); });
app.post('/api/add-action', async (req, res) => {
    const { department, type, count, date } = req.body;
    const actions = Array(parseInt(count) || 1).fill({ department, type, createdAt: new Date(date) });
    await StaffAction.insertMany(actions);
    res.redirect('/input-action');
});
app.post('/api/delete-action/:id', async (req, res) => { await StaffAction.findByIdAndDelete(req.params.id); res.redirect('/input-action'); });
app.post('/api/add-patient', async (req, res) => {
    const { name, financialType, companyName, date } = req.body;
    await Patient.create({ name, financialType, companyName, createdAt: new Date(date) });
    res.redirect('/companies?month=' + new Date(date).getMonth());
});

app.get('/', (req, res) => res.redirect('/dashboard'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server Running on http://localhost:${PORT}`));