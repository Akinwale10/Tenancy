/**
 * TenancyHub - Dashboard JavaScript
 * Handles admin dashboard functionality
 */

const Dashboard = {
    currentFilter: 'all',

    init() {
        this.loadDashboardData();
        this.setupFilters();
        this.setupEventListeners();
        this.updateStats();
    },

    // ========================================
    // Load Dashboard Data
    // ========================================
    loadDashboardData() {
        this.renderTenantsTable();
        this.renderPaymentsTable();
        this.renderAgreementsTable();
    },

    // ========================================
    // Statistics
    // ========================================
    updateStats() {
        const tenants = TenancyHub.getData(TenancyHub.STORAGE_KEYS.TENANTS) || [];
        const payments = TenancyHub.getData(TenancyHub.STORAGE_KEYS.PAYMENTS) || [];
        const agreements = TenancyHub.getData(TenancyHub.STORAGE_KEYS.AGREEMENTS) || [];

        const totalTenants = tenants.length;
        const activeAgreements = agreements.filter(a => a.status === 'active').length;
        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        
        const overduePayments = payments.filter(p => {
            const days = TenancyHub.getDaysUntil(p.nextDueDate);
            return days !== null && days < 0;
        }).length;

        // Update stat cards
        const statElements = {
            'total-tenants': totalTenants,
            'active-agreements': activeAgreements,
            'total-revenue': TenancyHub.formatCurrency(totalRevenue),
            'overdue-payments': overduePayments
        };

        Object.keys(statElements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = statElements[id];
            }
        });
    },

    // ========================================
    // Tenants Table
    // ========================================
    renderTenantsTable() {
        const tableBody = document.getElementById('tenants-table-body');
        if (!tableBody) return;

        const tenants = TenancyHub.getData(TenancyHub.STORAGE_KEYS.TENANTS) || [];

        if (tenants.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="empty-state">
                            <div class="empty-state-icon">👤</div>
                            <p>No tenants found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = tenants.map(tenant => {
            const status = TenancyHub.getPaymentStatus(tenant.nextDueDate);
            return `
                <tr>
                    <td>
                        <div class="flex items-center gap-2">
                            <img src="${tenant.photo}" alt="${tenant.name}" 
                                 style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                            <span>${tenant.name}</span>
                        </div>
                    </td>
                    <td>${tenant.email}</td>
                    <td>${tenant.propertyAddress || 'Not assigned'}</td>
                    <td>${TenancyHub.formatCurrency(tenant.rentAmount)}</td>
                    <td>
                        <span class="status-badge status-${status}">${status}</span>
                    </td>
                    <td>
                        <button class="btn btn-small btn-primary" onclick="Dashboard.viewTenant(${tenant.id})">
                            View
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    viewTenant(tenantId) {
        const tenants = TenancyHub.getData(TenancyHub.STORAGE_KEYS.TENANTS) || [];
        const tenant = tenants.find(t => t.id === tenantId);
        
        if (tenant) {
            const modalContent = document.getElementById('tenant-details-content');
            if (modalContent) {
                modalContent.innerHTML = `
                    <div class="profile-header">
                        <div class="profile-photo-container">
                            <img src="${tenant.photo}" alt="${tenant.name}" class="profile-photo">
                        </div>
                        <div class="profile-info">
                            <h2>${tenant.name}</h2>
                            <p>📧 ${tenant.email}</p>
                            <p>📱 ${tenant.phone}</p>
                            <p>🏠 ${tenant.propertyAddress || 'Not assigned'}</p>
                        </div>
                    </div>
                    <div class="form-row mt-3">
                        <div class="form-group">
                            <label>Move-in Date</label>
                            <p>${TenancyHub.formatDate(tenant.moveInDate)}</p>
                        </div>
                        <div class="form-group">
                            <label>Monthly Rent</label>
                            <p>${TenancyHub.formatCurrency(tenant.rentAmount)}</p>
                        </div>
                        <div class="form-group">
                            <label>Agreement Status</label>
                            <span class="status-badge status-${tenant.agreementStatus === 'active' ? 'paid' : 'pending'}">
                                ${tenant.agreementStatus}
                            </span>
                        </div>
                        <div class="form-group">
                            <label>Last Payment</label>
                            <p>${TenancyHub.formatDate(tenant.lastPaymentDate)}</p>
                        </div>
                    </div>
                `;
                TenancyHub.openModal('tenantDetailsModal');
            }
        }
    },

    // ========================================
    // Payments Table
    // ========================================
    renderPaymentsTable(filter = 'all') {
        const tableBody = document.getElementById('payments-table-body');
        if (!tableBody) return;

        let payments = TenancyHub.getData(TenancyHub.STORAGE_KEYS.PAYMENTS) || [];

        // Apply filter
        if (filter !== 'all') {
            payments = payments.filter(p => {
                const status = TenancyHub.getPaymentStatus(p.nextDueDate);
                return status === filter;
            });
        }

        if (payments.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="empty-state">
                            <div class="empty-state-icon">💳</div>
                            <p>No payments found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = payments.map(payment => {
            const status = TenancyHub.getPaymentStatus(payment.nextDueDate);
            return `
                <tr>
                    <td>${payment.tenantName}</td>
                    <td>${TenancyHub.formatCurrency(payment.amount)}</td>
                    <td>${TenancyHub.formatShortDate(payment.date)}</td>
                    <td>${TenancyHub.formatShortDate(payment.nextDueDate)}</td>
                    <td>
                        <span class="status-badge status-${status}">${status}</span>
                    </td>
                    <td>${payment.method}</td>
                </tr>
            `;
        }).join('');
    },

    // ========================================
    // Agreements Table
    // ========================================
    renderAgreementsTable() {
        const tableBody = document.getElementById('agreements-table-body');
        if (!tableBody) return;

        const agreements = TenancyHub.getData(TenancyHub.STORAGE_KEYS.AGREEMENTS) || [];
        const tenants = TenancyHub.getData(TenancyHub.STORAGE_KEYS.TENANTS) || [];

        if (agreements.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="empty-state">
                            <div class="empty-state-icon">📄</div>
                            <p>No agreements found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = agreements.map(agreement => {
            const tenant = tenants.find(t => t.id === agreement.tenantId);
            return `
                <tr>
                    <td>${tenant ? tenant.name : 'Unknown'}</td>
                    <td>${agreement.propertyAddress}</td>
                    <td>${TenancyHub.formatShortDate(agreement.startDate)}</td>
                    <td>${TenancyHub.formatShortDate(agreement.endDate)}</td>
                    <td>
                        <span class="status-badge status-${agreement.status === 'active' ? 'paid' : 'pending'}">
                            ${agreement.status}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-small btn-primary" onclick="Dashboard.viewAgreement(${agreement.id})">
                            View
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    viewAgreement(agreementId) {
        const agreements = TenancyHub.getData(TenancyHub.STORAGE_KEYS.AGREEMENTS) || [];
        const agreement = agreements.find(a => a.id === agreementId);
        const tenants = TenancyHub.getData(TenancyHub.STORAGE_KEYS.TENANTS) || [];
        
        if (agreement) {
            const tenant = tenants.find(t => t.id === agreement.tenantId);
            const modalContent = document.getElementById('agreement-details-content');
            if (modalContent) {
                modalContent.innerHTML = `
                    <h4 class="text-orange mb-2">Property Details</h4>
                    <p><strong>Address:</strong> ${agreement.propertyAddress}</p>
                    <p><strong>Tenant:</strong> ${tenant ? tenant.name : 'Unknown'}</p>
                    
                    <h4 class="text-orange mb-2 mt-3">Lease Period</h4>
                    <p><strong>Start Date:</strong> ${TenancyHub.formatDate(agreement.startDate)}</p>
                    <p><strong>End Date:</strong> ${TenancyHub.formatDate(agreement.endDate)}</p>
                    
                    <h4 class="text-orange mb-2 mt-3">Financial Terms</h4>
                    <p><strong>Monthly Rent:</strong> ${TenancyHub.formatCurrency(agreement.rentAmount)}</p>
                    <p><strong>Security Deposit:</strong> ${TenancyHub.formatCurrency(agreement.securityDeposit)}</p>
                    
                    <h4 class="text-orange mb-2 mt-3">Terms & Conditions</h4>
                    <p><strong>Pets Allowed:</strong> ${agreement.terms.petsAllowed ? 'Yes' : 'No'}</p>
                    <p><strong>Smoking Allowed:</strong> ${agreement.terms.smokingAllowed ? 'Yes' : 'No'}</p>
                    <p><strong>Guest Policy:</strong> ${agreement.terms.guestPolicy}</p>
                    <p><strong>Maintenance:</strong> ${agreement.terms.maintenanceResponsibility}</p>
                `;
                TenancyHub.openModal('agreementDetailsModal');
            }
        }
    },

    // ========================================
    // Filters
    // ========================================
    setupFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                this.currentFilter = filter;
                this.renderPaymentsTable(filter);
            });
        });
    },

    // ========================================
    // Event Listeners
    // ========================================
    setupEventListeners() {
        // Property upload form
        const propertyForm = document.getElementById('property-upload-form');
        if (propertyForm) {
            propertyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePropertyUpload(e);
            });
        }

        // Add tenant form
        const addTenantForm = document.getElementById('add-tenant-form');
        if (addTenantForm) {
            addTenantForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddTenant(e);
            });
        }
    },

    handlePropertyUpload(e) {
        const formData = new FormData(e.target);
        const propertyData = {
            id: TenancyHub.generateId(),
            name: formData.get('propertyName'),
            address: formData.get('propertyAddress'),
            type: formData.get('propertyType'),
            rent: parseFloat(formData.get('rentAmount')),
            image: 'assets/images/building1.jpg', // Placeholder
            createdAt: new Date().toISOString()
        };

        const properties = TenancyHub.getData(TenancyHub.STORAGE_KEYS.PROPERTIES) || [];
        properties.push(propertyData);
        TenancyHub.setData(TenancyHub.STORAGE_KEYS.PROPERTIES, properties);

        TenancyHub.showNotification('Property added successfully!', 'success');
        TenancyHub.closeModal('addPropertyModal');
        e.target.reset();
    },

    handleAddTenant(e) {
        const formData = new FormData(e.target);
        const tenantData = {
            id: parseInt(TenancyHub.generateId()),
            name: formData.get('tenantName'),
            email: formData.get('tenantEmail'),
            phone: formData.get('tenantPhone'),
            photo: 'assets/images/user-placeholder.svg',
            propertyAddress: formData.get('propertyAddress'),
            moveInDate: formData.get('moveInDate'),
            rentAmount: parseFloat(formData.get('rentAmount')),
            agreementStatus: 'pending',
            lastPaymentDate: null,
            nextDueDate: null
        };

        const tenants = TenancyHub.getData(TenancyHub.STORAGE_KEYS.TENANTS) || [];
        tenants.push(tenantData);
        TenancyHub.setData(TenancyHub.STORAGE_KEYS.TENANTS, tenants);

        TenancyHub.showNotification('Tenant added successfully!', 'success');
        TenancyHub.closeModal('addTenantModal');
        this.renderTenantsTable();
        this.updateStats();
        e.target.reset();
    },

    // ========================================
    // Refresh Data
    // ========================================
    refreshData() {
        this.loadDashboardData();
        this.updateStats();
        TenancyHub.showNotification('Dashboard refreshed', 'success');
    }
};

// Initialize Dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('dashboard-page')) {
        Dashboard.init();
    }
});

// Export for global access
window.Dashboard = Dashboard;
