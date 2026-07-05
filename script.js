(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const formatNumber = new Intl.NumberFormat("sv-SE");

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  document.addEventListener("DOMContentLoaded", function () {
    initStickyHeader();
    initMobileMenu();
    initSmoothScrolling();
    initRevealAnimations();
    initNumberAnimations();
    initPriceCalculator();
    initBeforeAfterSlider();
    initAccordion();
    initBookingForm();
    initCalendar();
    initFooterYear();
  });

  function initStickyHeader() {
    const header = $("#siteHeader");
    if (!header) return;

    const updateHeader = () => {
      header.classList.toggle("scrolled", window.scrollY > 12);
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  function initMobileMenu() {
    const toggle = $("#navToggle");
    const nav = $("#mainNav");
    if (!toggle || !nav) return;

    const closeMenu = () => {
      nav.classList.remove("mobile-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Öppna meny");
      document.body.style.overflow = "";
    };

    const openMenu = () => {
      nav.classList.add("mobile-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Stäng meny");
      document.body.style.overflow = "hidden";
    };

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      isOpen ? closeMenu() : openMenu();
    });

    $$("a[href^='#']", nav).forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("mobile-open")) {
        closeMenu();
        toggle.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860 && nav.classList.contains("mobile-open")) {
        closeMenu();
      }
    });
  }

  function initSmoothScrolling() {
    $$("a[href^='#']").forEach((link) => {
      link.addEventListener("click", (event) => {
        const hash = link.getAttribute("href");
        if (!hash || hash === "#") return;

        const target = document.querySelector(hash);
        if (!target) return;

        event.preventDefault();

        const header = $("#siteHeader");
        const offset = header ? header.offsetHeight + 10 : 0;
        const targetTop = target.getBoundingClientRect().top + window.scrollY - offset;

        window.scrollTo({
          top: Math.max(0, targetTop),
          behavior: prefersReducedMotion ? "auto" : "smooth"
        });

        history.pushState(null, "", hash);
      });
    });
  }

  function initRevealAnimations() {
    const revealItems = $$(".reveal");
    if (!revealItems.length) return;

    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
      revealItems.forEach((item) => item.classList.add("in-view"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, revealObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -70px 0px"
      }
    );

    revealItems.forEach((item) => observer.observe(item));
  }

  function initNumberAnimations() {
    const numbers = $$(".stat-num, .stat-card-num");
    if (!numbers.length) return;

    const animateNumber = (element) => {
      if (element.dataset.animated === "true") return;
      element.dataset.animated = "true";

      const target = Number.parseFloat(element.dataset.target || "0");
      const decimals = Number.parseInt(element.dataset.decimals || "0", 10);
      const suffix = element.dataset.suffix || "";
      const duration = prefersReducedMotion ? 1 : 1400;
      const start = performance.now();

      const render = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = target * eased;

        element.textContent = `${formatNumber.format(Number(current.toFixed(decimals)))}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(render);
        } else {
          element.textContent = `${formatNumber.format(Number(target.toFixed(decimals)))}${suffix}`;
        }
      };

      requestAnimationFrame(render);
    };

    if (!("IntersectionObserver" in window)) {
      numbers.forEach(animateNumber);
      return;
    }

    const observer = new IntersectionObserver(
      (entries, numberObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateNumber(entry.target);
          numberObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.45 }
    );

    numbers.forEach((number) => observer.observe(number));
  }

  function initPriceCalculator() {
    const services = $$(".calc-service");
    const areaInput = $("#calcArea");
    const areaRange = $("#calcAreaRange");
    const priceOutput = $("#calcPrice");
    const detailOutput = $("#calcDetail");
    const formService = $("#fService");
    const formArea = $("#fArea");

    if (!services.length || !areaInput || !priceOutput || !detailOutput) return;

    let activeService = services.find((service) => service.classList.contains("active")) || services[0];

    const getArea = () => {
      const value = Number.parseInt(areaInput.value, 10);
      return Number.isFinite(value) && value > 0 ? value : 0;
    };

    const syncRangeBackground = () => {
      if (!areaRange) return;

      const min = Number(areaRange.min || 0);
      const max = Number(areaRange.max || 100);
      const value = Number(areaRange.value || min);
      const percent = ((value - min) / (max - min)) * 100;

      areaRange.style.background = `linear-gradient(90deg, var(--blue) 0%, var(--blue) ${percent}%, var(--grey-200) ${percent}%, var(--grey-200) 100%)`;
    };

    const updatePrice = () => {
      const area = getArea();
      const pricePerMeter = Number.parseFloat(activeService.dataset.price || "0");
      const serviceName = activeService.dataset.service || activeService.textContent.trim();
      const total = Math.max(area * pricePerMeter, 900);

      priceOutput.textContent = formatNumber.format(total);
      detailOutput.textContent = `${formatNumber.format(area)} m² × ${formatNumber.format(pricePerMeter)} kr/m² — ${serviceName}`;

      if (formService && serviceName) {
        const matchingOption = Array.from(formService.options).find((option) => option.textContent.trim() === serviceName);
        if (matchingOption) formService.value = matchingOption.value;
      }

      if (formArea && area > 0 && !formArea.value) {
        formArea.value = area;
      }

      syncRangeBackground();
    };

    services.forEach((service) => {
      service.addEventListener("click", () => {
        services.forEach((item) => {
          item.classList.remove("active");
          item.setAttribute("aria-checked", "false");
        });

        service.classList.add("active");
        service.setAttribute("aria-checked", "true");
        activeService = service;
        updatePrice();
      });

      service.addEventListener("keydown", (event) => {
        if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) return;

        event.preventDefault();

        const currentIndex = services.indexOf(service);
        let nextIndex = currentIndex;

        if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % services.length;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + services.length) % services.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = services.length - 1;

        services[nextIndex].focus();
        services[nextIndex].click();
      });
    });

    areaInput.addEventListener("input", () => {
      const area = getArea();

      if (areaRange) {
        const rangeMin = Number(areaRange.min || 0);
        const rangeMax = Number(areaRange.max || 500);
        areaRange.value = String(Math.min(Math.max(area, rangeMin), rangeMax));
      }

      updatePrice();
    });

    if (areaRange) {
      areaRange.addEventListener("input", () => {
        areaInput.value = areaRange.value;
        updatePrice();
      });
    }

    updatePrice();
  }

  function initBeforeAfterSlider() {
    const slider = $("#baSlider");
    const range = $("#baRange");
    const handle = $("#baHandle");
    const beforeLayer = $("#baBeforeClip");

    if (!slider || !range || !handle || !beforeLayer) return;

    const clamp = (value) => Math.min(100, Math.max(0, value));

    const setSlider = (value) => {
      const percent = clamp(Number(value));
      range.value = String(percent);
      handle.style.left = `${percent}%`;
      beforeLayer.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
    };

    const setFromPointer = (event) => {
      const rect = slider.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const percent = (x / rect.width) * 100;
      setSlider(percent);
    };

    range.addEventListener("input", () => setSlider(range.value));

    slider.addEventListener("pointerdown", (event) => {
      setFromPointer(event);
      slider.setPointerCapture(event.pointerId);
    });

    slider.addEventListener("pointermove", (event) => {
      if (event.buttons !== 1) return;
      setFromPointer(event);
    });

    setSlider(range.value || 50);
  }

  function initAccordion() {
    const accordion = $("#accordion");
    if (!accordion) return;

    const items = $$(".accordion-item", accordion);

    const closeItem = (item) => {
      const trigger = $(".accordion-trigger", item);
      const panel = $(".accordion-panel", item);
      if (!trigger || !panel) return;

      trigger.setAttribute("aria-expanded", "false");
      panel.style.maxHeight = "0px";
    };

    const openItem = (item) => {
      const trigger = $(".accordion-trigger", item);
      const panel = $(".accordion-panel", item);
      if (!trigger || !panel) return;

      trigger.setAttribute("aria-expanded", "true");
      panel.style.maxHeight = `${panel.scrollHeight}px`;
    };

    items.forEach((item) => {
      const trigger = $(".accordion-trigger", item);
      const panel = $(".accordion-panel", item);
      if (!trigger || !panel) return;

      panel.style.maxHeight = "0px";

      trigger.addEventListener("click", () => {
        const isOpen = trigger.getAttribute("aria-expanded") === "true";

        items.forEach(closeItem);
        if (!isOpen) openItem(item);
      });
    });

    window.addEventListener("resize", () => {
      items.forEach((item) => {
        const trigger = $(".accordion-trigger", item);
        const panel = $(".accordion-panel", item);

        if (trigger && panel && trigger.getAttribute("aria-expanded") === "true") {
          panel.style.maxHeight = `${panel.scrollHeight}px`;
        }
      });
    });
  }

  function initBookingForm() {
    const form = $("#bookingForm");
    const success = $("#formSuccess");
    const submitButton = $("#submitBtn");

    if (!form || !success) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const formData = new FormData(form);
      const name = String(formData.get("namn") || "").trim();
      const phone = String(formData.get("telefon") || "").trim();
      const email = String(formData.get("epost") || "").trim();
      const address = String(formData.get("adress") || "").trim();
      const service = String(formData.get("tjanst") || "").trim();
      const area = String(formData.get("area") || "").trim();
      const date = String(formData.get("datum") || "").trim();
      const message = String(formData.get("meddelande") || "").trim();

      // By request: remove sending e-post directly. We'll log the data and show success.
      const payload = {
        namn: name,
        telefon: phone,
        epost: email,
        tjanst: service,
        adress: address,
        area: area,
        datum: date,
        meddelande: message
      };

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.setAttribute("aria-disabled", "true");
      }

      // Keep data locally in console (no e-post address exposed)
      try { console.info('Offertförfrågan (lokalt):', payload); } catch (e) {}

      window.setTimeout(
        () => {
          success.hidden = false;
          success.setAttribute("tabindex", "-1");
          success.focus({ preventScroll: true });
          form.reset();

          const dateTrigger = $("#dateTrigger");
          const dateText = $("#dateTriggerText");
          const dateValue = $("#datePickerValue");

          if (dateTrigger) dateTrigger.classList.remove("has-value");
          if (dateTrigger) dateTrigger.setAttribute("aria-expanded", "false");
          if (dateText) dateText.textContent = "Välj datum";
          if (dateValue) dateValue.value = "";

          if (submitButton) {
            submitButton.disabled = false;
            submitButton.removeAttribute("aria-disabled");
          }
        },
        prefersReducedMotion ? 0 : 350
      );
    });
  }

  function initCalendar() {
    const trigger = $("#dateTrigger");
    const popup = $("#calendarPopup");
    const grid = $("#calGrid");
    const monthLabel = $("#calMonthLabel");
    const prevButton = $("#calPrev");
    const nextButton = $("#calNext");
    const triggerText = $("#dateTriggerText");
    const hiddenInput = $("#datePickerValue");

    if (!trigger || !popup || !grid || !monthLabel || !prevButton || !nextButton || !triggerText || !hiddenInput) return;

    const monthNames = [
      "Januari", "Februari", "Mars", "April", "Maj", "Juni",
      "Juli", "Augusti", "September", "Oktober", "November", "December"
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    let selectedDate = null;

    const toIsoDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const toDisplayDate = (date) => {
      return `${date.getDate()} ${monthNames[date.getMonth()].toLowerCase()} ${date.getFullYear()}`;
    };

    const isSameDate = (a, b) => {
      return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    };

    const closeCalendar = () => {
      popup.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    };

    const openCalendar = () => {
      popup.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
    };

    const renderCalendar = () => {
      grid.innerHTML = "";
      monthLabel.textContent = `${monthNames[visibleMonth.getMonth()]} ${visibleMonth.getFullYear()}`;

      const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
      const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
      const mondayBasedStart = (firstDay.getDay() + 6) % 7;

      for (let i = 0; i < mondayBasedStart; i += 1) {
        const pad = document.createElement("span");
        pad.className = "pad";
        grid.appendChild(pad);
      }

      for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
        const button = document.createElement("button");
        const isSunday = date.getDay() === 0;
        const isPast = date < today;

        button.type = "button";
        button.textContent = String(day);
        button.disabled = isPast || isSunday;
        button.setAttribute("aria-label", toDisplayDate(date));

        if (isSameDate(date, today)) button.classList.add("is-today");
        if (isSameDate(date, selectedDate)) button.classList.add("is-selected");

        button.addEventListener("click", () => {
          selectedDate = date;
          hiddenInput.value = toIsoDate(date);
          triggerText.textContent = toDisplayDate(date);
          trigger.classList.add("has-value");
          renderCalendar();
          closeCalendar();
          trigger.focus();
        });

        grid.appendChild(button);
      }
    };

    trigger.addEventListener("click", () => {
      popup.hidden ? openCalendar() : closeCalendar();
    });

    prevButton.addEventListener("click", () => {
      visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
      renderCalendar();
    });

    nextButton.addEventListener("click", () => {
      visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
      renderCalendar();
    });

    document.addEventListener("click", (event) => {
      if (popup.hidden) return;
      if (popup.contains(event.target) || trigger.contains(event.target)) return;
      closeCalendar();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !popup.hidden) {
        closeCalendar();
        trigger.focus();
      }
    });

    renderCalendar();
  }

  function initFooterYear() {
    const year = $("#year");
    if (!year) return;

    year.textContent = String(new Date().getFullYear());
  }
})();