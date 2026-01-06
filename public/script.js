// Configurar Supabase
const supabaseUrl = 'https://nlcvurffexmcsccbkeci.supabase.co';
const supabaseKey = 'sb_publishable_cVzaS6mJnobNz8qKXBEZyw_mTP7f7AW';

// Criar cliente Supabase
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// API Base URL
const API_BASE = '/api';

// Cache para dados
let categoriesCache = [];
let editingTransactionId = null;
let currentUser = null;

// Elementos DOM
const navButtons = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');
const transactionForm = document.getElementById('transactionForm');
const categoryForm = document.getElementById('categoryForm');
const editForm = document.getElementById('editForm');
const editModal = document.getElementById('editModal');
const filterType = document.getElementById('filterType');
const filterCategory = document.getElementById('filterCategory');

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  // Aguardar o Supabase carregar
  if (!window.supabase) {
    console.error('Supabase SDK não carregado');
    alert('Erro ao carregar Supabase. Recarregue a página.');
    return;
  }
  
  console.log('🔍 Verificando autenticação...');
  
  // IMPORTANTE: Forçar logout se não vier de login.html
  const fromLogin = sessionStorage.getItem('from_login');
  if (!fromLogin) {
    console.log('⚠️ Não veio da página de login, fazendo logout...');
    await supabaseClient.auth.signOut();
    sessionStorage.clear();
    localStorage.clear();
  }
  
  // Tentar obter sessão
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  
  console.log('📝 Session:', session);
  console.log('📝 Error:', error);
  
  // Se não tem sessão, redirecionar para login
  if (!session || !session.user) {
    console.log('❌ Nenhuma sessão encontrada. Redirecionando para login...');
    window.location.replace('/login.html');
    return;
  }
  
  console.log('✅ Usuário autenticado:', session.user.email);
  currentUser = session.user;
  
  // Marcar que está autenticado
  sessionStorage.setItem('from_login', 'true');
  
  // Mostrar email do usuário
  const userEmail = document.getElementById('userEmail');
  if (userEmail) {
    userEmail.textContent = currentUser.email;
  }
  
  console.log('✅ Carregando app...');
  initEventListeners();
  setupLogoutButton();
  initRecurrenceUI();
  setTodayDate();
  loadDashboard();
  loadCategories();
});

// Verificar autenticação (função mantida para compatibilidade)
async function checkAuth() {
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (error || !session || !session.user) {
      return false;
    }
    
    currentUser = session.user;
    return true;
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return false;
  }
}

// Configurar botão de logout
function setupLogoutButton() {
  const logoutButtons = document.querySelectorAll('[data-logout]');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      await supabaseClient.auth.signOut();
      window.location.href = '/login.html';
    });
  });
}

// Recurrence UI helpers
function initRecurrenceUI() {
  const groups = document.querySelectorAll('[data-recurrence-group]');
  groups.forEach(group => {
    const hiddenInput = group.querySelector('[data-recurrence-input]');
    const pills = group.querySelectorAll('[data-recurrence-pills] [data-recurrence]');

    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        if (hiddenInput) {
          hiddenInput.value = pill.dataset.recurrence || 'nenhuma';
        }
      });
    });
  });
}

function getRecurrencePayload(groupName) {
  const group = document.querySelector(`[data-recurrence-group="${groupName}"]`);
  const recurrenceType = group?.querySelector('[data-recurrence-input]')?.value || 'nenhuma';
  const recurrenceUntil = group?.querySelector('[data-recurrence-until]')?.value || null;

  return {
    is_recurring: recurrenceType !== 'nenhuma',
    recurrence_type: recurrenceType,
    recurrence_until: recurrenceUntil || null,
  };
}

function setRecurrenceGroupValue(groupName, recurrenceType, recurrenceUntil) {
  const group = document.querySelector(`[data-recurrence-group="${groupName}"]`);
  if (!group) return;

  const pills = group.querySelectorAll('[data-recurrence-pills] [data-recurrence]');
  const hiddenInput = group.querySelector('[data-recurrence-input]');
  const untilInput = group.querySelector('[data-recurrence-until]');

  const normalizedType = recurrenceType || 'nenhuma';

  pills.forEach(pill => {
    pill.classList.toggle('active', pill.dataset.recurrence === normalizedType);
  });

  if (hiddenInput) hiddenInput.value = normalizedType;
  if (untilInput) untilInput.value = recurrenceUntil ? recurrenceUntil.split('T')[0] : '';
}

function formatRecurrenceLabel(recurrenceType) {
  const labels = {
    diaria: 'Diária',
    semanal: 'Semanal',
    mensal: 'Mensal',
    anual: 'Anual',
    nenhuma: 'Única'
  };
  return labels[recurrenceType] || 'Recorrente';
}

// Event Listeners
function initEventListeners() {
  // Navigation
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => handleNavClick(btn));
  });

  // Forms
  transactionForm?.addEventListener('submit', handleAddTransaction);
  categoryForm?.addEventListener('submit', handleAddCategory);
  editForm?.addEventListener('submit', handleEditTransaction);

  // Filters
  filterType?.addEventListener('change', loadTransactions);
  filterCategory?.addEventListener('change', loadTransactions);

  // Modal close on outside click
  editModal?.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
  });
}

// Helper para adicionar token nas requisições
async function fetchWithAuth(url, options = {}) {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      window.location.href = '/login.html';
      return;
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers
    };

    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
      window.location.href = '/login.html';
      return;
    }
    
    return response;
  } catch (error) {
    console.error('Erro ao fazer requisição:', error);
    throw error;
  }
}

function handleNavClick(btn) {
  // Remove active class from all buttons
  navButtons.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Hide all views
  views.forEach(view => view.classList.remove('active'));

  // Show selected view
  const viewId = btn.getAttribute('data-view');
  const view = document.getElementById(viewId);
  if (view) {
    view.classList.add('active');

    // Load data for specific views
    if (viewId === 'dashboard') {
      loadDashboard();
    } else if (viewId === 'transactions') {
      loadTransactions();
    } else if (viewId === 'categories') {
      loadCategoriesList();
    }
  }
}

// Dashboard
async function loadDashboard() {
  try {
    console.log('📊 Carregando dashboard...');
    const response = await fetchWithAuth(`${API_BASE}/dashboard`);
    
    if (!response || !response.ok) {
      console.error('Erro ao carregar dashboard:', response?.status);
      return;
    }
    
    const data = await response.json();
    console.log('📊 Dados do dashboard:', data);

    if (data.error) {
      console.error('Erro no dashboard:', data.error);
      return;
    }

    // Update balance cards
    const totalBalance = document.getElementById('totalBalance');
    const totalIncome = document.getElementById('totalIncome');
    const totalExpense = document.getElementById('totalExpense');
    
    if (totalBalance) totalBalance.textContent = formatCurrency(data.balance);
    if (totalIncome) totalIncome.textContent = formatCurrency(data.income);
    if (totalExpense) totalExpense.textContent = formatCurrency(data.expenses);

    // Update category chart (somente saídas)
    if (data.byCategory && Array.isArray(data.byCategory)) {
      const totalExpenses = data.byCategory.reduce((sum, cat) => sum + (cat.expenses || 0), 0);
      const chartHtml = data.byCategory
        .filter(cat => cat.expenses > 0)
        .map(cat => {
          const percentage = totalExpenses > 0 ? (cat.expenses / totalExpenses) * 100 : 0;
          return `
            <div class="category-bar">
              <div class="category-icon">${cat.icon}</div>
              <div class="category-name">${cat.name}</div>
              <div class="category-progress">
                <div class="category-fill" style="width: ${percentage}%; background-color: ${cat.color || '#3b82f6'}"></div>
              </div>
              <div class="category-amount">${formatCurrency(cat.expenses)}</div>
            </div>
          `;
        })
        .join('');

      const categoryChart = document.getElementById('categoryChart');
      if (categoryChart) {
        categoryChart.innerHTML = chartHtml;
      }
    }

    // Update recent transactions
    if (data.recent && Array.isArray(data.recent)) {
      const transHtml = data.recent
        .map(trans => createTransactionItemHtml(trans))
        .join('');

      const recentTransactions = document.getElementById('recentTransactions');
      if (recentTransactions) {
        recentTransactions.innerHTML = transHtml || '<p>Nenhuma transação</p>';
      }
    }

    // Draw charts
    if (drawCharts && typeof drawCharts === 'function') {
      drawCharts(data);
    }
    
    console.log('✅ Dashboard atualizado');
  } catch (error) {
    console.error('❌ Erro ao carregar dashboard:', error);
  }
}

// Transactions
async function loadTransactions() {
  try {
    console.log('📋 Carregando transações...');
    const type = filterType?.value || '';
    const categoryId = filterCategory?.value || '';

    let url = `${API_BASE}/transactions`;
    if (type) url = `${API_BASE}/transactions/type/${type}`;

    const response = await fetchWithAuth(url);
    
    if (!response || !response.ok) {
      console.error('Erro ao carregar transações:', response?.status);
      return;
    }
    
    const transactions = await response.json();
    console.log('📋 Transações carregadas:', transactions);

    if (!Array.isArray(transactions)) {
      console.error('Resposta não é um array:', transactions);
      const transactionsList = document.getElementById('transactionsList');
      if (transactionsList) {
        transactionsList.innerHTML = '<p>Erro ao carregar transações</p>';
      }
      return;
    }

    let filtered = transactions;
    if (categoryId) {
      filtered = transactions.filter(t => t.category_id == categoryId);
    }

    const listHtml = filtered
      .map(trans => createTransactionItemHtml(trans))
      .join('');

    const transactionsList = document.getElementById('transactionsList');
    if (transactionsList) {
      transactionsList.innerHTML = listHtml || '<p>Nenhuma transação encontrada</p>';
    }
    
    console.log('✅ Transações atualizadas');
  } catch (error) {
    console.error('❌ Erro ao carregar transações:', error);
  }
}

function createTransactionItemHtml(trans) {
  const amount = trans.type === 'entrada' ? `+${formatCurrency(trans.amount)}` : `-${formatCurrency(trans.amount)}`;
  const amountClass = trans.type === 'entrada' ? 'income' : 'expense';
  const date = new Date(trans.date).toLocaleDateString('pt-BR');
  const recurrenceTag = trans.is_recurring
    ? `<div class="transaction-tags">
        <span class="tag recurring">Recorrência ${formatRecurrenceLabel(trans.recurrence_type)}</span>
        ${trans.recurrence_until ? `<span class="tag">Até ${new Date(trans.recurrence_until).toLocaleDateString('pt-BR')}</span>` : ''}
      </div>`
    : '';

  return `
    <div class="transaction-item" style="border-left-color: ${trans.category_icon ? 'var(--primary)' : '#ccc'}">
      <div class="transaction-left">
        <div class="transaction-icon">${trans.category_icon || '💰'}</div>
        <div class="transaction-info">
          <h4>${trans.description}</h4>
          <p>${trans.category_name} • ${date}</p>
          ${recurrenceTag}
        </div>
      </div>
      <div class="transaction-right">
        <div class="transaction-amount ${amountClass}">${amount}</div>
        <div class="transaction-actions">
          <button class="btn btn-secondary btn-small" onclick="openEditModal(${trans.id})">
            ✏️ Editar
          </button>
          <button class="btn btn-danger btn-small" onclick="deleteTransaction(${trans.id})">
            🗑️ Deletar
          </button>
        </div>
      </div>
    </div>
  `;
}

async function handleAddTransaction(e) {
  e.preventDefault();

  const formData = new FormData(transactionForm);
  const data = {
    description: formData.get('description'),
    amount: parseFloat(formData.get('amount')),
    type: formData.get('type'),
    category_id: parseInt(formData.get('category_id')),
    date: formData.get('date'),
    ...getRecurrencePayload('create'),
  };

  try {
    const response = await fetchWithAuth(`${API_BASE}/transactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.ok) {
      showToast('Transação adicionada com sucesso!', 'success');
      transactionForm.reset();
      setTodayDate();
      setRecurrenceGroupValue('create', 'nenhuma', null);
      loadDashboard();
        loadTransactions();
    } else {
        let details = '';
        try {
          details = await response.text();
        } catch (e) {
          details = '';
        }
        console.error('Erro ao adicionar transação:', response.status, details);
        showToast(`Erro ao adicionar transação${details ? `: ${details}` : ''}`, 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    showToast('Erro ao adicionar transação', 'error');
  }
}

async function deleteTransaction(id) {
  if (!confirm('Tem certeza que deseja deletar esta transação?')) return;

  try {
    const response = await fetchWithAuth(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      showToast('Transação deletada com sucesso!', 'success');
      loadDashboard();
      loadTransactions();
    } else {
      showToast('Erro ao deletar transação', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    showToast('Erro ao deletar transação', 'error');
  }
}

// Modal functions
function openEditModal(id) {
  try {
    const transactions = document.querySelectorAll('.transaction-item');
    let transaction = null;

    // Buscar a transação na cache ou fazer requisição
    fetchWithAuth(`${API_BASE}/transactions/${id}`)
      .then(res => res.json())
      .then(data => {
        transaction = data;
        editingTransactionId = id;

        // Preencher formulário
        document.getElementById('editDescription').value = transaction.description;
        document.getElementById('editAmount').value = transaction.amount;
        document.getElementById('editType').value = transaction.type;
        document.getElementById('editCategory').value = transaction.category_id;
        document.getElementById('editDate').value = transaction.date;
        setRecurrenceGroupValue('edit', transaction.recurrence_type, transaction.recurrence_until);

        // Abrir modal
        editModal.classList.add('active');
      })
      .catch(error => {
        console.error('Erro ao carregar transação:', error);
        showToast('Erro ao abrir edição', 'error');
      });
  } catch (error) {
    console.error('Erro:', error);
    showToast('Erro ao abrir edição', 'error');
  }
}

function closeEditModal() {
  editModal.classList.remove('active');
  editingTransactionId = null;
  editForm.reset();
  setRecurrenceGroupValue('edit', 'nenhuma', null);
}

async function handleEditTransaction(e) {
  e.preventDefault();

  if (!editingTransactionId) return;

  const formData = new FormData(editForm);
  const data = {
    description: formData.get('description'),
    amount: parseFloat(formData.get('amount')),
    type: formData.get('type'),
    category_id: parseInt(formData.get('category_id')),
    date: formData.get('date'),
    ...getRecurrencePayload('edit'),
  };

  try {
    const response = await fetchWithAuth(`${API_BASE}/transactions/${editingTransactionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (response.ok) {
      showToast('Transação atualizada com sucesso!', 'success');
      closeEditModal();
      loadDashboard();
      loadTransactions();
    } else {
      showToast('Erro ao atualizar transação', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    showToast('Erro ao atualizar transação', 'error');
  }
}

// Categories
async function loadCategories() {
  try {
    console.log('📂 Carregando categorias...');
    const response = await fetchWithAuth(`${API_BASE}/categories`);
    
    if (!response) {
      console.error('Resposta vazia ao carregar categorias');
      return;
    }
    
    if (!response.ok) {
      console.error('Erro HTTP:', response.status, await response.text());
      return;
    }
    
    const data = await response.json();
    console.log('📂 Categorias carregadas:', data);
    
    if (Array.isArray(data)) {
      categoriesCache = data;
    } else if (data.error) {
      console.error('Erro ao carregar categorias:', data.error);
      return;
    } else {
      console.error('Resposta inesperada:', data);
      return;
    }

    // Update category selects
    const selects = [
      document.getElementById('transCategory'),
      document.getElementById('filterCategory'),
      document.getElementById('editCategory'),
    ];

    selects.forEach(select => {
      if (!select) return;

      const currentValue = select.value;
      select.innerHTML = '<option value="">Selecione uma categoria</option>';

      categoriesCache.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = `${cat.icon} ${cat.name}`;
        select.appendChild(option);
      });

      select.value = currentValue;
    });
    
    console.log('✅ Categorias atualizadas');
  } catch (error) {
    console.error('❌ Erro ao carregar categorias:', error);
  }
}

async function loadCategoriesList() {
  try {
    const html = categoriesCache
      .map(cat => `
        <div class="category-card">
          <div class="category-card-icon">${cat.icon}</div>
          <div class="category-card-name">${cat.name}</div>
          <div class="category-card-actions">
            <button class="btn btn-danger btn-small" onclick="deleteCategory(${cat.id})">
              🗑️ Deletar
            </button>
          </div>
        </div>
      `)
      .join('');

    document.getElementById('categoriesList').innerHTML = html || '<p>Nenhuma categoria</p>';
  } catch (error) {
    console.error('Erro:', error);
  }
}

async function handleAddCategory(e) {
  e.preventDefault();

  const formData = new FormData(categoryForm);
  const data = {
    name: formData.get('name'),
    icon: formData.get('icon') || '📌',
    color: formData.get('color') || '#6b7280',
  };

  try {
    const response = await fetchWithAuth(`${API_BASE}/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.ok) {
      showToast('Categoria adicionada com sucesso!', 'success');
      categoryForm.reset();
      loadCategories();
      loadCategoriesList();
    } else {
      showToast('Erro ao adicionar categoria', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    showToast('Erro ao adicionar categoria', 'error');
  }
}

async function deleteCategory(id) {
  if (!confirm('Tem certeza que deseja deletar esta categoria?')) return;

  try {
    const response = await fetchWithAuth(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      showToast('Categoria deletada com sucesso!', 'success');
      loadCategories();
      loadCategoriesList();
    } else {
      showToast('Erro ao deletar categoria', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    showToast('Erro ao deletar categoria', 'error');
  }
}

// Utilities
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function setTodayDate() {
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('transDate');
  if (dateInput) dateInput.value = today;
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Draw Charts
function drawCharts(data) {
  drawCategoryPieChart(data.byCategory);
  drawIncomeExpenseChart(data.income, data.expenses);
}

function drawCategoryPieChart(categories) {
  const ctx = document.getElementById('categoryPieChart');
  if (!ctx) return;

  // Destruir gráfico anterior se existir
  if (window.categoryChartInstance) {
    window.categoryChartInstance.destroy();
  }

  // Filtrar categorias com gastos
  const categoriesWithExpenses = categories.filter(cat => cat.expenses > 0);

  if (categoriesWithExpenses.length === 0) {
    ctx.parentElement.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">Nenhuma despesa registrada</p>';
    return;
  }

  const labels = categoriesWithExpenses.map(cat => `${cat.icon} ${cat.name}`);
  const data = categoriesWithExpenses.map(cat => cat.expenses);
  const colors = categoriesWithExpenses.map(cat => cat.color || '#3b82f6');

  window.categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderColor: 'white',
        borderWidth: 3,
        borderRadius: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: { size: 13, weight: '600' },
            padding: 16,
            usePointStyle: true,
            pointStyle: 'circle',
            color: '#1f2937'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(31, 41, 55, 0.8)',
          padding: 12,
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function(context) {
              const value = formatCurrency(context.parsed);
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return ` ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function drawIncomeExpenseChart(income, expenses) {
  const ctx = document.getElementById('incomeExpenseChart');
  if (!ctx) return;

  // Destruir gráfico anterior se existir
  if (window.incomeExpenseChartInstance) {
    window.incomeExpenseChartInstance.destroy();
  }

  window.incomeExpenseChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Entradas', 'Saídas'],
      datasets: [{
        label: 'Entradas',
        data: [income, 0],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: '#10b981',
        borderWidth: 2,
        borderRadius: 8,
      }, {
        label: 'Saídas',
        data: [0, expenses],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: '#ef4444',
        borderWidth: 2,
        borderRadius: 8,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(31, 41, 55, 0.8)',
          padding: 12,
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: function(context) {
              if (context.parsed.x === 0) return '';
              return formatCurrency(context.parsed.x);
            }
          }
        }
      },
      scales: {
        x: {
          stacked: false,
          grid: {
            color: 'rgba(229, 231, 235, 0.3)',
            drawBorder: false
          },
          ticks: {
            color: '#6b7280',
            font: { size: 12, weight: '600' },
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        },
        y: {
          stacked: false,
          grid: {
            display: false
          },
          ticks: {
            color: '#1f2937',
            font: { size: 13, weight: '700' }
          }
        }
      }
    }
  });
}
