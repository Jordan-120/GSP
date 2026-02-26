// frontend/views/loginpage/viewLogin.js

document.addEventListener("DOMContentLoaded", () => {
  // --------------------
  // Helpers
  // --------------------
  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  // --------------------
  // Login elements
  // --------------------
  const loginForm = document.getElementById("loginForm");
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");

  // --------------------
  // Register modal elements (must match IDs in viewLoginShell.html)
  // --------------------
  const newUserButton = document.getElementById("newUserButton");

  const registerBackdrop = document.getElementById("registerBackdrop");
  const registerClose = document.getElementById("registerClose");
  const registerForm = document.getElementById("registerForm");

  const registerEmail = document.getElementById("registerEmail");
  const registerPassword = document.getElementById("registerPassword");
  const registerPasswordConfirm = document.getElementById(
    "registerPasswordConfirm"
  );
  const registerFirstName = document.getElementById("registerFirstName");
  const registerLastName = document.getElementById("registerLastName");

  const showRegisterModal = () => {
    if (!registerBackdrop) return;
    registerBackdrop.classList.add("show"); // CSS should make .modal-backdrop.show visible
  };

  const hideRegisterModal = () => {
    if (!registerBackdrop) return;
    registerBackdrop.classList.remove("show");
  };

  // --------------------
  // Open/close register modal
  // --------------------
  if (newUserButton) {
    newUserButton.addEventListener("click", (e) => {
      e.preventDefault();
      showRegisterModal();
    });
  }

  if (registerClose) {
    registerClose.addEventListener("click", (e) => {
      e.preventDefault();
      hideRegisterModal();
    });
  }

  // Click outside modal to close
  if (registerBackdrop) {
    registerBackdrop.addEventListener("click", (e) => {
      if (e.target === registerBackdrop) hideRegisterModal();
    });
  }

  // Optional: ESC key closes modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideRegisterModal();
  });

  // --------------------
  // LOGIN
  // --------------------
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = (loginEmail?.value || "").trim();
      const password = (loginPassword?.value || "").trim();

      if (!email || !password) {
        alert("Please enter both email and password.");
        return;
      }

      if (!isValidEmail(email)) {
        alert("Please enter a valid email address.");
        return;
      }

      try {
        const res = await fetch("/api/login/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        let data = {};
        try {
          data = await res.json();
        } catch (err) {
          console.error("Login response was not JSON:", err);
        }

        if (!res.ok) {
          alert(data.message || "Login failed.");
          return;
        }

        // Store token
        if (data.token) {
          localStorage.setItem("authToken", data.token);
        }

        // Determine role (supports multiple backend shapes)
        const role =
          data?.user?.role ||
          data?.user?.profile_type ||
          data?.profile_type ||
          data?.profileType ||
          data?.user?.profileType ||
          null;

        // ✅ FORCE correct routes (do not trust backend redirectTo for users)
        if (role && String(role).toLowerCase() === "admin") {
          window.location.href = "/adminView";
        } else {
          window.location.href = "/home";
        }
      } catch (err) {
        console.error("Login request failed:", err);
        alert("Something went wrong. Please try again.");
      }
    });
  }

  // --------------------
  // REGISTER
  // --------------------
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = (registerEmail?.value || "").trim();
      const password = (registerPassword?.value || "").trim();
      const confirm = (registerPasswordConfirm?.value || "").trim();
      const first_name = (registerFirstName?.value || "").trim();
      const last_name = (registerLastName?.value || "").trim();

      if (!email || !password || !confirm) {
        alert("Please fill out all required fields.");
        return;
      }

      if (!isValidEmail(email)) {
        alert("Please enter a valid email address.");
        return;
      }

      if (password !== confirm) {
        alert("Passwords do not match.");
        return;
      }

      try {
        // Common register endpoint (adjust ONLY if your backend uses a different route)
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ first_name, last_name, email, password }),
        });

        let data = {};
        try {
          data = await res.json();
        } catch (err) {
          console.error("Register response was not JSON:", err);
        }

        if (!res.ok) {
          alert(data.message || "Registration failed.");
          return;
        }

        alert(data.message || "Account created! You can now log in.");
        registerForm.reset();
        hideRegisterModal();
      } catch (err) {
        console.error("Register request failed:", err);
        alert("Something went wrong. Please try again.");
      }
    });
  }
});