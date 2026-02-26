// frontend/views/loginpage/viewLogin.js

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = loginEmail.value.trim();
      const password = loginPassword.value.trim();

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
          // ✅ Your working route from pic2 is lowercase /home
          window.location.href = "/home";
        }
      } catch (err) {
        console.error("Login request failed:", err);
        alert("Something went wrong. Please try again.");
      }
    });
  }
});