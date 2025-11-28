/**
 * TenancyHub - Profile JavaScript
 * Handles tenant profile management
 */

const Profile = {
    currentTenant: null,

    init() {
        this.loadProfile();
        this.setupEventListeners();
        this.initCountdown();
    },

    // ========================================
    // Load Profile Data
    // ========================================
    loadProfile() {
        // Get current user from session or use first tenant for demo
        const currentUser = TenancyHub.getData(TenancyHub.STORAGE_KEYS.CURRENT_USER);
        const tenants = TenancyHub.getData(TenancyHub.STORAGE_KEYS.TENANTS) || [];
        
        // Find matching tenant or use first one for demo
        if (currentUser) {
            this.currentTenant = tenants.find(t => t.email === currentUser.email) || tenants[0];
        } else {
            this.currentTenant = tenants[0];
        }

        if (this.currentTenant) {
            this.renderProfile();
            this.renderPaymentHistory();
            this.renderAgreementSummary();
        } else {
            this.renderEmptyState();
        }
    },

    // ========================================
    // Render Profile
    // ========================================
    renderProfile() {
        const tenant = this.currentTenant;
        
        // Profile header
        const profilePhotoEl = document.getElementById('profile-photo');
        const profileNameEl = document.getElementById('profile-name');
        const profileEmailEl = document.getElementById('profile-email');
        const profilePhoneEl = document.getElementById('profile-phone');
        const profileAddressEl = document.getElementById('profile-address');

        if (profilePhotoEl) profilePhotoEl.src = tenant.photo;
        if (profileNameEl) profileNameEl.textContent = tenant.name;
        if (profileEmailEl) profileEmailEl.textContent = tenant.email;
        if (profilePhoneEl) profilePhoneEl.textContent = tenant.phone || 'Not provided';
        if (profileAddressEl) profileAddressEl.textContent = tenant.propertyAddress || 'Not assigned';

        // Profile details
        const moveInDateEl = document.getElementById('move-in-date');
        const rentAmountEl = document.getElementById('rent-amount');
        const agreementStatusEl = document.getElementById('agreement-status');

        if (moveInDateEl) moveInDateEl.textContent = TenancyHub.formatDate(tenant.moveInDate);
        if (rentAmountEl) rentAmountEl.textContent = TenancyHub.formatCurrency(tenant.rentAmount);
        if (agreementStatusEl) {
            agreementStatusEl.innerHTML = `
                <span class="status-badge status-${tenant.agreementStatus === 'active' ? 'paid' : 'pending'}">
                    ${tenant.agreementStatus}
                </span>
            `;
        }
    },

    renderEmptyState() {
        const profileContainer = document.getElementById('profile-container');
        if (profileContainer) {
            profileContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👤</div>
                    <h3>No Profile Found</h3>
                    <p>Please register or log in to view your profile.</p>
                    <button class="btn btn-primary mt-3" onclick="TenancyHub.openModal('registerModal')">
                        Create Profile
                    </button>
                </div>
            `;
        }
    },

    // ========================================
    // Payment History
    // ========================================
    renderPaymentHistory() {
        const historyContainer = document.getElementById('payment-history');
        if (!historyContainer || !this.currentTenant) return;

        const payments = TenancyHub.getData(TenancyHub.STORAGE_KEYS.PAYMENTS) || [];
        const tenantPayments = payments.filter(p => p.tenantId === this.currentTenant.id);

        if (tenantPayments.length === 0) {
            historyContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💳</div>
                    <p>No payment history yet</p>
                </div>
            `;
            return;
        }

        historyContainer.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tenantPayments.map(payment => {
                            const status = TenancyHub.getPaymentStatus(payment.nextDueDate);
                            return `
                                <tr>
                                    <td>${TenancyHub.formatShortDate(payment.date)}</td>
                                    <td>${TenancyHub.formatCurrency(payment.amount)}</td>
                                    <td>${payment.method}</td>
                                    <td><span class="status-badge status-${status}">${status}</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    // ========================================
    // Agreement Summary
    // ========================================
    renderAgreementSummary() {
        const summaryContainer = document.getElementById('agreement-summary');
        if (!summaryContainer || !this.currentTenant) return;

        const agreements = TenancyHub.getData(TenancyHub.STORAGE_KEYS.AGREEMENTS) || [];
        const tenantAgreement = agreements.find(a => a.tenantId === this.currentTenant.id);

        if (!tenantAgreement) {
            summaryContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📄</div>
                    <p>No agreement on file</p>
                    <a href="agreements.html" class="btn btn-primary mt-2">
                        Fill Agreement
                    </a>
                </div>
            `;
            return;
        }

        summaryContainer.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Property</label>
                    <p>${tenantAgreement.propertyAddress}</p>
                </div>
                <div class="form-group">
                    <label>Lease Period</label>
                    <p>${TenancyHub.formatShortDate(tenantAgreement.startDate)} - ${TenancyHub.formatShortDate(tenantAgreement.endDate)}</p>
                </div>
                <div class="form-group">
                    <label>Monthly Rent</label>
                    <p>${TenancyHub.formatCurrency(tenantAgreement.rentAmount)}</p>
                </div>
                <div class="form-group">
                    <label>Security Deposit</label>
                    <p>${TenancyHub.formatCurrency(tenantAgreement.securityDeposit)}</p>
                </div>
            </div>
            <h5 class="text-orange mt-3 mb-2">Terms & Conditions</h5>
            <ul style="padding-left: 1.5rem;">
                <li>Pets: ${tenantAgreement.terms.petsAllowed ? 'Allowed' : 'Not Allowed'}</li>
                <li>Smoking: ${tenantAgreement.terms.smokingAllowed ? 'Allowed' : 'Not Allowed'}</li>
                <li>Guest Policy: ${tenantAgreement.terms.guestPolicy}</li>
                <li>Maintenance: ${tenantAgreement.terms.maintenanceResponsibility}</li>
            </ul>
        `;
    },

    // ========================================
    // Countdown Timer
    // ========================================
    initCountdown() {
        if (!this.currentTenant || !this.currentTenant.nextDueDate) {
            this.renderNoCountdown();
            return;
        }

        this.updateCountdown();
        // Update every second
        setInterval(() => this.updateCountdown(), 1000);
    },

    updateCountdown() {
        const countdownContainer = document.getElementById('countdown-container');
        if (!countdownContainer || !this.currentTenant) return;

        const nextDueDate = this.currentTenant.nextDueDate;
        if (!nextDueDate) {
            this.renderNoCountdown();
            return;
        }

        const targetDate = new Date(nextDueDate);
        const now = new Date();
        const diff = targetDate - now;

        // Calculate time components
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        // Determine status class
        let statusClass = '';
        if (days < 0) {
            statusClass = 'countdown-danger';
        } else if (days <= 30) {
            statusClass = 'countdown-warning';
        }

        countdownContainer.innerHTML = `
            <div class="countdown-container ${statusClass}">
                <h4 class="countdown-title">
                    ${days < 0 ? '⚠️ Rent Overdue!' : '⏰ Time Until Next Rent Due'}
                </h4>
                <p class="mb-3">Next payment due: ${TenancyHub.formatDate(nextDueDate)}</p>
                <div class="countdown-timer">
                    <div class="countdown-item">
                        <div class="countdown-value">${Math.abs(days)}</div>
                        <div class="countdown-label">${days < 0 ? 'Days Overdue' : 'Days'}</div>
                    </div>
                    <div class="countdown-item">
                        <div class="countdown-value">${Math.abs(hours)}</div>
                        <div class="countdown-label">Hours</div>
                    </div>
                    <div class="countdown-item">
                        <div class="countdown-value">${Math.abs(minutes)}</div>
                        <div class="countdown-label">Minutes</div>
                    </div>
                    <div class="countdown-item">
                        <div class="countdown-value">${Math.abs(seconds)}</div>
                        <div class="countdown-label">Seconds</div>
                    </div>
                </div>
                ${days <= 30 && days >= 0 ? `
                    <button class="btn btn-primary mt-3" onclick="Payments.openPaymentModal()">
                        Make Payment Now
                    </button>
                ` : ''}
                ${days < 0 ? `
                    <button class="btn btn-danger mt-3 pulse" onclick="Payments.openPaymentModal()">
                        Pay Now - Overdue!
                    </button>
                ` : ''}
            </div>
        `;
    },

    renderNoCountdown() {
        const countdownContainer = document.getElementById('countdown-container');
        if (countdownContainer) {
            countdownContainer.innerHTML = `
                <div class="countdown-container">
                    <h4 class="countdown-title">No Active Lease</h4>
                    <p>Make a payment to start your rental countdown timer.</p>
                    <button class="btn btn-primary mt-3" onclick="Payments.openPaymentModal()">
                        Make Payment
                    </button>
                </div>
            `;
        }
    },

    // ========================================
    // Event Listeners
    // ========================================
    setupEventListeners() {
        // Photo upload
        const photoInput = document.getElementById('photo-upload-input');
        const photoUploadBtn = document.getElementById('photo-upload-btn');

        if (photoUploadBtn && photoInput) {
            photoUploadBtn.addEventListener('click', () => {
                photoInput.click();
            });

            photoInput.addEventListener('change', (e) => {
                this.handlePhotoUpload(e);
            });
        }

        // Edit profile form
        const editProfileForm = document.getElementById('edit-profile-form');
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProfileUpdate(e);
            });
        }
    },

    handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            TenancyHub.showNotification('Please select an image file', 'danger');
            return;
        }

        // Create a preview using FileReader
        const reader = new FileReader();
        reader.onload = (event) => {
            const imageData = event.target.result;
            
            // Update UI
            const profilePhotoEl = document.getElementById('profile-photo');
            if (profilePhotoEl) {
                profilePhotoEl.src = imageData;
            }

            // Update tenant data
            if (this.currentTenant) {
                const tenants = TenancyHub.getData(TenancyHub.STORAGE_KEYS.TENANTS) || [];
                const index = tenants.findIndex(t => t.id === this.currentTenant.id);
                if (index !== -1) {
                    tenants[index].photo = imageData;
                    TenancyHub.setData(TenancyHub.STORAGE_KEYS.TENANTS, tenants);
                    this.currentTenant = tenants[index];
                }
            }

            TenancyHub.showNotification('Photo updated successfully!', 'success');
        };
        reader.readAsDataURL(file);
    },

    handleProfileUpdate(e) {
        const formData = new FormData(e.target);
        
        if (!this.currentTenant) {
            TenancyHub.showNotification('No profile to update', 'danger');
            return;
        }

        const tenants = TenancyHub.getData(TenancyHub.STORAGE_KEYS.TENANTS) || [];
        const index = tenants.findIndex(t => t.id === this.currentTenant.id);
        
        if (index !== -1) {
            tenants[index].name = formData.get('name') || tenants[index].name;
            tenants[index].email = formData.get('email') || tenants[index].email;
            tenants[index].phone = formData.get('phone') || tenants[index].phone;
            
            TenancyHub.setData(TenancyHub.STORAGE_KEYS.TENANTS, tenants);
            this.currentTenant = tenants[index];
            this.renderProfile();
            
            TenancyHub.showNotification('Profile updated successfully!', 'success');
            TenancyHub.closeModal('editProfileModal');
        }
    },

    openEditModal() {
        if (!this.currentTenant) return;

        const form = document.getElementById('edit-profile-form');
        if (form) {
            form.elements['name'].value = this.currentTenant.name;
            form.elements['email'].value = this.currentTenant.email;
            form.elements['phone'].value = this.currentTenant.phone || '';
        }
        TenancyHub.openModal('editProfileModal');
    }
};

// Initialize Profile when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('profile-page')) {
        Profile.init();
    }
});

// Export for global access
window.Profile = Profile;
