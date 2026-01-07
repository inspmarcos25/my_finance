// Usar Supabase já carregado pelo CDN (mesma instância do app)
const supabaseClient = window.supabase.createClient(
    'https://nlcvurffexmcsccbkeci.supabase.co',
    'sb_publishable_cVzaS6mJnobNz8qKXBEZyw_mTP7f7AW'
);

let isLoginMode = true;

// Verificar se já está autenticado
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        sessionStorage.setItem('from_login', 'true');
        window.location.href = '/';
    }
}

checkAuth();

// Alternar entre login e cadastro (FUNÇÃO GLOBAL)
window.toggleAuthMode = function() {
    isLoginMode = !isLoginMode;
    
    const formTitle = document.getElementById('formTitle');
    const formSubtitle = document.getElementById('formSubtitle');
    const submitBtn = document.getElementById('submitBtn');
    const toggleText = document.getElementById('toggleText');
    
    if (isLoginMode) {
        formTitle.textContent = 'Bem-vindo!';
        formSubtitle.textContent = 'Faça login para continuar';
        submitBtn.textContent = 'Entrar';
        toggleText.innerHTML = 'Não tem uma conta? <a href="javascript:void(0)" onclick="toggleAuthMode()">Cadastre-se</a>';
    } else {
        formTitle.textContent = 'Criar Conta';
        formSubtitle.textContent = 'Cadastre-se para começar';
        submitBtn.textContent = 'Cadastrar';
        toggleText.innerHTML = 'Já tem uma conta? <a href="javascript:void(0)" onclick="toggleAuthMode()">Entrar</a>';
    }
    
    hideError();
};

// Mostrar erro
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

// Esconder erro
function hideError() {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.classList.remove('show');
}

// Formulário de autenticação
document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('submitBtn');
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Detectar modo baseado no texto do botão
    const isLoginMode = submitBtn.textContent === 'Entrar';
    
    console.log('Modo:', isLoginMode ? 'Login' : 'Cadastro');
    
    // Validações
    if (!email || !password) {
        showError('Preencha todos os campos');
        return;
    }
    
    if (password.length < 6) {
        showError('A senha deve ter no mínimo 6 caracteres');
        return;
    }
    
    // Desabilitar botão
    submitBtn.disabled = true;
    submitBtn.textContent = isLoginMode ? 'Entrando...' : 'Cadastrando...';
    
    try {
        if (isLoginMode) {
            console.log('Fazendo login...');
            // Login
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            console.log('Login sucesso!', data);
            // Redirecionar para dashboard
            sessionStorage.setItem('from_login', 'true');
            window.location.href = '/';
        } else {
            console.log('Fazendo cadastro...');
            // Cadastro
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password
            });
            
            if (error) throw error;
            
            console.log('Cadastro resultado:', data);
            
            // Verificar se precisa confirmar email
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                showError('Este email já está cadastrado');
            } else if (data.session) {
                // Login automático após cadastro
                console.log('Cadastro com login automático!');
                sessionStorage.setItem('from_login', 'true');
                window.location.href = '/';
            } else {
                // Precisa confirmar email
                showError('Cadastro realizado! Faça login para continuar.');
                setTimeout(() => {
                    window.toggleAuthMode();
                }, 2000);
            }
        }
    } catch (error) {
        console.error('Erro de autenticação:', error);
        
        // Mensagens de erro amigáveis
        let errorMsg = 'Erro ao processar sua solicitação';
        
        if (error.message.includes('Invalid login credentials')) {
            errorMsg = 'Email ou senha incorretos';
        } else if (error.message.includes('Email not confirmed')) {
            errorMsg = 'Confirme seu email antes de fazer login';
        } else if (error.message.includes('User already registered')) {
            errorMsg = 'Este email já está cadastrado';
        } else if (error.message) {
            errorMsg = error.message;
        }
        
        showError(errorMsg);
    } finally {
        // Reabilitar botão
        submitBtn.disabled = false;
        submitBtn.textContent = isLoginMode ? 'Entrar' : 'Cadastrar';
    }
});
