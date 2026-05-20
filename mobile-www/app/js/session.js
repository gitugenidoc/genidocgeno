const API_BASE_URL =
  window.GENIDOC_CONFIG?.apiBaseUrl ||
  localStorage.getItem("genidoc_api_base_url") ||
  "/api";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    throw new Error(data.error || "Requête impossible");
  }
  return data;
}

async function login(credentials) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

async function logout() {
  await apiRequest("/auth/logout", { method: "POST" });
  window.location.href = "/app/auth/login.html";
}

async function getCurrentUser() {
  const result = await apiRequest("/auth/me");
  return result.user;
}

async function requireAuth(allowedRoles = []) {
  try {
    const user = await getCurrentUser();
    window.currentUser = user;
    renderDashboardChrome(user);
    if (allowedRoles.length) {
      const hasRole = user.roles.some((role) => allowedRoles.includes(role));
      if (!hasRole) window.location.href = "/app/unauthorized.html";
    }
    return user;
  } catch {
    window.location.href = "/app/auth/login.html";
    return null;
  }
}

function ensureIconStylesheet() {
  if (document.querySelector("link[data-dashboard-icons]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
  link.dataset.dashboardIcons = "true";
  document.head.appendChild(link);
}

function navItemsForUser(user) {
  if (user.roles.includes("SCHOOL_ADMIN") || user.roles.includes("SCHOOL_NURSE")) {
    return [
      { href: "/app/school/dashboard.html", icon: "fa-table-columns", title: "Dashboard école" },
      { href: "/app/school/students.html", icon: "fa-children", title: "Élèves" },
      { href: "/app/school/incidents.html", icon: "fa-clipboard-list", title: "Incidents" },
    ];
  }

  if (user.roles.includes("PARENT")) {
    return [
      { href: "/app/parent/dashboard.html", icon: "fa-table-columns", title: "Portail parent" },
      { href: "/app/parent/dashboard.html", icon: "fa-notes-medical", title: "Fiche santé" },
      { href: "/app/parent/dashboard.html", icon: "fa-file-shield", title: "Documents" },
      { href: "/app/parent/dashboard.html", icon: "fa-check-square", title: "Autorisations" },
    ];
  }

  if (user.roles.includes("PEDIATRICIAN")) {
    return [
      { href: "/app/doctor/dashboard.html", icon: "fa-user-doctor", title: "Pédiatre" },
      { href: "/app/doctor/dashboard.html", icon: "fa-notes-medical", title: "Accès santé" },
    ];
  }

  if (user.roles.includes("GENIDOC_ADMIN")) {
    return [
      { href: "/app/admin/dashboard.html", icon: "fa-table-columns", title: "Admin" },
      { href: "/app/admin/schools.html", icon: "fa-school", title: "Ecoles" },
    ];
  }

  if (user.roles.includes("PLATFORM_OWNER")) {
    return [
      { href: "/app/admin/dashboard.html", icon: "fa-table-columns", title: "Admin" },
      { href: "/app/admin/schools.html", icon: "fa-school", title: "Ecoles" },
      { href: "/app/audit.html", icon: "fa-shield-halved", title: "Audit global" },
    ];
  }

  return [{ href: "/", icon: "fa-house", title: "Accueil" }];
}

function renderDashboardChrome(user) {
  if (!document.body || document.body.dataset.dashboardChrome === "ready") return;
  if (!window.location.pathname.startsWith("/app/")) return;
  if (window.location.pathname.startsWith("/app/auth/")) return;
  if (window.location.pathname.endsWith("/unauthorized.html")) return;

  const shell = document.querySelector("main.shell");
  if (!shell) return;

  ensureIconStylesheet();
  const frame = document.createElement("div");
  frame.className = "dashboard-frame";

  const sidebar = document.createElement("aside");
  sidebar.className = "dashboard-sidebar";

  const currentPath = window.location.pathname;
  sidebar.innerHTML = navItemsForUser(user)
    .map((item) => {
      const active =
        currentPath === item.href ||
        (currentPath.includes("audit") && item.icon === "fa-shield-halved") ||
        (currentPath.includes("/admin/schools") && item.icon === "fa-school") ||
        (currentPath.includes("student-detail") && item.icon === "fa-children");
      return `
        <a class="${active ? "active" : ""}" href="${item.href}" title="${item.title}" aria-label="${item.title}">
          <i class="fa-solid ${item.icon}"></i>
        </a>`;
    })
    .join("") +
    `<button type="button" title="Déconnexion" aria-label="Déconnexion" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i></button>`;

  shell.parentNode.insertBefore(frame, shell);
  frame.appendChild(sidebar);
  frame.appendChild(shell);
  document.body.dataset.dashboardChrome = "ready";
}
