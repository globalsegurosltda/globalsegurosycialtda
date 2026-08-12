/* ============================================================
   GLOBAL SEGUROS Y CIA LTDA — Application JavaScript
   Features:
   - Sticky navbar + mobile menu
   - Particle animation
   - Tab switching (ARIA)
   - Multi-step cotizador form with validation
   - Contact form with validation
   - EmailJS integration (real email sending)
   - Stats counter animation
   - Scroll animations (IntersectionObserver)
   - Back to top button
   - Currency formatting
   ============================================================ */

'use strict';

/* ============================================================
   EMAILJS CONFIGURATION
   ──────────────────────────────────────────────────────────
   1. Cree una cuenta gratuita en https://www.emailjs.com
   2. Reemplace los valores de abajo con los suyos.
   3. Ver guía completa en: emailjs_setup.md
   ============================================================ */
const EMAILJS_CONFIG = {
  publicKey:          'LxNwazfOeUWNc5LjP',    // Dashboard → Account → Public Key
  serviceId:          'service_eslybsc',      // Email Services → Service ID
  templateCotizador:  'template_xw6970d',     // Email Templates → Template ID (cotizaciones)
  templateContacto:   'template_iyw3poe',     // Email Templates → Template ID (contacto)
};

// ¿Están las credenciales configuradas?
const EMAILJS_READY = !Object.values(EMAILJS_CONFIG).some(v => v.startsWith('TU_'));

/* ============================================================
   1. DOM READY
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar EmailJS si las credenciales están configuradas
  if (EMAILJS_READY) {
    emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
  }

  initNavbar();
  initParticles();
  initTabSystem();
  initCotizadorForm();
  initContactForm();
  initStatsCounter();
  initScrollAnimations();
  initBackToTop();
  initFormatInputs();
});

/* ============================================================
   2. NAVBAR — sticky + mobile toggle
   ============================================================ */
function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const toggle    = document.getElementById('navToggle');
  const navLinks  = document.getElementById('navLinks');
  const navAnchors = navLinks.querySelectorAll('a');

  // Scroll → add class
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
    // Hide menu on scroll (mobile)
    if (window.innerWidth <= 768) closeMenu();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Toggle button
  toggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
  });

  // Close on link click
  navAnchors.forEach(link => {
    link.addEventListener('click', () => closeMenu());
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target)) closeMenu();
  });

  function closeMenu() {
    navLinks.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
  }
}

/* ============================================================
   3. PARTICLE ANIMATION
   ============================================================ */
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const count = window.innerWidth > 768 ? 50 : 25;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';

    const size   = Math.random() * 3 + 1;
    const left   = Math.random() * 100;
    const delay  = Math.random() * 20;
    const duration = Math.random() * 20 + 15;
    const opacity = Math.random() * 0.5 + 0.1;

    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${left}%;
      animation-delay: ${delay}s;
      animation-duration: ${duration}s;
      opacity: ${opacity};
    `;
    container.appendChild(p);
  }
}

/* ============================================================
   4. TAB SYSTEM
   ============================================================ */
function initTabSystem() {
  const tabBtns  = document.querySelectorAll('.tab-btn');
  const panels   = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      activateTab(targetTab, tabBtns, panels);
    });

    // Keyboard navigation
    btn.addEventListener('keydown', (e) => {
      const tabs = [...tabBtns];
      const idx  = tabs.indexOf(btn);
      let next;
      if (e.key === 'ArrowRight') next = tabs[(idx + 1) % tabs.length];
      if (e.key === 'ArrowLeft')  next = tabs[(idx - 1 + tabs.length) % tabs.length];
      if (next) { next.focus(); next.click(); }
    });
  });
}

function activateTab(tabName, tabBtns, panels) {
  tabBtns  = tabBtns  || document.querySelectorAll('.tab-btn');
  panels   = panels   || document.querySelectorAll('.tab-panel');

  tabBtns.forEach(b => {
    const isActive = b.dataset.tab === tabName;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-selected', String(isActive));
  });

  panels.forEach(p => {
    const isActive = p.id === `panel-${tabName}`;
    p.classList.toggle('active', isActive);
    if (isActive) {
      p.removeAttribute('hidden');
    } else {
      p.setAttribute('hidden', '');
    }
  });
}

// Exposed globally for footer links
window.switchTab = function(tabName) {
  activateTab(tabName);
};

/* ============================================================
   5. COTIZADOR — multi-step form
   ============================================================ */
let currentStep = 1;
let formData    = {};

function initCotizadorForm() {
  const form = document.getElementById('cotizadorForm');
  if (!form) return;

  // Insurance type radio → show dynamic fields
  const radios = form.querySelectorAll('input[name="tipo_seguro"]');
  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      showDynamicFields(radio.value);

      // Sync with services tabs
      activateTab(radio.value);
    });
  });

  // Form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleFormSubmit();
  });

  // Currency format for value fields
  initCurrencyInputs();
}

function showDynamicFields(tipo) {
  const groups = document.querySelectorAll('.dynamic-group');
  groups.forEach(g => g.classList.add('hidden'));
  const target = document.getElementById(`fields-${tipo}`);
  if (target) target.classList.remove('hidden');
}

function goToStep(step) {
  const currentEl = document.getElementById(`form-step-${currentStep}`);
  const nextEl    = document.getElementById(`form-step-${step}`);

  if (!nextEl) return;

  // Validate step 1
  if (currentStep === 1 && step === 2) {
    const tipoChecked = document.querySelector('input[name="tipo_seguro"]:checked');
    if (!tipoChecked) {
      showToast('Por favor seleccione un tipo de seguro', 'error');
      return;
    }
    // Collect step 1 data
    formData.tipo = tipoChecked.value;
    formData.tipoLabel = tipoChecked.closest('label').querySelector('.io-label').textContent;
    collectDynamicFields();
  }

  // Animate transition
  currentEl.classList.remove('active');
  currentEl.setAttribute('hidden', '');
  nextEl.classList.add('active');
  nextEl.removeAttribute('hidden');

  // Update indicators
  updateStepIndicators(step);
  currentStep = step;

  // Scroll cotizador into view
  document.getElementById('cotizador').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Exposed globally for onclick handlers in HTML
window.goToStep = goToStep;

function validateAndGoToStep3() {
  if (!validateStep2()) return;
  collectStep2Data();
  buildSummary();
  goToStep(3);
}
window.validateAndGoToStep3 = validateAndGoToStep3;

function validateStep2() {
  const fields = [
    { id: 'nombre-sol',   errorId: 'nombre-sol-error',   label: 'nombre',   type: 'required' },
    { id: 'cedula-sol',   errorId: 'cedula-sol-error',   label: 'cédula',   type: 'numeric'  },
    { id: 'email-sol',    errorId: 'email-sol-error',    label: 'correo',   type: 'email'    },
    { id: 'telefono-sol', errorId: 'telefono-sol-error', label: 'teléfono', type: 'phone'    },
    { id: 'ciudad-sol',   errorId: 'ciudad-sol-error',   label: 'ciudad',   type: 'required' },
  ];

  let valid = true;

  fields.forEach(f => {
    const input = document.getElementById(f.id);
    const error = document.getElementById(f.errorId);
    const value = input.value.trim();
    let msg = '';

    if (f.type === 'required' && !value) {
      msg = `El campo ${f.label} es requerido`;
    } else if (f.type === 'email' && value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) msg = 'Ingrese un correo válido';
    } else if (f.type === 'phone' && value) {
      if (!/^[0-9]{7,12}$/.test(value.replace(/\s/g, ''))) msg = 'Ingrese un teléfono válido (7-12 dígitos)';
    } else if (f.type === 'numeric' && !value) {
      msg = `El campo ${f.label} es requerido`;
    }

    if (msg) {
      error.textContent = msg;
      input.classList.add('error');
      input.setAttribute('aria-invalid', 'true');
      valid = false;
    } else {
      error.textContent = '';
      input.classList.remove('error');
      input.removeAttribute('aria-invalid');
    }
  });

  // Live validation on corrected fields
  fields.forEach(f => {
    const input = document.getElementById(f.id);
    input.addEventListener('input', () => {
      input.classList.remove('error');
      document.getElementById(f.errorId).textContent = '';
      input.removeAttribute('aria-invalid');
    }, { once: true });
  });

  return valid;
}

function collectStep2Data() {
  formData.nombre   = document.getElementById('nombre-sol').value.trim();
  formData.cedula   = document.getElementById('cedula-sol').value.trim();
  formData.email    = document.getElementById('email-sol').value.trim();
  formData.telefono = document.getElementById('telefono-sol').value.trim();
  formData.ciudad   = document.getElementById('ciudad-sol').value;
  formData.notas    = document.getElementById('notas-sol').value.trim();
}

function collectDynamicFields() {
  const tipo = formData.tipo;
  const details = {};

  if (tipo === 'autos') {
    details.marca   = document.getElementById('marca-auto')?.value || '';
    details.anio    = document.getElementById('anio-auto')?.value || '';
    details.valor   = document.getElementById('valor-auto')?.value || '';
    details.placa   = document.getElementById('placa-auto')?.value || '';
  } else if (tipo === 'cumplimiento') {
    details.tipoContrato     = document.getElementById('tipo-contrato')?.value || '';
    details.valorContrato    = document.getElementById('valor-contrato')?.value || '';
    details.plazoContrato    = document.getElementById('plazo-contrato')?.value || '';
    details.entidadContratante = document.getElementById('entidad-contratante')?.value || '';
  } else if (tipo === 'vida') {
    details.edad    = document.getElementById('edad-asegurado')?.value || '';
    details.capital = document.getElementById('capital-vida')?.value || '';
  } else if (tipo === 'arriendo') {
    details.canon     = document.getElementById('canon-arriendo')?.value || '';
    details.inmueble  = document.getElementById('tipo-inmueble')?.value || '';
    details.ciudad    = document.getElementById('ciudad-inmueble')?.value || '';
  }

  formData.details = details;
}

function buildSummary() {
  const card = document.getElementById('summaryCard');
  const tipo = formData.tipo;
  const det  = formData.details || {};

  const tipoLabels = {
    autos:        '🚗 Seguro de Autos',
    cumplimiento: '📋 Seguro de Cumplimiento',
    vida:         '❤️ Seguro de Vida',
    arriendo:     '🏠 Seguro de Arriendo',
  };

  let detailRows = '';
  if (tipo === 'autos') {
    if (det.marca)  detailRows += summaryRow('Marca', det.marca);
    if (det.anio)   detailRows += summaryRow('Año', det.anio);
    if (det.valor)  detailRows += summaryRow('Valor comercial', det.valor);
    if (det.placa)  detailRows += summaryRow('Placa', det.placa.toUpperCase());
  } else if (tipo === 'cumplimiento') {
    if (det.tipoContrato)   detailRows += summaryRow('Tipo de contrato', det.tipoContrato);
    if (det.valorContrato)  detailRows += summaryRow('Valor del contrato', det.valorContrato);
    if (det.plazoContrato)  detailRows += summaryRow('Plazo', det.plazoContrato);
    if (det.entidadContratante) detailRows += summaryRow('Entidad', det.entidadContratante);
  } else if (tipo === 'vida') {
    if (det.edad)   detailRows += summaryRow('Edad', `${det.edad} años`);
    if (det.capital) detailRows += summaryRow('Capital asegurado', det.capital);
  } else if (tipo === 'arriendo') {
    if (det.canon)   detailRows += summaryRow('Canon mensual', det.canon);
    if (det.inmueble) detailRows += summaryRow('Tipo de inmueble', det.inmueble);
    if (det.ciudad)  detailRows += summaryRow('Ciudad', det.ciudad);
  }

  card.innerHTML = `
    ${summaryRow('Tipo de seguro', tipoLabels[tipo] || tipo)}
    ${detailRows}
    <div class="summary-row" style="padding-top:12px;margin-top:4px;border-top:1px solid rgba(255,255,255,.12);">
      <span style="color:rgba(255,255,255,.4);font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em">Solicitante</span>
    </div>
    ${summaryRow('Nombre', formData.nombre)}
    ${summaryRow('Cédula', formData.cedula)}
    ${summaryRow('Correo', formData.email)}
    ${summaryRow('Teléfono', formData.telefono)}
    ${summaryRow('Ciudad', formData.ciudad)}
    ${formData.notas ? summaryRow('Notas', formData.notas) : ''}
  `;
}

function summaryRow(label, value) {
  if (!value) return '';
  return `<div class="summary-row"><span>${label}</span><span>${escapeHtml(value)}</span></div>`;
}

function updateStepIndicators(activeStep) {
  for (let i = 1; i <= 3; i++) {
    const ind = document.getElementById(`step-indicator-${i}`);
    ind.classList.remove('active', 'done');
    if (i === activeStep)      ind.classList.add('active');
    else if (i < activeStep)   ind.classList.add('done');
  }

  // Lines
  const lines = document.querySelectorAll('.step-line');
  lines.forEach((line, idx) => {
    line.classList.toggle('done', activeStep > idx + 1);
  });

  // Update aria
  const progressBar = document.querySelector('.steps-indicator');
  if (progressBar) progressBar.setAttribute('aria-valuenow', activeStep);
}

function handleFormSubmit() {
  const termsCheck = document.getElementById('acepta-terminos');
  if (!termsCheck.checked) {
    showToast('Por favor acepte la política de privacidad', 'error');
    return;
  }

  const submitBtn = document.getElementById('submitBtn');
  const btnText   = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');

  // Estado de carga
  submitBtn.disabled  = true;
  btnText.textContent = 'Enviando...';
  btnLoader.removeAttribute('hidden');

  const det = formData.details || {};
  const tipoLabels = {
    autos:        'Seguro de Autos',
    cumplimiento: 'Seguro de Cumplimiento',
    vida:         'Seguro de Vida',
    arriendo:     'Seguro de Arriendo',
  };

  // Construir detalles del seguro como texto plano
  let detalleSeguro = '';
  if (formData.tipo === 'autos') {
    detalleSeguro = [
      det.marca  ? `Marca: ${det.marca}`    : '',
      det.anio   ? `Año: ${det.anio}`       : '',
      det.valor  ? `Valor: $${det.valor} COP` : '',
      det.placa  ? `Placa: ${det.placa}`    : '',
    ].filter(Boolean).join(' | ');
  } else if (formData.tipo === 'cumplimiento') {
    detalleSeguro = [
      det.tipoContrato      ? `Tipo contrato: ${det.tipoContrato}`      : '',
      det.valorContrato     ? `Valor: $${det.valorContrato} COP`          : '',
      det.plazoContrato     ? `Plazo: ${det.plazoContrato}`               : '',
      det.entidadContratante? `Entidad: ${det.entidadContratante}`        : '',
    ].filter(Boolean).join(' | ');
  } else if (formData.tipo === 'vida') {
    detalleSeguro = [
      det.edad    ? `Edad: ${det.edad} años`    : '',
      det.capital ? `Capital: ${det.capital}`   : '',
    ].filter(Boolean).join(' | ');
  } else if (formData.tipo === 'arriendo') {
    detalleSeguro = [
      det.canon    ? `Canon: $${det.canon} COP`  : '',
      det.inmueble ? `Inmueble: ${det.inmueble}` : '',
      det.ciudad   ? `Ciudad: ${det.ciudad}`     : '',
    ].filter(Boolean).join(' | ');
  }

  const fechaHora = new Date().toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // Parámetros que llenarán la plantilla EmailJS
  const templateParams = {
    // Datos del solicitante
    from_name:     formData.nombre,
    from_email:    formData.email,
    from_phone:    formData.telefono,
    from_cedula:   formData.cedula,
    from_city:     formData.ciudad,
    from_notes:    formData.notas || 'Ninguna',
    // Seguro
    seguro_tipo:   tipoLabels[formData.tipo] || formData.tipo,
    seguro_detail: detalleSeguro || 'Sin información adicional',
    // Meta
    fecha_hora:    fechaHora,
    // Destinatario (para confirmación al cliente)
    to_name:       formData.nombre,
    reply_to:      formData.email,
  };

  const doShowSuccess = () => {
    document.getElementById('cotizadorForm').setAttribute('hidden', '');
    document.getElementById('cotizadorForm').classList.remove('active');
    const success = document.getElementById('formSuccess');
    success.removeAttribute('hidden');
    const detEl = document.getElementById('successDetails');
    detEl.innerHTML = `
      <div class="summary-row"><span>Nombre</span><span>${escapeHtml(formData.nombre)}</span></div>
      <div class="summary-row"><span>Correo</span><span>${escapeHtml(formData.email)}</span></div>
      <div class="summary-row"><span>Seguro</span><span>${escapeHtml(tipoLabels[formData.tipo] || formData.tipo)}</span></div>
    `;
    submitBtn.disabled  = false;
    btnText.textContent = 'Enviar solicitud de cotización';
    btnLoader.setAttribute('hidden', '');
  };

  if (!EMAILJS_READY) {
    // Modo demo: simular envío si no hay credenciales configuradas
    console.warn('⚠️ EmailJS no configurado — simulando envío. Configure EMAILJS_CONFIG en app.js');
    setTimeout(() => {
      doShowSuccess();
      showToast('⚠️ Modo demo: configure EmailJS para envío real', 'info');
    }, 1200);
    return;
  }

  // Envío real con EmailJS
  emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateCotizador, templateParams)
    .then(() => {
      doShowSuccess();
      showToast('¡Solicitud enviada con éxito!', 'success');
    })
    .catch((err) => {
      console.error('EmailJS error (cotizador):', err);
      submitBtn.disabled  = false;
      btnText.textContent = 'Enviar solicitud de cotización';
      btnLoader.setAttribute('hidden', '');
      showToast('❌ Error al enviar. Inténtelo de nuevo o llámenos directamente.', 'error');
    });
}

function resetForm() {
  const form = document.getElementById('cotizadorForm');
  form.reset();
  form.removeAttribute('hidden');
  document.getElementById('formSuccess').setAttribute('hidden', '');

  // Reset to step 1
  currentStep = 1;
  const steps = document.querySelectorAll('.form-step');
  steps.forEach((s, i) => {
    s.classList.remove('active');
    if (i > 0) s.setAttribute('hidden', '');
  });
  steps[0].classList.add('active');
  steps[0].removeAttribute('hidden');
  updateStepIndicators(1);

  // Reset data
  formData = {};
  document.querySelectorAll('.dynamic-group').forEach(g => g.classList.add('hidden'));
}
window.resetForm = resetForm;

/* ============================================================
   6. CONTACT FORM — con EmailJS
   ============================================================ */
function initContactForm() {
  const form = document.getElementById('contactoForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateContactForm()) return;

    const btn     = document.getElementById('contactSubmitBtn');
    const btnSpan = btn.querySelector('span');
    btn.disabled    = true;
    btnSpan.textContent = 'Enviando...';

    const fechaHora = new Date().toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const templateParams = {
      from_name:    document.getElementById('contact-nombre').value.trim(),
      from_email:   document.getElementById('contact-email').value.trim(),
      from_phone:   document.getElementById('contact-telefono').value.trim() || 'No proporcionado',
      asunto:       document.getElementById('contact-asunto').value,
      mensaje:      document.getElementById('contact-mensaje').value.trim(),
      fecha_hora:   fechaHora,
      reply_to:     document.getElementById('contact-email').value.trim(),
      to_name:      document.getElementById('contact-nombre').value.trim(),
    };

    const doShowSuccess = () => {
      form.setAttribute('hidden', '');
      document.getElementById('contactSuccess').removeAttribute('hidden');
      showToast('¡Mensaje enviado exitosamente!', 'success');
      btn.disabled    = false;
      btnSpan.textContent = 'Enviar mensaje';
    };

    if (!EMAILJS_READY) {
      console.warn('⚠️ EmailJS no configurado — simulando envío. Configure EMAILJS_CONFIG en app.js');
      setTimeout(() => {
        doShowSuccess();
        showToast('⚠️ Modo demo: configure EmailJS para envío real', 'info');
      }, 1000);
      return;
    }

    try {
      await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateContacto, templateParams);
      doShowSuccess();
    } catch (err) {
      console.error('EmailJS error (contacto):', err);
      btn.disabled    = false;
      btnSpan.textContent = 'Enviar mensaje';
      showToast('❌ Error al enviar. Inténtelo de nuevo o llámenos al (601) 600-1234.', 'error');
    }
  });
}

function validateContactForm() {
  const fields = [
    { id: 'contact-nombre',  errorId: 'contact-nombre-error',  type: 'required', label: 'nombre' },
    { id: 'contact-email',   errorId: 'contact-email-error',   type: 'email',    label: 'correo' },
    { id: 'contact-asunto',  errorId: 'contact-asunto-error',  type: 'required', label: 'asunto' },
    { id: 'contact-mensaje', errorId: 'contact-mensaje-error', type: 'required', label: 'mensaje' },
  ];

  let valid = true;

  fields.forEach(f => {
    const input = document.getElementById(f.id);
    const error = document.getElementById(f.errorId);
    const value = input.value.trim();
    let msg = '';

    if (!value) {
      msg = `El campo ${f.label} es requerido`;
    } else if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      msg = 'Ingrese un correo electrónico válido';
    }

    if (msg) {
      error.textContent = msg;
      input.classList.add('error');
      valid = false;
    } else {
      error.textContent = '';
      input.classList.remove('error');
    }
  });

  const terms = document.getElementById('contact-terminos');
  if (!terms.checked) {
    showToast('Por favor acepte la política de privacidad', 'error');
    valid = false;
  }

  return valid;
}

/* ============================================================
   7. STATS COUNTER ANIMATION
   ============================================================ */
function initStatsCounter() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

function animateCounter(el) {
  const target   = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const start    = performance.now();

  function tick(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // easeOutExpo
    const eased    = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const current  = Math.floor(eased * target);
    el.textContent = target >= 1000
      ? current.toLocaleString('es-CO')
      : current;
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target >= 1000
      ? target.toLocaleString('es-CO')
      : target;
  }
  requestAnimationFrame(tick);
}

/* ============================================================
   8. SCROLL ANIMATIONS
   ============================================================ */
function initScrollAnimations() {
  const observables = document.querySelectorAll(
    '.coverage-item, .value-item, .contact-item, .achievement-card, .plan-card, .ct-item, .ab-item'
  );

  if (!observables.length) return;

  // Initial state
  observables.forEach((el, i) => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(24px)';
    el.style.transition = `opacity 0.45s ease ${i * 0.05}s, transform 0.45s ease ${i * 0.05}s`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  observables.forEach(el => observer.observe(el));
}

/* ============================================================
   9. BACK TO TOP
   ============================================================ */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.removeAttribute('hidden');
    } else {
      btn.setAttribute('hidden', '');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================================
   10. CURRENCY INPUT FORMATTING
   ============================================================ */
function initCurrencyInputs() {
  const currencyIds = ['valor-auto', 'valor-contrato', 'canon-arriendo', 'valor-inmueble'];
  currencyIds.forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('input', () => {
      const raw     = input.value.replace(/\D/g, '');
      const num     = parseInt(raw, 10);
      if (!isNaN(num)) {
        input.value = num.toLocaleString('es-CO');
      } else {
        input.value = '';
      }
    });
  });
}

function initFormatInputs() {
  // Placa auto: uppercase
  const placa = document.getElementById('placa-auto');
  if (placa) {
    placa.addEventListener('input', () => {
      placa.value = placa.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });
  }

  // Phone: numbers only
  const phones = ['telefono-sol', 'contact-telefono'];
  phones.forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^0-9+\s-]/g, '');
    });
  });
}

/* ============================================================
   11. TOAST NOTIFICATION
   ============================================================ */
function showToast(message, type = 'info') {
  // Remove any existing toast
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className  = `toast-notification toast-${type}`;
  toast.textContent = message;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.textContent = `${icons[type] || ''} ${message}`;

  Object.assign(toast.style, {
    position:     'fixed',
    bottom:       '24px',
    left:         '50%',
    transform:    'translateX(-50%) translateY(80px)',
    background:   type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#1a3a6e',
    color:        '#fff',
    padding:      '12px 24px',
    borderRadius: '999px',
    fontSize:     '0.9rem',
    fontWeight:   '600',
    fontFamily:   'Inter, sans-serif',
    zIndex:       '9999',
    boxShadow:    '0 8px 30px rgba(0,0,0,.25)',
    transition:   'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease',
    opacity:      '0',
    whiteSpace:   'nowrap',
    maxWidth:     '90vw',
  });

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(-50%) translateY(0)';
      toast.style.opacity   = '1';
    });
  });

  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(80px)';
    toast.style.opacity   = '0';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

/* ============================================================
   12. UTILITY
   ============================================================ */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ============================================================
   13. SMOOTH ANCHOR SCROLLING (with nav offset)
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const navHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-height'),
      10
    ) || 72;
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ============================================================
   14. SERVICE WORKER (offline cache hint — optional)
   ============================================================ */
// Uncomment to enable PWA offline support:
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.register('/sw.js');
// }
