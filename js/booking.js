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

// Fetch all approved reservations from Firestore
async function fetchApprovedReservations() {
  const q = query(collection(db, "reservations"), where("approved", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

// Build a Set of all blocked dates (YYYY-MM-DD)
function getBlockedDateSet(reservations) {
  const blocked = new Set();
  reservations.forEach(res => {
    if (!res.checkin || !res.checkout) return;
    const start = new Date(res.checkin);
    const end = new Date(res.checkout);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      blocked.add(d.toISOString().slice(0, 10));
    }
  });
  return blocked;
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

  // Fetch approved reservations and build blocked dates set
  const reservations = await fetchApprovedReservations();
  const blockedDates = getBlockedDateSet(reservations);

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
        const isBlocked = isDateBlocked(date, blockedDates);
        const isSelected = selectedStart && formatDate(date) === formatDate(selectedStart);
        const isInRange = selectedStart && selectedEnd && date > selectedStart && date < selectedEnd;
        const isEnd = selectedEnd && formatDate(date) === formatDate(selectedEnd);
        const classes = [
          'calendar-date',
          isPast ? 'muted' : '',
          isBlocked ? 'blocked' : '',
          isSelected ? 'selected' : '',
          isInRange ? 'in-range' : '',
          isEnd ? 'selected' : ''
        ].filter(Boolean).join(' ');
        html += `<span class="${classes}" data-date="${formatDate(date)}" ${(isPast || isBlocked) ? 'tabindex="-1"' : 'tabindex="0"'}>${day}</span>`;
        day++;
      }
    }
    html += `</div>`;
    calendarEl.innerHTML = html;

    // Navigation
    calendarEl.querySelector('.calendar-prev')?.addEventListener('click', () => {
      renderCalendar(month === 0 ? 11 : month - 1, month === 0 ? year - 1 : year);
    });
    calendarEl.querySelector('.calendar-next')?.addEventListener('click', () => {
      renderCalendar(month === 11 ? 0 : month + 1, month === 11 ? year + 1 : year);
    });

    // Date selection
    calendarEl.querySelectorAll('.calendar-date:not(.muted):not(.blocked)').forEach(el => {
      el.addEventListener('click', () => {
        const date = new Date(el.dataset.date);
        if (!selectedStart || (selectedStart && selectedEnd)) {
          selectedStart = date;
          selectedEnd = null;
        } else if (date > selectedStart) {
          // Check for overlap
          if (isRangeBlocked(selectedStart, date, blockedDates)) {
            alert('Selected range overlaps with a blocked date. Please choose another range.');
            selectedStart = null;
            selectedEnd = null;
            updateFields();
            renderCalendar(month, year);
            return;
          }
          selectedEnd = date;
        } else {
          selectedStart = date;
          selectedEnd = null;
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

      // Gather all form data
      const formData = new FormData(reservationForm);

      // Build the reservation object
      const reservation = {
        checkin: formData.get('checkin'),
        checkout: formData.get('checkout'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: document.getElementById('country-code').value + ' ' + document.getElementById('phone').value,
        address: formData.get('address'),
        guests: formData.get('guests'),
        note: formData.get('note'),
        approved: false,
        createdAt: serverTimestamp()
      };

      try {
        await addDoc(collection(db, "reservations"), reservation);

        // Success UI
        confirmationModal.classList.remove('show');
        confirmationModal.classList.add('hidden');
        reservationForm.reset();
        checkinEl.value = '';
        checkoutEl.value = '';
        selectedStart = null;
        selectedEnd = null;
        modal.classList.remove("show");
        updateBodyModalOpen();
        // Show confirmation message
        const confirmation = document.createElement("div");
        confirmation.textContent = "Thank you! Your reservation has been sent.";
        confirmation.className = "confirmation-popup";
        document.body.appendChild(confirmation);
        setTimeout(() => {
          confirmation.remove();
        }, 4000);
      } catch (error) {
        alert("There was a problem sending your reservation. Please try again.");
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