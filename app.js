const DATA_URL = 'data/schools.sample.json';
const LOCAL_REVIEW_KEY = 'metroDetroitSchoolReviews';
const selectedSchools = new Set();
let schools = [];
let filteredSchools = [];

const comparisonMetrics = [
  ['sector', 'Sector'],
  ['county', 'County'],
  ['city', 'City'],
  ['sat_avg', 'SAT average'],
  ['act_avg', 'ACT average'],
  ['ap_courses', 'AP courses'],
  ['ib_offered', 'IB offered'],
  ['ap_participation_pct', 'AP/IB participation'],
  ['ap_pass_pct', 'AP exam pass rate'],
  ['college_4yr_pct', '4-year college enrollment'],
  ['college_2yr_pct', '2-year college enrollment'],
  ['trade_or_workforce_pct', 'Trade/workforce/gap'],
  ['avg_class_size', 'Average class size'],
  ['student_teacher_ratio', 'Student-teacher ratio'],
  ['tuition_usd', 'Tuition'],
  ['data_quality', 'Data quality']
];

const els = {
  schoolGrid: document.getElementById('schoolGrid'),
  searchInput: document.getElementById('searchInput'),
  sectorFilter: document.getElementById('sectorFilter'),
  countyFilter: document.getElementById('countyFilter'),
  sortBy: document.getElementById('sortBy'),
  comparisonTable: document.getElementById('comparisonTable'),
  reviewSchool: document.getElementById('reviewSchool'),
  disputeSchool: document.getElementById('disputeSchool'),
  reviewsList: document.getElementById('reviewsList'),
  reviewForm: document.getElementById('reviewForm'),
  disputeForm: document.getElementById('disputeForm'),
  metricSchoolCount: document.getElementById('metric-school-count'),
  metricReviewedCount: document.getElementById('metric-reviewed-count'),
  avgSat: document.getElementById('avgSat'),
  avgAct: document.getElementById('avgAct'),
  avgAp: document.getElementById('avgAp'),
  avgCollege: document.getElementById('avgCollege'),
  satChart: document.getElementById('satChart'),
  collegeChart: document.getElementById('collegeChart')
};

function fmtPct(value) {
  return value === null || value === undefined ? '—' : `${value}%`;
}
function fmtCurrency(value) {
  return value ? `$${Number(value).toLocaleString()}` : '—';
}
function fmtValue(key, value) {
  if (key.includes('_pct')) return fmtPct(value);
  if (key === 'tuition_usd') return fmtCurrency(value);
  if (key === 'ib_offered') return value ? 'Yes' : 'No';
  return value ?? '—';
}
function getReviews() {
  return JSON.parse(localStorage.getItem(LOCAL_REVIEW_KEY) || '[]');
}
function saveReviews(reviews) {
  localStorage.setItem(LOCAL_REVIEW_KEY, JSON.stringify(reviews));
}
function average(values) {
  const valid = values.filter(v => typeof v === 'number');
  if (!valid.length) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}

function populateSelects() {
  const counties = [...new Set(schools.map(s => s.county))].sort();
  counties.forEach(county => {
    const opt = document.createElement('option');
    opt.value = county;
    opt.textContent = county;
    els.countyFilter.appendChild(opt);
  });
  [els.reviewSchool, els.disputeSchool].forEach(select => {
    select.innerHTML = schools.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  });
}

function filterSchools() {
  const search = els.searchInput.value.trim().toLowerCase();
  const sector = els.sectorFilter.value;
  const county = els.countyFilter.value;
  const sortBy = els.sortBy.value;

  filteredSchools = schools.filter(s => {
    const matchesSearch = !search || `${s.name} ${s.city}`.toLowerCase().includes(search);
    const matchesSector = sector === 'all' || s.sector === sector;
    const matchesCounty = county === 'all' || s.county === county;
    return matchesSearch && matchesSector && matchesCounty;
  });

  filteredSchools.sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return (b[sortBy] ?? -Infinity) - (a[sortBy] ?? -Infinity);
  });

  renderSchools();
  renderAnalytics();
}

function renderSchools() {
  const reviews = getReviews();
  els.schoolGrid.innerHTML = filteredSchools.map(school => {
    const schoolReviews = reviews.filter(r => r.schoolId === school.id);
    const avgRating = schoolReviews.length ? average(schoolReviews.map(r => r.rating)) : null;
    return `
      <article class="school-card">
        <div>
          <div class="badges">
            <span class="badge">${school.sector}</span>
            <span class="badge">${school.city}</span>
            <span class="source-badge ${school.source_tier === 'official' ? 'public' : 'school'}">
              ${school.source_tier === 'official' ? 'Official/state-federal data' : 'School-reported mix'}
            </span>
          </div>
          <h3>${school.name}</h3>
          <p class="school-meta">${school.county} County · Enrollment ${school.enrollment.toLocaleString()} · ${school.school_type}</p>
        </div>
        <div class="detail-grid">
          <div class="detail"><span>SAT average</span><strong>${fmtValue('sat_avg', school.sat_avg)}</strong></div>
          <div class="detail"><span>ACT average</span><strong>${fmtValue('act_avg', school.act_avg)}</strong></div>
          <div class="detail"><span>AP/IB participation</span><strong>${fmtPct(school.ap_participation_pct)}</strong></div>
          <div class="detail"><span>4-year college</span><strong>${fmtPct(school.college_4yr_pct)}</strong></div>
          <div class="detail"><span>AP courses</span><strong>${fmtValue('ap_courses', school.ap_courses)}</strong></div>
          <div class="detail"><span>IB offered</span><strong>${school.ib_offered ? 'Yes' : 'No'}</strong></div>
        </div>
        <p class="source-note">Top colleges: ${school.top_colleges.join(', ')}</p>
        <p class="source-note">Reviews: ${schoolReviews.length ? `${avgRating}★ average from ${schoolReviews.length}` : 'No reviews yet'}</p>
        <div class="actions">
          <button class="primary-btn" data-action="toggle-compare" data-id="${school.id}">${selectedSchools.has(school.id) ? 'Remove from compare' : 'Add to compare'}</button>
          <button class="ghost-btn" data-action="seed-dispute" data-id="${school.id}">Report data issue</button>
        </div>
      </article>
    `;
  }).join('');

  els.metricSchoolCount.textContent = filteredSchools.length;
  const reviewedSchoolIds = new Set(reviews.map(r => r.schoolId));
  els.metricReviewedCount.textContent = reviewedSchoolIds.size;
}

function renderComparisonTable() {
  const selected = schools.filter(s => selectedSchools.has(s.id));
  const theadRow = els.comparisonTable.querySelector('thead tr');
  const tbody = els.comparisonTable.querySelector('tbody');
  theadRow.innerHTML = '<th>Metric</th>' + selected.map(s => `<th>${s.name}</th>`).join('');
  tbody.innerHTML = comparisonMetrics.map(([key, label]) => `
    <tr>
      <td>${label}</td>
      ${selected.map(s => `<td>${Array.isArray(s[key]) ? s[key].join(', ') : fmtValue(key, s[key])}</td>`).join('')}
    </tr>
  `).join('');
}

function renderReviews() {
  const selectedSchoolId = els.reviewSchool.value;
  const reviews = getReviews().filter(r => !selectedSchoolId || r.schoolId === selectedSchoolId);
  els.reviewsList.innerHTML = reviews.length ? reviews.slice().reverse().map(review => {
    const school = schools.find(s => s.id === review.schoolId);
    return `
      <article class="review-card">
        <div class="review-meta"><strong>${review.reviewer}</strong><span>${school?.name || 'Unknown school'} · ${review.rating}★ · ${review.date}</span></div>
        <p>${review.body}</p>
      </article>
    `;
  }).join('') : '<p class="muted">No reviews yet for this school.</p>';
}

function renderAnalytics() {
  els.avgSat.textContent = average(filteredSchools.map(s => s.sat_avg)) ?? '—';
  els.avgAct.textContent = average(filteredSchools.map(s => s.act_avg)) ?? '—';
  els.avgAp.textContent = fmtPct(average(filteredSchools.map(s => s.ap_participation_pct)));
  els.avgCollege.textContent = fmtPct(average(filteredSchools.map(s => s.college_4yr_pct)));
  drawBarChart(els.satChart, filteredSchools.slice(0, 8), 'sat_avg', 1600);
  drawStackedChart(els.collegeChart, filteredSchools.slice(0, 8));
}

function drawBarChart(canvas, items, key, maxValue) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#102039';
  ctx.font = '12px Inter';
  const margin = { top: 20, right: 20, bottom: 70, left: 40 };
  const chartW = canvas.width - margin.left - margin.right;
  const chartH = canvas.height - margin.top - margin.bottom;
  const barWidth = chartW / Math.max(items.length, 1) - 12;

  ctx.strokeStyle = '#dce3ee';
  for (let i = 0; i <= 4; i++) {
    const y = margin.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(margin.left, y);
    ctx.lineTo(canvas.width - margin.right, y);
    ctx.stroke();
  }

  items.forEach((item, index) => {
    const value = item[key] || 0;
    const x = margin.left + index * (barWidth + 12) + 8;
    const height = (value / maxValue) * chartH;
    const y = margin.top + chartH - height;
    ctx.fillStyle = '#2457f5';
    ctx.fillRect(x, y, barWidth, height);
    ctx.fillStyle = '#102039';
    ctx.fillText(String(value), x, y - 6);
    wrapText(ctx, item.name, x, canvas.height - 44, barWidth, 14);
  });
}

function drawStackedChart(canvas, items) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const margin = { top: 20, right: 20, bottom: 70, left: 40 };
  const chartW = canvas.width - margin.left - margin.right;
  const chartH = canvas.height - margin.top - margin.bottom;
  const barWidth = chartW / Math.max(items.length, 1) - 12;
  items.forEach((item, index) => {
    const x = margin.left + index * (barWidth + 12) + 8;
    const h4 = (item.college_4yr_pct / 100) * chartH;
    const h2 = (item.college_2yr_pct / 100) * chartH;
    const hTrade = (item.trade_or_workforce_pct / 100) * chartH;
    let y = margin.top + chartH;
    [[h4, '#2457f5'], [h2, '#7aa1ff'], [hTrade, '#c7d6ff']].forEach(([h, color]) => {
      y -= h;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth, h);
    });
    ctx.fillStyle = '#102039';
    wrapText(ctx, item.name, x, canvas.height - 44, barWidth, 14);
  });
  ctx.fillStyle = '#102039';
  ctx.fillText('4-year', 44, 16);
  ctx.fillStyle = '#7aa1ff';
  ctx.fillRect(92, 7, 16, 10);
  ctx.fillStyle = '#102039';
  ctx.fillText('2-year', 122, 16);
  ctx.fillStyle = '#c7d6ff';
  ctx.fillRect(175, 7, 16, 10);
  ctx.fillStyle = '#102039';
  ctx.fillText('Trade/workforce', 205, 16);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lineY = y;
  words.forEach(word => {
    const testLine = `${line}${word} `;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, lineY);
      line = `${word} `;
      lineY += lineHeight;
    } else {
      line = testLine;
    }
  });
  ctx.fillText(line, x, lineY);
}

function seedDisputeForm(schoolId) {
  els.disputeSchool.value = schoolId;
  document.getElementById('disputeMetric').focus();
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

async function init() {
  const response = await fetch(DATA_URL);
  schools = await response.json();
  populateSelects();
  filterSchools();
  renderComparisonTable();
  renderReviews();

  [els.searchInput, els.sectorFilter, els.countyFilter, els.sortBy].forEach(el => el.addEventListener('input', filterSchools));
  els.reviewSchool.addEventListener('change', renderReviews);

  els.schoolGrid.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const id = button.dataset.id;
    if (button.dataset.action === 'toggle-compare') {
      selectedSchools.has(id) ? selectedSchools.delete(id) : selectedSchools.add(id);
      renderSchools();
      renderComparisonTable();
    }
    if (button.dataset.action === 'seed-dispute') seedDisputeForm(id);
  });

  els.reviewForm.addEventListener('submit', event => {
    event.preventDefault();
    const review = {
      schoolId: els.reviewSchool.value,
      reviewer: document.getElementById('reviewerName').value.trim(),
      rating: Number(document.getElementById('reviewRating').value),
      body: document.getElementById('reviewBody').value.trim(),
      date: new Date().toLocaleDateString()
    };
    const reviews = getReviews();
    reviews.push(review);
    saveReviews(reviews);
    els.reviewForm.reset();
    els.reviewSchool.value = review.schoolId;
    renderSchools();
    renderReviews();
  });

  els.disputeForm.addEventListener('submit', event => {
    event.preventDefault();
    const school = schools.find(s => s.id === els.disputeSchool.value);
    const reporter = document.getElementById('disputeEmail').value.trim();
    const metric = document.getElementById('disputeMetric').value.trim();
    const details = document.getElementById('disputeDetails').value.trim();
    const subject = encodeURIComponent(`Data dispute for ${school.name}: ${metric}`);
    const body = encodeURIComponent(`School: ${school.name}\nReporter: ${reporter}\nMetric: ${metric}\n\nSupporting details:\n${details}\n\nPlease review and update the site if warranted.`);
    window.location.href = `mailto:disputes@example.com?subject=${subject}&body=${body}`;
  });
}

init();
