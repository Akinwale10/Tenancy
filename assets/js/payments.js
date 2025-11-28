/**
 * TenancyHub - Payments JavaScript
 * Handles payment system and countdown timer
 */

const Payments = {
    currentTenant: null,

    init() {
        this.loadCurrentTenant();
        this.renderPaymentDashboard();
        this.setupEventListeners();
    },

    // ========================================
    // Load Current Tenant
    // ========================================
    loadCurrentTenant() {
        const currentUser = TenancyHub.getData(TenancyHub.STORAGE_KEYS.CURRENT_USER);
        const tenants = TenancyHub.getData(TenancyHub.STORAGE_KEYS.TENANTS) || [];
        
        if (currentUser) {
            this.currentTenant = tenants.find(t => t.email === currentUser.email) || tenants[0];
        } else {
            this.currentTenant = tenants[0];
        }
    },

    // ========================================
    // Render Payment Dashboard
    // ========================================
    renderPaymentDashboard() {
        this.renderPaymentStatus();
        this.renderPaymentHistory();
        this.renderCountdown();
    },

    renderPaymentStatus() {
        const statusContainer = document.getElementById('payment-status-container');
        if (!statusContainer || !this.currentTenant) return;

        const status = TenancyHub.getPaymentStatus(this.currentTenant.nextDueDate);
        const nextDueDate = this.currentTenant.nextDueDate;
        const daysUntil = TenancyHub.getDaysUntil(nextDueDate);

        let statusMessage = '';
        let statusClass = '';

        if (daysUntil === null) {
            statusMessage = 'No payment recorded yet';
            statusClass = 'pending';
        } else if (daysUntil < 0) {
            statusMessage = `Payment overdue by ${Math.abs(daysUntil)} days`;
            statusClass = 'overdue';
        } else if (daysUntil <= 30) {
            statusMessage = `Payment due in ${daysUntil} days`;
            statusClass = 'due';
        } else {
            statusMessage = `Next payment in ${daysUntil} days`;
            statusClass = 'paid';
        }

        statusContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${TenancyHub.formatCurrency(this.currentTenant.rentAmount)}</div>
                    <div class="stat-label">Monthly Rent</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${TenancyHub.formatShortDate(this.currentTenant.lastPaymentDate) || 'N/A'}</div>
                    <div class="stat-label">Last Payment</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${TenancyHub.formatShortDate(nextDueDate) || 'N/A'}</div>
                    <div class="stat-label">Next Due Date</div>
                </div>
                <div class="stat-card">
                    <span class="status-badge status-${statusClass}" style="font-size: 1rem; padding: 10px 20px;">
                        ${status.toUpperCase()}
                    </span>
                    <div class="stat-label mt-2">${statusMessage}</div>
                </div>
            </div>
        `;
    },

    renderPaymentHistory() {
        const historyContainer = document.getElementById('full-payment-history');
        if (!historyContainer) return;

        const payments = TenancyHub.getData(TenancyHub.STORAGE_KEYS.PAYMENTS) || [];
        const tenantPayments = this.currentTenant 
            ? payments.filter(p => p.tenantId === this.currentTenant.id)
            : [];

        if (tenantPayments.length === 0) {
            historyContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💳</div>
                    <h4>No Payment History</h4>
                    <p>Your payment history will appear here after you make a payment.</p>
                    <button class="btn btn-primary mt-3" onclick="Payments.openPaymentModal()">
                        Make First Payment
                    </button>
                </div>
            `;
            return;
        }

        historyContainer.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Payment Date</th>
                            <th>Amount</th>
                            <th>Payment Method</th>
                            <th>Next Due Date</th>
                            <th>Status</th>
                            <th>Receipt</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tenantPayments.map(payment => {
                            const status = TenancyHub.getPaymentStatus(payment.nextDueDate);
                            return `
                                <tr>
                                    <td>${TenancyHub.formatDate(payment.date)}</td>
                                    <td>${TenancyHub.formatCurrency(payment.amount)}</td>
                                    <td>${payment.method}</td>
                                    <td>${TenancyHub.formatDate(payment.nextDueDate)}</td>
                                    <td><span class="status-badge status-${status}">${status}</span></td>
                                    <td>
                                        <button class="btn btn-small btn-secondary" onclick="Payments.downloadReceipt(${payment.id})">
                                            Download
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderCountdown() {
        const countdownContainer = document.getElementById('payments-countdown');
        if (!countdownContainer || !this.currentTenant) return;

        if (!this.currentTenant.nextDueDate) {
            countdownContainer.innerHTML = `
                <div class="countdown-container">
                    <h4 class="countdown-title">No Active Rent Period</h4>
                    <p>Make a payment to start your 1-year rental countdown.</p>
                </div>
            `;
            return;
        }

        // Initial render
        this.updateCountdownDisplay();
        
        // Update every second
        setInterval(() => this.updateCountdownDisplay(), 1000);
    },

    updateCountdownDisplay() {
        const countdownContainer = document.getElementById('payments-countdown');
        if (!countdownContainer || !this.currentTenant || !this.currentTenant.nextDueDate) return;

        const targetDate = new Date(this.currentTenant.nextDueDate);
        const now = new Date();
        const diff = targetDate - now;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        let statusClass = '';
        let title = '⏰ Rent Due Countdown';
        
        if (days < 0) {
            statusClass = 'countdown-danger';
            title = '⚠️ RENT OVERDUE!';
        } else if (days <= 30) {
            statusClass = 'countdown-warning';
            title = '⏰ Rent Due Soon!';
        }

        countdownContainer.innerHTML = `
            <div class="countdown-container ${statusClass}">
                <h4 class="countdown-title">${title}</h4>
                <p class="mb-3">Due Date: ${TenancyHub.formatDate(this.currentTenant.nextDueDate)}</p>
                <div class="countdown-timer">
                    <div class="countdown-item">
                        <div class="countdown-value">${Math.abs(days)}</div>
                        <div class="countdown-label">${days < 0 ? 'Days Late' : 'Days'}</div>
                    </div>
                    <div class="countdown-item">
                        <div class="countdown-value">${String(Math.abs(hours)).padStart(2, '0')}</div>
                        <div class="countdown-label">Hours</div>
                    </div>
                    <div class="countdown-item">
                        <div class="countdown-value">${String(Math.abs(minutes)).padStart(2, '0')}</div>
                        <div class="countdown-label">Minutes</div>
                    </div>
                    <div class="countdown-item">
                        <div class="countdown-value">${String(Math.abs(seconds)).padStart(2, '0')}</div>
                        <div class="countdown-label">Seconds</div>
                    </div>
                </div>
            </div>
        `;
    },

    // ========================================
    // Payment Modal
    // ========================================
    openPaymentModal() {
        if (!this.currentTenant) {
            TenancyHub.showNotification('Please log in to make a payment', 'warning');
            return;
        }

        const form = document.getElementById('payment-form');
        if (form) {
            form.elements['amount'].value = this.currentTenant.rentAmount;
        }

        const tenantInfo = document.getElementById('payment-tenant-info');
        if (tenantInfo) {
            tenantInfo.innerHTML = `
                <p><strong>Tenant:</strong> ${this.currentTenant.name}</p>
                <p><strong>Property:</strong> ${this.currentTenant.propertyAddress}</p>
                <p><strong>Monthly Rent:</strong> ${TenancyHub.formatCurrency(this.currentTenant.rentAmount)}</p>
            `;
        }

        TenancyHub.openModal('paymentModal');
    },

    // ========================================
    // Process Payment
    // ========================================
    processPayment(e) {
        e.preventDefault();
        
        if (!this.currentTenant) {
            TenancyHub.showNotification('No tenant selected', 'danger');
            return;
        }

        const formData = new FormData(e.target);
        const amount = parseFloat(formData.get('amount'));
        const method = formData.get('paymentMethod');

        // Simulate payment processing
        this.showProcessing();

        setTimeout(() => {
            // Payment date is now
            const paymentDate = new Date().toISOString().split('T')[0];
            
            // Next due date is 1 year from payment
            const nextDue = new Date();
            nextDue.setFullYear(nextDue.getFullYear() + 1);
            const nextDueDate = nextDue.toISOString().split('T')[0];

            // Create payment record
            const payment = {
                id: parseInt(TenancyHub.generateId()),
                tenantId: this.currentTenant.id,
                tenantName: this.currentTenant.name,
                amount: amount,
                date: paymentDate,
                nextDueDate: nextDueDate,
                status: 'paid',
                method: method
            };

            // Save payment
            const payments = TenancyHub.getData(TenancyHub.STORAGE_KEYS.PAYMENTS) || [];
            payments.push(payment);
            TenancyHub.setData(TenancyHub.STORAGE_KEYS.PAYMENTS, payments);

            // Update tenant record
            const tenants = TenancyHub.getData(TenancyHub.STORAGE_KEYS.TENANTS) || [];
            const tenantIndex = tenants.findIndex(t => t.id === this.currentTenant.id);
            if (tenantIndex !== -1) {
                tenants[tenantIndex].lastPaymentDate = paymentDate;
                tenants[tenantIndex].nextDueDate = nextDueDate;
                TenancyHub.setData(TenancyHub.STORAGE_KEYS.TENANTS, tenants);
                this.currentTenant = tenants[tenantIndex];
            }

            // Close modal and show success
            TenancyHub.closeModal('paymentModal');
            this.showPaymentSuccess(payment);
            
            // Refresh displays
            this.renderPaymentDashboard();
            
        }, 2000); // Simulate 2 second processing time
    },

    showProcessing() {
        const submitBtn = document.querySelector('#payment-form button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner" style="width: 20px; height: 20px; display: inline-block; margin-right: 10px;"></span> Processing...';
        }
    },

    showPaymentSuccess(payment) {
        // Reset button
        const submitBtn = document.querySelector('#payment-form button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Make Payment';
        }

        // Show success modal
        const successContent = document.getElementById('payment-success-content');
        if (successContent) {
            successContent.innerHTML = `
                <div class="text-center">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">✅</div>
                    <h3 class="text-orange mb-3">Payment Successful!</h3>
                    <p>Thank you for your payment.</p>
                    <div class="card mt-3" style="text-align: left;">
                        <p><strong>Amount Paid:</strong> ${TenancyHub.formatCurrency(payment.amount)}</p>
                        <p><strong>Payment Date:</strong> ${TenancyHub.formatDate(payment.date)}</p>
                        <p><strong>Payment Method:</strong> ${payment.method}</p>
                        <p><strong>Next Due Date:</strong> ${TenancyHub.formatDate(payment.nextDueDate)}</p>
                        <p><strong>Transaction ID:</strong> TXN-${payment.id}</p>
                    </div>
                    <p class="mt-3">Your 1-year countdown has started!</p>
                </div>
            `;
            TenancyHub.openModal('paymentSuccessModal');
        } else {
            TenancyHub.showNotification('Payment successful! Your rent is now paid for 1 year.', 'success');
        }
    },

    // ========================================
    // Download Receipt
    // ========================================
    downloadReceipt(paymentId) {
        const payments = TenancyHub.getData(TenancyHub.STORAGE_KEYS.PAYMENTS) || [];
        const payment = payments.find(p => p.id === paymentId);

        if (!payment) {
            TenancyHub.showNotification('Receipt not found', 'danger');
            return;
        }

        // Generate receipt content
        const receiptContent = `
========================================
         TENANCYHUB PAYMENT RECEIPT
========================================

Transaction ID: TXN-${payment.id}
Date: ${TenancyHub.formatDate(payment.date)}

TENANT INFORMATION
------------------
Name: ${payment.tenantName}

PAYMENT DETAILS
---------------
Amount: ${TenancyHub.formatCurrency(payment.amount)}
Method: ${payment.method}
Status: ${payment.status.toUpperCase()}

NEXT PAYMENT
------------
Due Date: ${TenancyHub.formatDate(payment.nextDueDate)}

========================================
Thank you for using TenancyHub!
========================================
        `;

        // Create downloadable file
        const blob = new Blob([receiptContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-TXN-${payment.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        TenancyHub.showNotification('Receipt downloaded!', 'success');
    },

    // ========================================
    // Event Listeners
    // ========================================
    setupEventListeners() {
        const paymentForm = document.getElementById('payment-form');
        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => this.processPayment(e));
        }
    }
};

// Initialize Payments when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('payments-page')) {
        Payments.init();
    }
});

// Export for global access
window.Payments = Payments;
