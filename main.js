
(function () {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map((el) => new bootstrap.Tooltip(el));

  const serviceInputs = Array.from(document.querySelectorAll('input[name="service"]'));
  const profInputs = Array.from(document.querySelectorAll('input[name="professional"]'));
  const dateInput = document.getElementById("dateInput");
  const timeSelect = document.getElementById("timeSelect");

  const toInfoBtn = document.getElementById("toInfoBtn");
  const toInfoHint = document.getElementById("toInfoHint");

  const bookingForm = document.getElementById("bookingForm");
  const confirmBtn = document.getElementById("confirmBtn");
  const confirmHint = document.getElementById("confirmHint");

  const summaryText = document.getElementById("summaryText");
  const cardNumber = document.getElementById("cardNumber");
  const cardExpiry = document.getElementById("cardExpiry");
  const cardCvc = document.getElementById("cardCvc");

  const confirmEmpty = document.getElementById("confirmEmpty");
  const confirmCard = document.getElementById("confirmCard");
  const confirmText = document.getElementById("confirmText");
  const refCode = document.getElementById("refCode");
  const newBookingBtn = document.getElementById("newBookingBtn");

  const nameInput = document.getElementById("nameInput");
  const phoneInput = document.getElementById("phoneInput");
  const emailInput = document.getElementById("emailInput");
  const notesInput = document.getElementById("notesInput");
  const consentCheck = document.getElementById("consentCheck");

  const today = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

  const min = new Date(today);
  const max = new Date(today);
  max.setDate(max.getDate() + 30);
  dateInput.min = toISO(min);
  dateInput.max = toISO(max);

  let fp = null;

  function makeDisableFunc() {
    return function(date) {
      const d = new Date(date);
      const wd = d.getDay();
      if (wd === 0 || wd === 6) return true;
      const prof = getSelectedProfessional();
      if (prof && Array.isArray(prof.offdays) && prof.offdays.includes(wd)) return true;
      const t = new Date();
      const maxd = new Date(); maxd.setDate(t.getDate()+30);
      if (d < t || d > maxd) return true;
      return false;
    };
  }

  if (window.flatpickr && dateInput) {
    fp = flatpickr(dateInput, {
      minDate: 'today',
      maxDate: new Date().fp_incr(30),
      disable: [makeDisableFunc()],
      dateFormat: 'Y-m-d',
      onChange: function() { updateSummary(); updateNextButton(); }
    });
  }

  function getSelectedService() {
    const picked = serviceInputs.find((i) => i.checked);
    if (!picked) return null;
    return {
      name: picked.dataset.name,
      price: Number(picked.dataset.price || 0),
      duration: Number(picked.dataset.duration || 0)
    };
  }

  function getSelectedProfessional() {
    const picked = profInputs.find((i) => i.checked);
    if (!picked) return null;
    const off = (picked.dataset.offdays || "").split(',').map(s => s.trim()).filter(Boolean).map(Number);
    return { name: picked.dataset.name, offdays: off };
  }

  function updateStepper() {
    const svc = getSelectedService();
    const dtReady = !!(dateInput.value && timeSelect.value);
    const infoReady = isInfoReady();

    setStep("step1Dot", !!svc);
    setStep("step2Dot", !!svc && dtReady);
    setStep("step3Dot", !!svc && dtReady && infoReady);
  }

  function setStep(id, active) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle("active", active);
  }

  function updateSummary() {
    const svc = getSelectedService();
    const date = dateInput.value;
    const time = timeSelect.value;
    const prof = getSelectedProfessional();

    if (!svc) {
      summaryText.textContent = "Pick a service to get started.";
      updateStepper();
      return;
    }

    let line = `Service: ${svc.name} ($${svc.price})`;

    if (date && time) {
      line += ` · Time: ${date} at ${time}`;
      line += ` · Estimated: ~${svc.duration} min`;
    } else {
      line += " · Next: choose a date & time.";
    }

    if (prof) line += ` · Professional: ${prof.name}`;
    summaryText.textContent = line;
    updateStepper();
  }

  function updateNextButton() {
    const svc = getSelectedService();
    const dtReady = !!(dateInput.value && timeSelect.value);

    const ready = !!svc && dtReady;

    toInfoBtn.disabled = !ready;
    toInfoHint.textContent = ready
      ? "Ready — continue to enter your contact info."
      : "Select a service, date, and time to unlock the next step.";
  }

  function isInfoReady() {
    const nameOk = nameInput.value.trim().length >= 2;
    const phoneOk = phoneRE.test(phoneInput.value.trim());
    const emailOk = emailInput.value.includes("@") && emailInput.value.includes(".");
    const consentOk = consentCheck.checked;
    return nameOk && phoneOk && emailOk && consentOk && validateCard().ok;
  }

  function updateConfirmButton() {
    const ready = isInfoReady();
    confirmBtn.disabled = !ready;
    confirmHint.textContent = ready
      ? "Looks good — confirm when you’re ready."
      : "Fill the required fields to enable confirmation.";
    updateStepper();
  }

  serviceInputs.forEach((i) => i.addEventListener("change", () => {
    updateSummary();
    updateNextButton();
  }));
  profInputs.forEach((i) => i.addEventListener("change", () => {
    // reconfigure date picker to reflect selected professional off-days
    if (fp) fp.set('disable', [makeDisableFunc()]);
    updateSummary();
    updateNextButton();
  }));
  dateInput.addEventListener("change", () => {
    updateSummary();
    updateNextButton();
  });
  timeSelect.addEventListener("change", () => {
    updateSummary();
    updateNextButton();
  });

  [nameInput, phoneInput, emailInput, consentCheck].forEach((el) =>
    el.addEventListener("input", updateConfirmButton)
  );
  consentCheck.addEventListener("change", updateConfirmButton);

  [cardNumber, cardExpiry, cardCvc].forEach((el) => el.addEventListener('input', updateConfirmButton));

  toInfoBtn.addEventListener("click", () => {
    document.getElementById("info").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const phoneRE = /^[0-9\-\s\(\)\+]{7,20}$/;

  function validateCard() {
    const raw = (cardNumber.value || '').replace(/\s+/g,'');
    const okNum = /^[0-9]{13,19}$/.test(raw);
    const okCvc = /^[0-9]{3,4}$/.test((cardCvc.value||'').trim());
    const exp = (cardExpiry.value||'').trim();
    const okExp = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(exp);
    return { ok: okNum && okCvc && okExp, last4: raw.slice(-4) };
  }

  bookingForm.addEventListener("submit", (e) => {
    e.preventDefault();

    bookingForm.classList.add("was-validated");

    const svc = getSelectedService();
    const dtReady = !!(dateInput.value && timeSelect.value);
    if (!svc || !dtReady || !isInfoReady()) {
      updateConfirmButton();
      return;
    }

    const ref = `SW-${Math.random().toString(16).slice(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    refCode.textContent = ref;

    const notes = notesInput.value.trim();
    const prof = getSelectedProfessional();
    const cardInfo = validateCard();
    confirmText.textContent =
      `${nameInput.value.trim()}, you booked “${svc.name}” with ${prof?prof.name:'(no pro selected)'} on ${dateInput.value} at ${timeSelect.value}. ` +
      `We’ll contact you at ${phoneInput.value.trim()} / ${emailInput.value.trim()}.` +
      (cardInfo.ok ? ` Card ending •••• ${cardInfo.last4}.` : ' Payment not recorded.') +
      (notes ? ` Notes: “${notes}”.` : "");

    confirmEmpty.classList.add("d-none");
    confirmCard.classList.remove("d-none");

    setStep("step4Dot", true);

    document.getElementById("confirmation").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  newBookingBtn.addEventListener("click", () => {
    serviceInputs.forEach((i) => (i.checked = false));
    profInputs.forEach((i) => (i.checked = false));
    dateInput.value = "";
    timeSelect.value = "";
    bookingForm.reset();
    bookingForm.classList.remove("was-validated");

    confirmEmpty.classList.remove("d-none");
    confirmCard.classList.add("d-none");
    setStep("step4Dot", false);

    updateSummary();
    updateNextButton();
    updateConfirmButton();

    document.getElementById("services").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  updateSummary();
  updateNextButton();
  updateConfirmButton();
})();
