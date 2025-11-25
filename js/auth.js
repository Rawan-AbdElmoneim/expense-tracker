        const nameInput = document.getElementById("name");
        const emailInput = document.getElementById("email");
        const passInput = document.getElementById("pass");

        const confirmPassInput = document.getElementById("confirm-pass");
        const emailInputLogin = document.getElementById("login-email");
        const passInputLogin = document.getElementById("login-pass");

        const signupCont = document.getElementById("signup-container");
        const loginCont = document.getElementById("login-container");

        //error handling helper
        function showInputError(inputId, message) {
            const errorElement = document.getElementById(inputId + '-error');
            const inputElement = document.getElementById(inputId);

            if (errorElement && inputElement) {
                errorElement.textContent = message;

                errorElement.style.display = 'block';
                inputElement.classList.add('input-error');
            }
        }

        function clearInputError(inputId) {
            const errorElement = document.getElementById(inputId + '-error');
            const inputElement = document.getElementById(inputId);

            if (errorElement && inputElement) {
                errorElement.textContent = '';
                errorElement.style.display = 'none';

                inputElement.classList.remove('input-error');
            }
        }



        function clearAllErrors() {
            const inputIds = ['name', 'email', 'pass', 'confirm-pass', 'login-email', 'login-pass'];
            for (let i = 0; i < inputIds.length; i++) {
                clearInputError(inputIds[i]);
            }
        }


        //email already exists
        function registered(email) {
            const users = JSON.parse(localStorage.getItem("users")) || [];
            for (let i = 0; i < users.length; i++) {
                if (users[i].email === email) {
                    return true;
                }
            }
            return false;
        }



        // Navigation event listeners
        document.getElementById("goToLogin").addEventListener("click", () => {
            loginCont.style.display = "flex";
            signupCont.style.display = "none";
            clearAllErrors();
        });

        document.getElementById("goToSignup").addEventListener("click", () => {
            signupCont.style.display = "flex";
            loginCont.style.display = "none";
            clearAllErrors();
        });

        // Signup functionality
        document.getElementById("signup-btn").addEventListener("click", () => {


            let isValid = true;

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const pass = passInput.value.trim();
            const confirmPass = confirmPassInput.value.trim();

            const emailPattern = /.+@.+\..+/;
            const passPattern = /^.{6,}$/;

            //previous errors are cleared
            clearAllErrors();


            if (!name) {
                showInputError('name', 'Please enter your name');
                isValid = false;
            }

            if (!email) {
                showInputError('email', 'Please enter your email');
                isValid = false;
            }
            else if (!emailPattern.test(email)) {
                showInputError('email', 'Please enter a valid email address');
                isValid = false;
            }


            if (!pass) {
                showInputError('pass', 'Please enter your password');
                isValid = false;
            } else if (!passPattern.test(pass)) {
                showInputError('pass', 'Password must be at least 6 characters long');
                isValid = false;
            }


            if (!confirmPass) {
                showInputError('confirm-pass', 'Please confirm your password');
                isValid = false;
            } else if (pass !== confirmPass) {
                showInputError('confirm-pass', 'Passwords do not match');
                isValid = false;
            }

            if (!isValid) {
                return;
            }


            if (registered(email)) {
                showInputError('email', 'This email is already registered. Please use a different email or login.');
                return;
            }

            //create user data
            const userData = {
                name: name,
                email: email,
                password: pass
            };


            let users = JSON.parse(localStorage.getItem("users")) || [];

            users.push(userData);
            localStorage.setItem("users", JSON.stringify(users));

            //store current user
            localStorage.setItem("currentUser", JSON.stringify(userData));

            loginCont.style.display = "flex";
            signupCont.style.display = "none";
            clearAllErrors();
        });




        document.getElementById("login-btn").addEventListener("click", () => {


            let isValid = true;

            const email = emailInputLogin.value.trim();
            const pass = passInputLogin.value.trim();

            clearInputError('login-email');
            clearInputError('login-pass');

            if (!email) {
                showInputError('login-email', 'Please enter your email');
                isValid = false;
            }

            if (!pass) {
                showInputError('login-pass', 'Please enter your password');
                isValid = false;
            }

            if (!isValid) {
                return;
            }

            const users = JSON.parse(localStorage.getItem("users")) || [];

            if (users.length === 0) {
                showInputError('login-email', 'No users found. Please sign up first.');
                return;
            }


            let loginValid = false;
            let loggedInUser = null;

            for (let i = 0; i < users.length; i++) {
                if (users[i].email === email && users[i].password === pass) {
                    loginValid = true;
                    loggedInUser = users[i];
                    break;
                }
            }

            if (!loginValid) {




                document.getElementById('login-email').classList.add('input-error');

                // showInputError('login-email', 'Wrong email or password');
                showInputError('login-pass', 'Wrong email or password');
                return;
            }


            localStorage.setItem("currentUser", JSON.stringify(loggedInUser));

            window.location.href = "home.html";
        });

        document.addEventListener('DOMContentLoaded', function () {
            const inputs = ['name', 'email', 'pass', 'confirm-pass', 'login-email', 'login-pass'];

            for (let i = 0; i < inputs.length; i++) {
                const input = document.getElementById(inputs[i]);
                if (input) {
                    input.addEventListener('input', function () {
                        clearInputError(this.id);
                    });
                }
            }

        });