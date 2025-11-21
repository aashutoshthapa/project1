// Supabase Configuration
const SUPABASE_URL = "https://dojgduyrtsoscnlcdvlp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvamdkdXlydHNvc2NubGNkdmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTg0MTgsImV4cCI6MjA3MDk3NDQxOH0.XaOSBK78KO1HB4F68zxJDKbbdLlwlJIbOGIF_wm84u0";

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Global state
let currentEditingItem = null;
let books = [];
let customers = [];
let transactions = [];

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarMenuItems = document.querySelectorAll('.sidebar-menu-item');
const pages = document.querySelectorAll('.page');
const quickActionItems = document.querySelectorAll('.quick-action-item');

// Modal elements
const bookModal = document.getElementById('bookModal');
const customerModal = document.getElementById('customerModal');
const transactionModal = document.getElementById('transactionModal');

// Form elements
const bookForm = document.getElementById('bookForm');
const customerForm = document.getElementById('customerForm');
const transactionForm = document.getElementById('transactionForm');

// Table bodies
const booksTableBody = document.getElementById('booksTableBody');
const customersTableBody = document.getElementById('customersTableBody');
const transactionsTableBody = document.getElementById('transactionsTableBody');

// Toast container
const toastContainer = document.getElementById('toastContainer');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadDashboardStats();
    setupRouting();
}

// Event Listeners Setup
function setupEventListeners() {
    // Sidebar toggle
    sidebarToggle.addEventListener('click', toggleSidebar);

    // Navigation
    sidebarMenuItems.forEach(item => {
        item.addEventListener('click', handleNavigation);
    });

    quickActionItems.forEach(item => {
        item.addEventListener('click', handleQuickAction);
    });

    // Modal buttons
    document.getElementById('addBookBtn').addEventListener('click', () => openBookModal());
    document.getElementById('addCustomerBtn').addEventListener('click', () => openCustomerModal());
    document.getElementById('addTransactionBtn').addEventListener('click', () => openTransactionModal());

    // Modal close buttons
    document.getElementById('closeBookModal').addEventListener('click', () => closeBookModal());
    document.getElementById('closeCustomerModal').addEventListener('click', () => closeCustomerModal());
    document.getElementById('closeTransactionModal').addEventListener('click', () => closeTransactionModal());

    // Cancel buttons
    document.getElementById('cancelBookBtn').addEventListener('click', () => closeBookModal());
    document.getElementById('cancelCustomerBtn').addEventListener('click', () => closeCustomerModal());
    document.getElementById('cancelTransactionBtn').addEventListener('click', () => closeTransactionModal());

    // Form submissions
    bookForm.addEventListener('submit', handleBookSubmit);
    customerForm.addEventListener('submit', handleCustomerSubmit);
    transactionForm.addEventListener('submit', handleTransactionSubmit);

    // Modal backdrop clicks
    bookModal.addEventListener('click', (e) => {
        if (e.target === bookModal) closeBookModal();
    });
    customerModal.addEventListener('click', (e) => {
        if (e.target === customerModal) closeCustomerModal();
    });
    transactionModal.addEventListener('click', (e) => {
        if (e.target === transactionModal) closeTransactionModal();
    });

    // Set default date for transaction form
    document.getElementById('transactionIssueDate').value = new Date().toISOString().split('T')[0];
}

// Sidebar Functions
function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
}

// Navigation Functions
function handleNavigation(e) {
    e.preventDefault();
    const targetPage = e.currentTarget.getAttribute('data-page');
    navigateToPage(targetPage);
}

function handleQuickAction(e) {
    const targetPage = e.currentTarget.getAttribute('data-page');
    navigateToPage(targetPage);
}

function navigateToPage(pageName) {
    // Update active navigation item
    sidebarMenuItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === pageName) {
            item.classList.add('active');
        }
    });

    // Show target page
    pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === pageName) {
            page.classList.add('active');
        }
    });

    // Load page-specific data
    switch (pageName) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'books':
            loadBooks();
            break;
        case 'customers':
            loadCustomers();
            break;
        case 'transactions':
            loadTransactions();
            break;
    }

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
    }
}

// Setup routing for hash changes
function setupRouting() {
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
}

function handleHashChange() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    navigateToPage(hash);
}

// Dashboard Functions
async function loadDashboardStats() {
    try {
        const [booksResult, customersResult, transactionsResult, returnedResult] = await Promise.all([
            supabase.from("books").select("quantity"),
            supabase.from("customers").select("id", { count: "exact" }),
            supabase.from("transactions").select("id", { count: "exact" }).eq("returned", false),
            supabase.from("transactions").select("id", { count: "exact" }).eq("returned", true),
        ]);

        const totalBooks = booksResult.data?.reduce((sum, book) => sum + (book.quantity || 0), 0) || 0;

        document.getElementById('totalBooks').textContent = totalBooks;
        document.getElementById('totalCustomers').textContent = customersResult.count || 0;
        document.getElementById('activeTransactions').textContent = transactionsResult.count || 0;
        document.getElementById('returnedBooks').textContent = returnedResult.count || 0;
    } catch (error) {
        console.error("Error fetching stats:", error);
        showToast("Error", "Failed to load dashboard stats", "error");
    }
}

// Books Functions
async function loadBooks() {
    try {
        const { data, error } = await supabase.from("books").select("*").order("name");
        if (error) throw error;
        
        books = data || [];
        renderBooksTable();
    } catch (error) {
        console.error("Error fetching books:", error);
        showToast("Error", "Failed to fetch books", "error");
    }
}

function renderBooksTable() {
    booksTableBody.innerHTML = books.map(book => `
        <tr>
            <td class="font-medium">${book.name}</td>
            <td>${book.author || "N/A"}</td>
            <td>${book.genre || "N/A"}</td>
            <td>${book.quantity}</td>
            <td>
                <span class="badge ${book.quantity > 0 ? 'badge-default' : 'badge-secondary'}">
                    ${book.quantity > 0 ? `${book.quantity} available` : "Out of stock"}
                </span>
            </td>
            <td>
                <div class="flex gap-2">
                    <button class="btn btn-outline btn-sm" onclick="editBook('${book.id}')">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="btn btn-destructive btn-sm" onclick="deleteBook('${book.id}')">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openBookModal(book = null) {
    currentEditingItem = book;
    const modalTitle = document.getElementById('bookModalTitle');
    const form = document.getElementById('bookForm');
    
    modalTitle.textContent = book ? "Edit Book" : "Add New Book";
    
    if (book) {
        document.getElementById('bookName').value = book.name;
        document.getElementById('bookAuthor').value = book.author || '';
        document.getElementById('bookGenre').value = book.genre || '';
        document.getElementById('bookQuantity').value = book.quantity;
    } else {
        form.reset();
    }
    
    bookModal.classList.add('active');
}

function closeBookModal() {
    bookModal.classList.remove('active');
    currentEditingItem = null;
    bookForm.reset();
}

async function handleBookSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const bookData = {
        name: formData.get('name'),
        author: formData.get('author'),
        genre: formData.get('genre'),
        quantity: parseInt(formData.get('quantity')) || 0
    };

    try {
        if (currentEditingItem) {
            const { error } = await supabase
                .from("books")
                .update(bookData)
                .eq("id", currentEditingItem.id);
            if (error) throw error;
            showToast("Success", "Book updated successfully", "success");
        } else {
            const { error } = await supabase.from("books").insert([bookData]);
            if (error) throw error;
            showToast("Success", "Book added successfully", "success");
        }
        
        closeBookModal();
        loadBooks();
        loadDashboardStats();
    } catch (error) {
        console.error("Error saving book:", error);
        showToast("Error", "Failed to save book", "error");
    }
}

async function editBook(id) {
    const book = books.find(b => b.id === id);
    if (book) {
        openBookModal(book);
    }
}

async function deleteBook(id) {
    if (!confirm("Are you sure you want to delete this book?")) return;
    
    try {
        const { error } = await supabase.from("books").delete().eq("id", id);
        if (error) throw error;
        showToast("Success", "Book deleted successfully", "success");
        loadBooks();
        loadDashboardStats();
    } catch (error) {
        console.error("Error deleting book:", error);
        showToast("Error", "Failed to delete book", "error");
    }
}

// Customers Functions
async function loadCustomers() {
    try {
        const { data, error } = await supabase.from("customers").select("*").order("name");
        if (error) throw error;
        
        customers = data || [];
        renderCustomersTable();
        updateCustomerSelects();
    } catch (error) {
        console.error("Error fetching customers:", error);
        showToast("Error", "Failed to fetch customers", "error");
    }
}

function renderCustomersTable() {
    customersTableBody.innerHTML = customers.map(customer => `
        <tr>
            <td class="font-medium">${customer.name}</td>
            <td>${customer.address || "N/A"}</td>
            <td>${customer.phone_number || "N/A"}</td>
            <td>${customer.age || "N/A"}</td>
            <td>${customer.gender || "N/A"}</td>
            <td>
                <div class="flex gap-2">
                    <button class="btn btn-outline btn-sm" onclick="editCustomer('${customer.id}')">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="btn btn-destructive btn-sm" onclick="deleteCustomer('${customer.id}')">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openCustomerModal(customer = null) {
    currentEditingItem = customer;
    const modalTitle = document.getElementById('customerModalTitle');
    const form = document.getElementById('customerForm');
    
    modalTitle.textContent = customer ? "Edit Customer" : "Add New Customer";
    
    if (customer) {
        document.getElementById('customerName').value = customer.name;
        document.getElementById('customerAddress').value = customer.address || '';
        document.getElementById('customerPhone').value = customer.phone_number || '';
        document.getElementById('customerAge').value = customer.age || '';
        document.getElementById('customerGender').value = customer.gender || '';
    } else {
        form.reset();
    }
    
    customerModal.classList.add('active');
}

function closeCustomerModal() {
    customerModal.classList.remove('active');
    currentEditingItem = null;
    customerForm.reset();
}

async function handleCustomerSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const customerData = {
        name: formData.get('name'),
        address: formData.get('address'),
        phone_number: formData.get('phone_number'),
        age: parseInt(formData.get('age')) || 0,
        gender: formData.get('gender')
    };

    try {
        if (currentEditingItem) {
            const { error } = await supabase
                .from("customers")
                .update(customerData)
                .eq("id", currentEditingItem.id);
            if (error) throw error;
            showToast("Success", "Customer updated successfully", "success");
        } else {
            const { error } = await supabase.from("customers").insert([customerData]);
            if (error) throw error;
            showToast("Success", "Customer added successfully", "success");
        }
        
        closeCustomerModal();
        loadCustomers();
        loadDashboardStats();
    } catch (error) {
        console.error("Error saving customer:", error);
        showToast("Error", "Failed to save customer", "error");
    }
}

async function editCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (customer) {
        openCustomerModal(customer);
    }
}

async function deleteCustomer(id) {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    
    try {
        const { error } = await supabase.from("customers").delete().eq("id", id);
        if (error) throw error;
        showToast("Success", "Customer deleted successfully", "success");
        loadCustomers();
        loadDashboardStats();
    } catch (error) {
        console.error("Error deleting customer:", error);
        showToast("Error", "Failed to delete customer", "error");
    }
}

// Transactions Functions
async function loadTransactions() {
    try {
        const { data, error } = await supabase
            .from("transactions")
            .select(`
                *,
                customers (name),
                books (name)
            `)
            .order("issue_date", { ascending: false });
        
        if (error) throw error;
        
        transactions = data || [];
        renderTransactionsTable();
    } catch (error) {
        console.error("Error fetching transactions:", error);
        showToast("Error", "Failed to fetch transactions", "error");
    }
}

function renderTransactionsTable() {
    transactionsTableBody.innerHTML = transactions.map(transaction => `
        <tr>
            <td class="font-medium">${transaction.customers?.name || 'N/A'}</td>
            <td>${transaction.books?.name || 'N/A'}</td>
            <td>${new Date(transaction.issue_date).toLocaleDateString()}</td>
            <td>${transaction.return_date ? new Date(transaction.return_date).toLocaleDateString() : "Not set"}</td>
            <td>
                <span class="badge ${transaction.returned ? 'badge-default' : 'badge-secondary'}">
                    ${transaction.returned ? "Returned" : "Issued"}
                </span>
            </td>
            <td>
                <div class="flex gap-2">
                    <button class="btn btn-outline btn-sm" onclick="editTransaction('${transaction.id}')">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    ${!transaction.returned ? `
                        <button class="btn btn-primary btn-sm" onclick="markAsReturned('${transaction.id}')">
                            <i class="fas fa-check-circle"></i>
                            Return
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function openTransactionModal(transaction = null) {
    currentEditingItem = transaction;
    const modalTitle = document.getElementById('transactionModalTitle');
    const form = document.getElementById('transactionForm');
    
    modalTitle.textContent = transaction ? "Edit Transaction" : "Issue New Book";
    
    if (transaction) {
        document.getElementById('transactionCustomer').value = transaction.customer_id;
        document.getElementById('transactionBook').value = transaction.book_id;
        document.getElementById('transactionIssueDate').value = transaction.issue_date;
        document.getElementById('transactionReturnDate').value = transaction.return_date || '';
    } else {
        form.reset();
        document.getElementById('transactionIssueDate').value = new Date().toISOString().split('T')[0];
    }
    
    transactionModal.classList.add('active');
}

function closeTransactionModal() {
    transactionModal.classList.remove('active');
    currentEditingItem = null;
    transactionForm.reset();
    document.getElementById('transactionIssueDate').value = new Date().toISOString().split('T')[0];
}

async function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const transactionData = {
        customer_id: formData.get('customer_id'),
        book_id: formData.get('book_id'),
        issue_date: formData.get('issue_date'),
        return_date: formData.get('return_date')
    };

    try {
        if (currentEditingItem) {
            const { error } = await supabase
                .from("transactions")
                .update(transactionData)
                .eq("id", currentEditingItem.id);
            if (error) throw error;
            showToast("Success", "Transaction updated successfully", "success");
        } else {
            // Check if book is available
            const { data: book } = await supabase
                .from("books")
                .select("quantity")
                .eq("id", transactionData.book_id)
                .single();
            
            if (!book || book.quantity <= 0) {
                showToast("Error", "Book is not available for issue", "error");
                return;
            }

            // Use atomic update to prevent race conditions
            const { error: bookError } = await supabase
                .from("books")
                .update({ quantity: book.quantity - 1 })
                .eq("id", transactionData.book_id)
                .eq("quantity", book.quantity);
            
            if (bookError) {
                showToast("Error", "Failed to update book quantity", "error");
                return;
            }

            const { error: transactionError } = await supabase.from("transactions").insert([transactionData]);
            if (transactionError) throw transactionError;

            showToast("Success", "Book issued successfully", "success");
        }
        
        closeTransactionModal();
        loadTransactions();
        loadBooks();
        loadDashboardStats();
    } catch (error) {
        console.error("Error saving transaction:", error);
        showToast("Error", "Failed to save transaction", "error");
    }
}

async function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
        openTransactionModal(transaction);
    }
}

async function markAsReturned(id) {
    try {
        // Get transaction details to know which book to increase quantity
        const { data: transaction } = await supabase
            .from("transactions")
            .select("book_id")
            .eq("id", id)
            .single();
        
        if (!transaction) throw new Error("Transaction not found");

        // Update transaction as returned
        const { error: transactionError } = await supabase
            .from("transactions")
            .update({ 
                returned: true,
                return_date: new Date().toISOString().split('T')[0]
            })
            .eq("id", id);
        
        if (transactionError) throw transactionError;

        // Increase book quantity atomically
        const { data: book } = await supabase
            .from("books")
            .select("quantity")
            .eq("id", transaction.book_id)
            .single();
        
        if (book) {
            const { error: bookError } = await supabase
                .from("books")
                .update({ quantity: book.quantity + 1 })
                .eq("id", transaction.book_id);
            if (bookError) throw bookError;
        }

        showToast("Success", "Book marked as returned", "success");
        loadTransactions();
        loadBooks();
        loadDashboardStats();
    } catch (error) {
        console.error("Error marking book as returned:", error);
        showToast("Error", "Failed to mark book as returned", "error");
    }
}

// Utility Functions
function updateCustomerSelects() {
    const customerSelect = document.getElementById('transactionCustomer');
    customerSelect.innerHTML = '<option value="">Select customer</option>' +
        customers.map(customer => 
            `<option value="${customer.id}">${customer.name}</option>`
        ).join('');
}

async function loadBooksForTransaction() {
    try {
        const { data, error } = await supabase
            .from("books")
            .select("id, name, quantity")
            .gt("quantity", 0)
            .order("name");
        
        if (error) throw error;
        
        const bookSelect = document.getElementById('transactionBook');
        bookSelect.innerHTML = '<option value="">Select book</option>' +
            data.map(book => 
                `<option value="${book.id}">${book.name} (${book.quantity} available)</option>`
            ).join('');
    } catch (error) {
        console.error("Error loading books for transaction:", error);
    }
}

// Toast Functions
function showToast(title, description, type = "success") {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} toast-icon"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-description">${description}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// Load books for transaction modal when it opens
document.getElementById('addTransactionBtn').addEventListener('click', () => {
    loadBooksForTransaction();
});

// Global functions for onclick handlers
window.editBook = editBook;
window.deleteBook = deleteBook;
window.editCustomer = editCustomer;
window.deleteCustomer = deleteCustomer;
window.editTransaction = editTransaction;
window.markAsReturned = markAsReturned;
