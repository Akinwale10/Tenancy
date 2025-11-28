/**
 * TenancyHub - Main Application JavaScript
 * Handles navigation, utilities, and core functionality
 */

// ========================================
// Application State
// ========================================
const TenancyHub = {
    // Local Storage Keys
    STORAGE_KEYS: {
        TENANTS: 'tenancyhub_tenants',
        AGREEMENTS: 'tenancyhub_agreements',
        PAYMENTS: 'tenancyhub_payments',
        CURRENT_USER: 'tenancyhub_current_user',
        PROPERTIES: 'tenancyhub_properties'
    },

    // Default Data
    defaultTenants: [
        {
            id: 1,
            name: 'John Smith',
            email: 'john.smith@email.com',
            phone: '+1 234 567 8901',
            photo: 'assets/images/user-placeholder.svg',
            propertyAddress: '123 Maple Street, Apt 4B',
            moveInDate: '2024-01-15',
            rentAmount: 1500,
            agreementStatus: 'active',
            lastPaymentDate: '2024-11-01',
            nextDueDate: '2025-11-01'
        },
        {
            id: 2,
            name: 'Sarah Johnson',
            email: 'sarah.j@email.com',
            phone: '+1 234 567 8902',
            photo: 'assets/images/user-placeholder.svg',
            propertyAddress: '456 Oak Avenue, Suite 12',
            moveInDate: '2024-03-01',
            rentAmount: 1800,
            agreementStatus: 'active',
            lastPaymentDate: '2024-10-15',
            nextDueDate: '2025-10-15'
        },
        {
            id: 3,
            name: 'Michael Brown',
            email: 'michael.b@email.com',
            phone: '+1 234 567 8903',
            photo: 'assets/images/user-placeholder.svg',
            propertyAddress: '789 Pine Road, Unit 7',
            moveInDate: '2023-06-01',
            rentAmount: 1200,
            agreementStatus: 'active',
            lastPaymentDate: '2023-11-20',
            nextDueDate: '2024-11-20'
        }
    ],

    defaultAgreements: [
        {
            id: 1,
            tenantId: 1,
            propertyAddress: '123 Maple Street, Apt 4B',
            startDate: '2024-01-15',
            endDate: '2025-01-15',
            rentAmount: 1500,
            securityDeposit: 3000,
            status: 'active',
            terms: {
                petsAllowed: false,
                smokingAllowed: false,
                guestPolicy: '14 days max',
                maintenanceResponsibility: 'landlord'
            }
        },
        {
            id: 2,
            tenantId: 2,
            propertyAddress: '456 Oak Avenue, Suite 12',
            startDate: '2024-03-01',
            endDate: '2025-03-01',
            rentAmount: 1800,
            securityDeposit: 3600,
            status: 'active',
            terms: {
                petsAllowed: true,
                smokingAllowed: false,
                guestPolicy: '30 days max',
                maintenanceResponsibility: 'landlord'
            }
        }
    ],

    defaultPayments: [
        {
            id: 1,
            tenantId: 1,
            tenantName: 'John Smith',
            amount: 1500,
            date: '2024-11-01',
            nextDueDate: '2025-11-01',
            status: 'paid',
            method: 'Bank Transfer'
        },
        {
            id: 2,
            tenantId: 2,
            tenantName: 'Sarah Johnson',
            amount: 1800,
            date: '2024-10-15',
            nextDueDate: '2025-10-15',
            status: 'paid',
            method: 'Credit Card'
        },
        {
            id: 3,
            tenantId: 3,
            tenantName: 'Michael Brown',
            amount: 1200,
            date: '2023-11-20',
            nextDueDate: '2024-11-20',
            status: 'overdue',
            method: 'Cash'
        }
    ],

    // Initialize Application
    init() {
        this.initializeStorage();
        this.setupNavigation();
        this.setupMobileMenu();
        this.setupModals();
        this.checkLoginStatus();
    },

    // ========================================
    // Local Storage Management
    // ========================================
    initializeStorage() {
        if (!localStorage.getItem(this.STORAGE_KEYS.TENANTS)) {
            localStorage.setItem(this.STORAGE_KEYS.TENANTS, JSON.stringify(this.defaultTenants));
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.AGREEMENTS)) {
            localStorage.setItem(this.STORAGE_KEYS.AGREEMENTS, JSON.stringify(this.defaultAgreements));
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.PAYMENTS)) {
            localStorage.setItem(this.STORAGE_KEYS.PAYMENTS, JSON.stringify(this.defaultPayments));
        }
    },

    getData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return null;
        }
    },

    setData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error writing to localStorage:', e);
            return false;
        }
    },

    // ========================================
    // Navigation
    // ========================================
    setupNavigation() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-links a');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                link.classList.add('active');
            }
        });
    },

    setupMobileMenu() {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');
        const navButtons = document.querySelector('.nav-buttons');

        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                navLinks?.classList.toggle('active');
                navButtons?.classList.toggle('active');
            });
        }
    },

    // ========================================
    // Modal Management
    // ========================================
    setupModals() {
        const modalOverlays = document.querySelectorAll('.modal-overlay');
        
        modalOverlays.forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeModal(overlay);
                }
            });
        });

        const modalCloseButtons = document.querySelectorAll('.modal-close');
        modalCloseButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal-overlay');
                this.closeModal(modal);
            });
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal-overlay.active');
                if (activeModal) {
                    this.closeModal(activeModal);
                }
            }
        });
    },

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    closeModal(modal) {
        if (typeof modal === 'string') {
            modal = document.getElementById(modal);
        }
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    // ========================================
    // Authentication (Simulated)
    // ========================================
    checkLoginStatus() {
        const currentUser = this.getData(this.STORAGE_KEYS.CURRENT_USER);
        this.updateAuthUI(currentUser);
    },

    login(email, password, userType = 'tenant') {
        // Simulated login
        const user = {
            id: Date.now(),
            email: email,
            name: email.split('@')[0],
            type: userType,
            loggedIn: true
        };
        
        this.setData(this.STORAGE_KEYS.CURRENT_USER, user);
        this.updateAuthUI(user);
        this.showNotification('Login successful!', 'success');
        return user;
    },

    logout() {
        localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
        this.updateAuthUI(null);
        this.showNotification('Logged out successfully', 'success');
        window.location.href = 'index.html';
    },

    register(userData) {
        const newUser = {
            id: Date.now(),
            ...userData,
            loggedIn: true
        };
        
        // Add to tenants if registering as tenant
        if (userData.type === 'tenant') {
            const tenants = this.getData(this.STORAGE_KEYS.TENANTS) || [];
            tenants.push({
                id: newUser.id,
                name: userData.name,
                email: userData.email,
                phone: userData.phone || '',
                photo: 'assets/images/user-placeholder.svg',
                propertyAddress: '',
                moveInDate: '',
                rentAmount: 0,
                agreementStatus: 'pending',
                lastPaymentDate: null,
                nextDueDate: null
            });
            this.setData(this.STORAGE_KEYS.TENANTS, tenants);
        }
        
        this.setData(this.STORAGE_KEYS.CURRENT_USER, newUser);
        this.updateAuthUI(newUser);
        this.showNotification('Registration successful!', 'success');
        return newUser;
    },

    updateAuthUI(user) {
        const loginBtn = document.querySelector('.btn-login');
        const registerBtn = document.querySelector('.btn-register');
        const logoutBtn = document.querySelector('.btn-logout');
        const userDisplay = document.querySelector('.user-display');

        if (user && user.loggedIn) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            if (userDisplay) {
                userDisplay.textContent = `Welcome, ${user.name}`;
                userDisplay.style.display = 'inline-block';
            }
        } else {
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (registerBtn) registerBtn.style.display = 'inline-block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userDisplay) userDisplay.style.display = 'none';
        }
    },

    // ========================================
    // Notifications
    // ========================================
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} notification fade-in`;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 3000;
            min-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        notification.innerHTML = `
            <span>${type === 'success' ? '✓' : type === 'danger' ? '✕' : '⚠'}</span>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    // ========================================
    // Utility Functions
    // ========================================
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    formatShortDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    generateId() {
        return Date.now() + Math.random().toString(36).substring(2, 9);
    },

    getDaysUntil(dateString) {
        if (!dateString) return null;
        const targetDate = new Date(dateString);
        const today = new Date();
        const diffTime = targetDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    getPaymentStatus(nextDueDate) {
        const days = this.getDaysUntil(nextDueDate);
        if (days === null) return 'pending';
        if (days < 0) return 'overdue';
        if (days <= 30) return 'due';
        return 'paid';
    }
};

// ========================================
// Authentication Forms Handling
// ========================================
function setupAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const email = formData.get('email');
            const password = formData.get('password');
            
            TenancyHub.login(email, password);
            TenancyHub.closeModal('loginModal');
            
            // Redirect based on context
            const currentPage = window.location.pathname.split('/').pop();
            if (currentPage === 'index.html' || currentPage === '') {
                // Stay on home page
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);
            
            const userData = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                password: formData.get('password'),
                type: formData.get('userType') || 'tenant'
            };
            
            TenancyHub.register(userData);
            TenancyHub.closeModal('registerModal');
        });
    }
}

// ========================================
// Scroll Animations
// ========================================
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card, .card, .stat-card').forEach(el => {
        observer.observe(el);
    });
}

// ========================================
// Initialize on DOM Load
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    TenancyHub.init();
    setupAuthForms();
    setupScrollAnimations();
});

// Export for use in other modules
window.TenancyHub = TenancyHub;
