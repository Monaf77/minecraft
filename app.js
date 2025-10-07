// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAUJjmm9t249Gbuw-Gf1rdrHn_hu8JjQjg",
    authDomain: "minecraft-b3b6f.firebaseapp.com",
    projectId: "minecraft-b3b6f",
    storageBucket: "minecraft-b3b6f.firebasestorage.app",
    messagingSenderId: "935643326755",
    appId: "1:935643326755:web:5ff32871281d8bb5218496",
    measurementId: "G-PGJTYPZ64R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Check authentication state and handle redirection
onAuthStateChanged(auth, (user) => {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (user) {
        // User is signed in
        document.body.classList.add('authenticated');
        
        // Update user info in dashboard
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement) {
            userEmailElement.textContent = user.email;
        }
        
        // Redirect to dashboard if on login page
        if (currentPage === 'index.html') {
            window.location.href = 'dashboard.html';
        }
    } else {
        // User is not signed in
        document.body.classList.remove('authenticated');
        
        // Redirect to login page if trying to access dashboard
        if (currentPage === 'dashboard.html') {
            window.location.href = 'index.html';
        }
    }
});

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');
        const loginButton = loginForm.querySelector('button[type="submit"]');
        
        // Reset previous states
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
        loginForm.classList.remove('error');
        
        // Basic validation
        if (!email || !password) {
            errorMessage.textContent = 'الرجاء إدخال البريد الإلكتروني وكلمة المرور';
            errorMessage.style.display = 'block';
            loginForm.classList.add('error');
            return;
        }
        
        try {
            // Show loading state
            loginButton.disabled = true;
            loginButton.textContent = 'جاري تسجيل الدخول...';
            
            // Sign in with email and password
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            // If successful, redirect to dashboard
            window.location.href = 'dashboard.html';
            
        } catch (error) {
            // Reset button state
            loginButton.disabled = false;
            loginButton.textContent = 'تسجيل الدخول';
            
            // Show appropriate error message
            let errorMessageText = '';
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessageText = 'صيغة البريد الإلكتروني غير صحيحة';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessageText = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
                    break;
                case 'auth/too-many-requests':
                    errorMessageText = 'تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة لاحقاً';
                    break;
                case 'auth/user-disabled':
                    errorMessageText = 'هذا الحساب معطل';
                    break;
                default:
                    errorMessageText = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى';
                    console.error('Login error:', error);
            }
            
            // Show error message
            errorMessage.textContent = errorMessageText;
            errorMessage.style.display = 'block';
            loginForm.classList.add('error');
        }
    });
}
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            // Redirect happens in onAuthStateChanged
        } catch (error) {
            console.error('Error signing out:', error);
        }
    });
}

// Add active class to current nav item in dashboard
const navItems = document.querySelectorAll('.sidebar nav ul li');
if (navItems.length > 0) {
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}
