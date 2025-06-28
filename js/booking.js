import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCVnzUCtkX-24cOBOZoJ2FyZJHEIGAp-8s",
  authDomain: "kais-cabin-admin.firebaseapp.com",
  projectId: "kais-cabin-admin",
  storageBucket: "kais-cabin-admin.firebasestorage.app",
  messagingSenderId: "425186271736",
  appId: "1:425186271736:web:fb17e1d9752047077e360d",
  measurementId: "G-6XC2710XE3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Security configuration
const SECURITY_CONFIG = {
  // Rate limiting
  MAX_SUBMISSIONS_PER_HOUR: 3,
  MAX_SUBMISSIONS_PER_DAY: 10,
  COOLDOWN_MINUTES: 5,
  
  // Business rules
  MAX_GUESTS: 50,
  MIN_GUESTS: 1,
  MAX_ADVANCE_BOOKING_DAYS: 365,
  MIN_ADVANCE_BOOKING_HOURS: 4,
  
  // Suspicious patterns
  SUSPICIOUS_KEYWORDS: ['spam', 'test', 'admin', 'hack', 'script', 'javascript'],
  MAX_MESSAGE_LENGTH: 1000,
  MAX_NAME_LENGTH: 50
};

// Rate limiting storage
let submissionHistory = JSON.parse(localStorage.getItem('reservationHistory') || '[]');

// Utility functions
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>]/g, '').trim();
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validatePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 15;
}

function validateDate(dateString) {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date > new Date();
}

function checkForSuspiciousContent(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return SECURITY_CONFIG.SUSPICIOUS_KEYWORDS.some(keyword => 
    lowerText.includes(keyword)
  );
}

function checkRateLimit() {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  
  // Clean old entries
  submissionHistory = submissionHistory.filter(time => time > oneDayAgo);
  
  // Check hourly limit
  const hourlySubmissions = submissionHistory.filter(time => time > oneHourAgo);
  if (hourlySubmissions.length >= SECURITY_CONFIG.MAX_SUBMISSIONS_PER_HOUR) {
    throw new Error('Too many submissions. Please wait before submitting again.');
  }
  
  // Check daily limit
  if (submissionHistory.length >= SECURITY_CONFIG.MAX_SUBMISSIONS_PER_DAY) {
    throw new Error('Daily submission limit reached. Please try again tomorrow.');
  }
  
  // Check cooldown
  if (submissionHistory.length > 0) {
    const lastSubmission = Math.max(...submissionHistory);
    const timeDiff = (now - lastSubmission) / (1000 * 60); // minutes
    if (timeDiff < SECURITY_CONFIG.COOLDOWN_MINUTES) {
      throw new Error(`Please wait ${SECURITY_CONFIG.COOLDOWN_MINUTES - Math.ceil(timeDiff)} minutes before submitting again.`);
    }
  }
}

function validateReservationData(data) {
  const errors = [];
  
  // Required fields
  const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'guests', 'checkin', 'checkout'];
  requiredFields.forEach(field => {
    if (!data[field] || data[field].toString().trim() === '') {
      errors.push(`${field} is required`);
    }
  });
  
  if (errors.length > 0) {
    throw new Error(`Validation errors: ${errors.join(', ')}`);
  }
  
  // Validate email
  if (!validateEmail(data.email)) {
    errors.push('Invalid email address');
  }
  
  // Validate phone
  if (!validatePhone(data.phone)) {
    errors.push('Invalid phone number');
  }
  
  // Validate dates
  if (!validateDate(data.checkin)) {
    errors.push('Invalid check-in date');
  }
  if (!validateDate(data.checkout)) {
    errors.push('Invalid check-out date');
  }
  
  // Check date range
  const checkin = new Date(data.checkin);
  const checkout = new Date(data.checkout);
  const now = new Date();
  
  if (checkin >= checkout) {
    errors.push('Check-out date must be after check-in date');
  }
  
  if (checkin < now) {
    errors.push('Check-in date cannot be in the past');
  }
  
  const advanceBookingDays = (checkin - now) / (1000 * 60 * 60 * 24);
  if (advanceBookingDays > SECURITY_CONFIG.MAX_ADVANCE_BOOKING_DAYS) {
    errors.push(`Cannot book more than ${SECURITY_CONFIG.MAX_ADVANCE_BOOKING_DAYS} days in advance`);
  }
  
  // More flexible advance booking rule
  const minAdvanceHours = (checkin - now) / (1000 * 60 * 60);
  if (minAdvanceHours < SECURITY_CONFIG.MIN_ADVANCE_BOOKING_HOURS) {
    // Allow same-day bookings if it's still early (before 2 PM)
    const currentHour = now.getHours();
    const isSameDay = checkin.toDateString() === now.toDateString();
    
    if (isSameDay && currentHour < 14) { // Before 2 PM
      // Allow same-day bookings
    } else if (minAdvanceHours < SECURITY_CONFIG.MIN_ADVANCE_BOOKING_HOURS) {
      errors.push(`Must book at least ${SECURITY_CONFIG.MIN_ADVANCE_BOOKING_HOURS} hours in advance (or before 2 PM for same-day bookings)`);
    }
  }
  
  // Validate guests
  const guests = parseInt(data.guests);
  if (isNaN(guests) || guests < SECURITY_CONFIG.MIN_GUESTS || guests > SECURITY_CONFIG.MAX_GUESTS) {
    errors.push(`Number of guests must be between ${SECURITY_CONFIG.MIN_GUESTS} and ${SECURITY_CONFIG.MAX_GUESTS}`);
  }
  
  // Validate name lengths
  if (data.firstName.length > SECURITY_CONFIG.MAX_NAME_LENGTH || data.lastName.length > SECURITY_CONFIG.MAX_NAME_LENGTH) {
    errors.push(`Name must be ${SECURITY_CONFIG.MAX_NAME_LENGTH} characters or less`);
  }
  
  // Validate message length
  if (data.note && data.note.length > SECURITY_CONFIG.MAX_MESSAGE_LENGTH) {
    errors.push(`Message must be ${SECURITY_CONFIG.MAX_MESSAGE_LENGTH} characters or less`);
  }
  
  // Check for suspicious content
  const allText = `${data.firstName} ${data.lastName} ${data.address} ${data.note || ''}`.toLowerCase();
  if (checkForSuspiciousContent(allText)) {
    errors.push('Submission contains suspicious content');
  }
  
  if (errors.length > 0) {
    throw new Error(`Validation errors: ${errors.join(', ')}`);
  }
}

// Get reCAPTCHA token
function executeRecaptcha() {
    if (typeof grecaptcha !== 'undefined' && grecaptcha.ready) {
        grecaptcha.ready(() => {
            grecaptcha.execute('6LfKXxEpAAAAAJxJxJxJxJxJxJxJxJxJxJxJxJx', {action: 'submit'})
                .then(token => {
                    // reCAPTCHA token generated successfully
                    return token;
                })
                .catch(error => {
                    console.error('reCAPTCHA error:', error);
                    throw new Error('reCAPTCHA verification failed');
                });
        });
    } else {
        console.error('reCAPTCHA not loaded!');
        throw new Error('reCAPTCHA not available');
    }
}

// Fetch all approved reservations from Firestore
async function fetchApprovedReservations() {
  const q = query(collection(db, "reservations"), where("approved", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

// Build a Set of all blocked dates (YYYY-MM-DD) and a Set of all checkout dates
function getBlockedAndCheckoutDateSets(reservations) {
  const blocked = new Set();
  const availableForCheckout = new Set(); // Dates available for check-out (check-in dates)
  const availableForCheckin = new Set(); // Dates available for check-in (check-out dates)
  
  reservations.forEach(res => {
    if (!res.checkin || !res.checkout) return;
    const start = new Date(res.checkin);
    const end = new Date(res.checkout);
    
    // Track check-in dates as available for check-out
    availableForCheckout.add(start.toISOString().slice(0, 10));
    
    // Block nights up to (but not including) checkout
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      blocked.add(d.toISOString().slice(0, 10));
    }
    // Mark check-out dates as available for check-in
    availableForCheckin.add(new Date(end).toISOString().slice(0, 10));
  });
  
  // Find mixed days (dates that are both check-in and check-out)
  const mixedDays = new Set();
  availableForCheckout.forEach(date => {
    if (availableForCheckin.has(date)) {
      mixedDays.add(date);
    }
  });
  
  // Remove check-in and check-out dates from blocked set (they should be available)
  // BUT keep mixed days blocked
  availableForCheckout.forEach(date => {
    if (!mixedDays.has(date)) {
      blocked.delete(date);
    }
  });
  availableForCheckin.forEach(date => {
    if (!mixedDays.has(date)) {
      blocked.delete(date);
    }
  });
  
  // Remove mixed days from available sets since they should be blocked
  mixedDays.forEach(date => {
    availableForCheckout.delete(date);
    availableForCheckin.delete(date);
  });
  
  return { blocked, availableForCheckout, availableForCheckin };
}

// Helper to check if a date is blocked
function isDateBlocked(date, blockedDates) {
  const iso = date.toISOString().slice(0, 10);
  return blockedDates.has(iso);
}

// Helper to check if a range overlaps with blocked dates
function isRangeBlocked(start, end, blockedDates) {
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    if (blockedDates.has(iso)) {
      return true;
    }
  }
  return false;
}

document.addEventListener('DOMContentLoaded', async () => {
  // Check if reCAPTCHA is loaded
  console.log('Page loaded, checking reCAPTCHA...');
  if (typeof grecaptcha === 'undefined') {
    console.error('❌ reCAPTCHA not loaded! Check if the script is loading properly.');
  } else {
    console.log('✅ reCAPTCHA is loaded and ready!');
  }

  const calendarEl = document.getElementById('bookingCalendar');
  const checkinEl = document.getElementById('checkin');
  const checkoutEl = document.getElementById('checkout');
  const guestsInput = document.getElementById('guests');
  const decreaseBtn = document.querySelector('.guests-btn--decrease');
  const increaseBtn = document.querySelector('.guests-btn--increase');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let selectedStart = null;
  let selectedEnd = null;
  let selectionMode = 'checkin'; // 'checkin' or 'checkout'

  // Fetch approved reservations and build blocked and checkout dates sets
  const reservations = await fetchApprovedReservations();
  const { blocked: blockedDates, availableForCheckout: checkoutDates, availableForCheckin: checkinDates } = getBlockedAndCheckoutDateSets(reservations);

  function formatDate(date) {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit'
    });
  }

  function renderCalendar(month = today.getMonth(), year = today.getFullYear()) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    let html = `<div class="calendar-header">
      <button class="calendar-prev" ${month === today.getMonth() && year === today.getFullYear() ? 'disabled' : ''}>&lt;</button>
      ${firstDay.toLocaleString('default', { month: 'long', year: 'numeric' })}
      <button class="calendar-next">&gt;</button>
    </div>
    <div class="calendar-days">
      <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
    </div>
    <div class="calendar-dates">`;

    let day = 1;
    for (let i = 0; i < 6 * 7; i++) {
      const date = new Date(year, month, day);
      if (i < startDay || day > lastDay.getDate()) {
        html += `<span class="calendar-date muted"></span>`;
      } else {
        const isPast = date < today;
        const isToday = date.toDateString() === today.toDateString();
        const iso = date.toISOString().slice(0, 10);
        const isBlocked = isDateBlocked(date, blockedDates);
        const isAvailableForCheckout = checkoutDates.has(iso);
        const isAvailableForCheckin = checkinDates.has(iso);
        const isSelected = selectedStart && formatDate(date) === formatDate(selectedStart);
        const isInRange = selectedStart && selectedEnd && date > selectedStart && date < selectedEnd;
        const isEnd = selectedEnd && formatDate(date) === formatDate(selectedEnd);
        
        // Determine if date is clickable based on selection mode
        const isAvailableDate = !isAvailableForCheckout && !isAvailableForCheckin; // White dates
        // Today is not selectable
        const isClickable = !isPast && !isBlocked && !isToday && (
          selectionMode === 'checkin' ? 
            (isAvailableDate || isAvailableForCheckin) : // For check-in: allow available dates + check-out dates
            (isAvailableDate || (isAvailableForCheckout && selectedStart))   // For check-out: only allow check-in dates if we have a selected start
        );
        
        // Build tooltip content (no guest names for privacy)
        let tooltipContent = '';
        let tooltipTitle = '';
        
        // Remove today tooltip
        if (isAvailableForCheckin) {
          tooltipTitle = 'Check-out Day';
          tooltipContent = 'Available for new check-in (afternoon)';
        } else if (isAvailableForCheckout) {
          tooltipTitle = 'Check-in Day';
          tooltipContent = 'Available for check-out (morning)';
        } else if (isBlocked) {
          tooltipTitle = 'Occupied';
          tooltipContent = 'Not available for booking';
        }
        
        const classes = [
          'calendar-date',
          isPast ? 'muted' : '',
          isToday ? 'today' : '',
          isBlocked ? 'blocked' : '',
          isAvailableForCheckin ? 'checkout' : '',
          isAvailableForCheckout ? 'checkin' : '',
          isSelected ? 'selected' : '',
          isInRange ? 'in-range' : '',
          isEnd ? 'selected' : '',
          (!isClickable || isToday) ? 'not-clickable' : ''
        ].filter(Boolean).join(' ');
        
        const tooltipAttr = tooltipContent ? `data-tooltip="${tooltipContent}" data-tooltip-title="${tooltipTitle}"` : '';
        const clickAttr = isClickable ? 'tabindex="0"' : 'tabindex="-1"';
        
        html += `<span class="${classes}" data-date="${formatDate(date)}" ${clickAttr} ${tooltipAttr}>${day}</span>`;
        day++;
      }
    }
    html += `</div>`;
    calendarEl.innerHTML = html;

    // Add improved legend below calendar
    const legendHtml = `
      <div class="calendar-legend" aria-label="Calendar Legend">
        <div class="calendar-legend__title">Legend</div>
        <span><span class="calendar-legend__icon available" title="Available for check-in and check-out."></span> Available</span>
        <span><span class="calendar-legend__icon checkout" title="Check-out day: Available for new check-in."></span> Check-out (available for check-in)</span>
        <span><span class="calendar-legend__icon checkin" title="Check-in day: Available for check-out after selecting check-in."></span> Check-in (available for check-out)</span>
        <span><span class="calendar-legend__icon blocked" title="Occupied: Not available for booking."></span> Occupied</span>
      </div>
    `;
    calendarEl.insertAdjacentHTML('beforeend', legendHtml);

    // Navigation
    calendarEl.querySelector('.calendar-prev')?.addEventListener('click', () => {
      renderCalendar(month === 0 ? 11 : month - 1, month === 0 ? year - 1 : year);
    });
    calendarEl.querySelector('.calendar-next')?.addEventListener('click', () => {
      renderCalendar(month === 11 ? 0 : month + 1, month === 11 ? year + 1 : year);
    });

    // Date selection - only clickable dates
    calendarEl.querySelectorAll('.calendar-date:not(.muted):not(.not-clickable)').forEach(el => {
      el.addEventListener('click', () => {
        const date = new Date(el.dataset.date);
        
        if (!selectedStart || (selectedStart && selectedEnd)) {
          selectedStart = date;
          selectedEnd = null;
          // Switch to checkout mode after selecting check-in
          selectionMode = 'checkout';
        } else if (date > selectedStart) {
          // Check for overlap with blocked dates
          if (isRangeBlocked(selectedStart, date, blockedDates)) {
            alert('Selected range overlaps with a blocked date. Please choose another range.');
            selectedStart = null;
            selectedEnd = null;
            selectionMode = 'checkin';
            updateFields();
            renderCalendar(month, year);
            return;
          }
          selectedEnd = date;
          // Reset to checkin mode after completing selection
          selectionMode = 'checkin';
        } else {
          selectedStart = date;
          selectedEnd = null;
          selectionMode = 'checkout';
        }
        updateFields();
        renderCalendar(month, year);
      });
    });
  }

  function updateFields() {
    checkinEl.value = selectedStart ? formatDate(selectedStart) : '';
    checkoutEl.value = selectedEnd ? formatDate(selectedEnd) : '';
  }

  renderCalendar();

  const openModalBtn = document.getElementById("openModal");
  const modal = document.getElementById("reservationModal");
  const closeBtn = modal.querySelector(".close");

  // Helper to manage body scroll lock for modals
  let lastScrollY = 0;
  function updateBodyModalOpen() {
    const anyModalOpen = document.querySelector('.modal.show');
    if (anyModalOpen) {
      if (!document.body.classList.contains('modal-open')) {
        lastScrollY = window.scrollY;
        document.body.style.top = `-${lastScrollY}px`;
      }
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
      window.scrollTo(0, lastScrollY);
      document.body.style.top = '';
    }
  }

  openModalBtn.addEventListener("click", () => {
    const checkin = document.getElementById("checkin").value;
    const checkout = document.getElementById("checkout").value;
    if (!checkin || !checkout) {
      alert('Please select both check-in and check-out dates before proceeding.');
      return;
    }
    document.getElementById("modal-checkin").value = checkin;
    document.getElementById("modal-checkout").value = checkout;
    document.getElementById("modal-checkin-display").textContent = checkin;
    document.getElementById("modal-checkout-display").textContent = checkout;
    modal.classList.add("show");
    updateBodyModalOpen();
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.remove("show");
    updateBodyModalOpen();
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("show");
      updateBodyModalOpen();
    }
  });

  if (guestsInput && decreaseBtn && increaseBtn) {
    decreaseBtn.addEventListener('click', function() {
      let value = parseInt(guestsInput.value, 10) || 1;
      if (value > 1) {
        guestsInput.value = value - 1;
      }
    });
    increaseBtn.addEventListener('click', function() {
      let value = parseInt(guestsInput.value, 10) || 1;
      guestsInput.value = value + 1;
    });
    guestsInput.addEventListener('input', function() {
      if (parseInt(guestsInput.value, 10) < 1 || isNaN(guestsInput.value)) {
        guestsInput.value = 1;
      }
    });
  }

  // Confirmation modal logic
  const reservationForm = document.getElementById('reservationForm');
  const confirmationModal = document.getElementById('confirmationModal');
  const confirmFields = {
    checkin: document.getElementById('confirm-checkin'),
    checkout: document.getElementById('confirm-checkout'),
    firstName: document.getElementById('confirm-first-name'),
    lastName: document.getElementById('confirm-last-name'),
    email: document.getElementById('confirm-email'),
    phone: document.getElementById('confirm-phone'),
    address: document.getElementById('confirm-address'),
    guests: document.getElementById('confirm-guests'),
    message: document.getElementById('confirm-message'),
  };
  const confirmSubmitBtn = document.getElementById('confirmSubmit');
  const cancelConfirmationBtn = document.getElementById('cancelConfirmation');
  const confirmationCloseBtn = document.getElementById('confirmationClose');

  if (reservationForm && confirmationModal) {
    reservationForm.addEventListener('submit', function(e) {
    e.preventDefault();
      // Populate confirmation modal
      confirmFields.checkin.textContent = document.getElementById('modal-checkin').value;
      confirmFields.checkout.textContent = document.getElementById('modal-checkout').value;
      confirmFields.firstName.textContent = document.getElementById('first-name').value;
      confirmFields.lastName.textContent = document.getElementById('last-name').value;
      confirmFields.email.textContent = document.getElementById('email').value;
      confirmFields.phone.textContent = document.getElementById('country-code').value + ' ' + document.getElementById('phone').value;
      confirmFields.address.textContent = document.getElementById('address').value;
      confirmFields.guests.textContent = document.getElementById('guests').value;
      confirmFields.message.textContent = document.getElementById('message').value;
      confirmationModal.classList.add('show');
      confirmationModal.classList.remove('hidden');
      updateBodyModalOpen();
    });
    // Confirm & Submit
    confirmSubmitBtn.addEventListener('click', async function() {
      confirmSubmitBtn.disabled = true;
      confirmSubmitBtn.textContent = "Sending...";

      try {
        // Gather all form data
        const formData = new FormData(reservationForm);

        // Security checks - RE-ENABLED
        checkRateLimit();
        
        // Get reCAPTCHA token (this will block bots)
        const recaptchaToken = await executeRecaptcha();
        if (!recaptchaToken) {
          throw new Error('CAPTCHA verification failed. Please try again.');
        }
        
        // Rate limiting check
        checkRateLimit();
        
        // Validate form data
        const errors = validateFormData(formData);
        if (errors.length > 0) {
          throw new Error(errors.join('\n'));
        }
        
        // Submit to Firestore
        const reservationData = {
          ...formData,
          recaptchaToken,
          submittedAt: new Date(),
          ipAddress: await getClientIP()
        };
        
        const docRef = await addDoc(collection(db, 'reservations'), reservationData);
        
        // Show success message
        showSuccessMessage('Reservation submitted successfully! We will contact you soon.');
        
        // Reset form
        resetForm();
        
      } catch (error) {
        showErrorMessage(error.message);
      } finally {
        confirmSubmitBtn.disabled = false;
        confirmSubmitBtn.textContent = "Confirm & Submit";
      }
    });
    // Cancel or close
    cancelConfirmationBtn.addEventListener('click', function() {
      confirmationModal.classList.remove('show');
      confirmationModal.classList.add('hidden');
      updateBodyModalOpen();
    });
    confirmationCloseBtn.addEventListener('click', function() {
      confirmationModal.classList.remove('show');
      confirmationModal.classList.add('hidden');
      updateBodyModalOpen();
    });
  }
});