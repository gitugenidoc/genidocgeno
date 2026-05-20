const services = [
        { title: "Fiches santé enfant", icon: "SA", image: "/assets/genidoc/child-health-profile.png", text: "Allergies, traitements, contacts d’urgence, médecin traitant, protocole urgence et notes critiques." },
        { title: "Portail parent", icon: "PA", image: "/assets/genidoc/parent-portal.png", text: "Les parents activent leur compte, complètent les informations, ajoutent documents et autorisations." },
        { title: "Infirmerie scolaire", icon: "IN", image: "/assets/genidoc/platform-complete.png", text: "Accès rapide aux élèves, incidents ouverts, informations critiques et actions prises pendant la journée." },
        { title: "Documents médicaux", icon: "DO", image: "/assets/genidoc/medical-documents.png", text: "Certificats, ordonnances et fichiers santé rangés dans un espace clair, prêt pour un stockage serveur chiffré." },
        { title: "QR urgence", icon: "QR", image: "/assets/genidoc/emergency-qr.png", text: "Accès rapide aux informations vitales autorisées lorsqu’une situation urgente arrive à l’école." },
        { title: "Contrôle propriétaire", icon: "CP", image: "/assets/genidoc/owner-audit-dashboard.png", text: "Vue de supervision pour SENHAJI Anas : établissements, qualité des dossiers, risques et rapports." }
      ];
      const projects = [
        ["Tous", "Plateforme complète", "/assets/genidoc/platform-complete.png"],
        ["Fiche santé", "Profil santé enfant", "/assets/genidoc/child-health-profile.png"],
        ["Documents", "Documents médicaux", "/assets/genidoc/medical-documents.png"],
        ["QR urgence", "QR d’urgence", "/assets/genidoc/emergency-qr.png"],
        ["Parents", "Portail parent", "/assets/genidoc/parent-portal.png"],
        ["Infirmerie", "Application mobile", "/assets/genidoc/mobile-app.png"],
        ["Contrôle propriétaire", "Tableau propriétaire", "/assets/genidoc/owner-audit-dashboard.png"],
        ["Souveraineté", "Priorité santé scolaire", "/assets/genidoc/dark-priority-hero.png"]
      ];
      const categories = ["Tous", "Fiche santé", "Documents", "QR urgence", "Parents", "Infirmerie", "Contrôle propriétaire", "Souveraineté"];

      function toggleMenu() { document.body.classList.toggle("menu-open"); }
      document.getElementById("menuButton")?.addEventListener("click", toggleMenu);
      document.querySelectorAll("[data-menu-link]").forEach((link) => {
        link.addEventListener("click", () => document.body.classList.remove("menu-open"));
      });

      document.getElementById("serviceList").innerHTML = services.map((item, index) =>
        `<button class="service-item ${index === 0 ? "active" : ""}" type="button" data-index="${index}">${item.title}<span>↗</span></button>`
      ).join("");
      document.getElementById("filters").innerHTML = categories.map((cat, index) =>
        `<button class="filter ${index === 0 ? "active" : ""}" type="button" data-filter="${cat}">${cat}</button>`
      ).join("");
      document.getElementById("portfolioGrid").innerHTML = projects.map(([cat, title, image]) =>
        `<article class="project-card cursor-view-target" data-cat="${cat}"><img loading="lazy" alt="${title}" src="${image}" /><strong>${title}</strong></article>`
      ).join("");

      function setService(index) {
        const detail = document.getElementById("serviceDetail");
        const item = services[index];
        document.querySelectorAll(".service-item").forEach((button, i) => button.classList.toggle("active", i === index));
        detail.classList.add("switching");
        setTimeout(() => {
          document.getElementById("serviceImage").src = item.image;
          document.getElementById("serviceIcon").textContent = item.icon;
          document.getElementById("serviceTitle").textContent = item.title;
          document.getElementById("serviceText").textContent = item.text;
          detail.classList.remove("switching");
        }, 180);
      }
      document.querySelectorAll(".service-item").forEach((button) => {
        button.addEventListener("mouseenter", () => setService(Number(button.dataset.index)));
        button.addEventListener("click", () => setService(Number(button.dataset.index)));
      });
      document.querySelectorAll(".filter").forEach((button) => {
        button.addEventListener("click", () => {
          document.querySelectorAll(".filter").forEach((item) => item.classList.remove("active"));
          button.classList.add("active");
          const filter = button.dataset.filter;
          document.querySelectorAll(".project-card").forEach((card, index) => {
            const show = filter === "Tous" || card.dataset.cat === filter;
            setTimeout(() => card.classList.toggle("hide", !show), index * 28);
          });
        });
      });

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          if (entry.target.classList.contains("gallery-card")) entry.target.classList.add("revealed");
          if (entry.target.classList.contains("why-grid")) animateCounters();
        });
      }, { threshold: 0.18 });
      document.querySelectorAll(".reveal, .stagger, .gallery-card, .why-grid").forEach((el) => observer.observe(el));
      document.querySelectorAll(".gallery-card").forEach((card, i) => card.style.transitionDelay = `${Math.min(i * 45, 500)}ms`);

      let countersDone = false;
      function animateCounters() {
        if (countersDone) return;
        countersDone = true;
        document.querySelectorAll(".counter").forEach((counter) => {
          const target = Number(counter.dataset.target);
          let value = 0;
          const step = Math.max(1, Math.ceil(target / 36));
          const timer = setInterval(() => {
            value += step;
            if (value >= target) { value = target; clearInterval(timer); }
            counter.textContent = target === 1 ? "01" : `${value}+`;
          }, 28);
        });
      }

      let targetY = window.scrollY, currentY = window.scrollY;
      function smooth() {
        currentY += (targetY - currentY) * 0.12;
        document.documentElement.style.setProperty("--scrollY", currentY);
        requestAnimationFrame(smooth);
      }
      window.addEventListener("wheel", () => { targetY = window.scrollY; }, { passive: true });
      smooth();

      window.addEventListener("scroll", () => {
        document.getElementById("header").classList.toggle("scrolled", window.scrollY > 28);
        const hero = document.getElementById("heroVisual");
        if (hero) hero.style.setProperty("--parallax", `${window.scrollY * 0.06}px`);
      }, { passive: true });

      document.querySelectorAll(".gallery-card").forEach((card) => {
        card.addEventListener("mousemove", (event) => {
          const rect = card.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;
          card.style.transform = `translateY(0) rotateX(${y * -4}deg) rotateY(${x * 5}deg)`;
        });
        card.addEventListener("mouseleave", () => card.style.transform = "");
      });

      if (matchMedia("(pointer:fine)").matches) {
        document.body.classList.add("cursor-ready");
        const dot = document.querySelector(".cursor-dot");
        const ring = document.querySelector(".cursor-ring");
        let mx = 0, my = 0, rx = 0, ry = 0;
        window.addEventListener("mousemove", (event) => { mx = event.clientX; my = event.clientY; dot.style.left = `${mx}px`; dot.style.top = `${my}px`; });
        function cursorLoop() { rx += (mx - rx) * .16; ry += (my - ry) * .16; ring.style.left = `${rx}px`; ring.style.top = `${ry}px`; requestAnimationFrame(cursorLoop); }
        cursorLoop();
        document.querySelectorAll("a, button, .magnetic").forEach((el) => {
          el.addEventListener("mouseenter", () => document.body.classList.add("cursor-link"));
          el.addEventListener("mouseleave", () => document.body.classList.remove("cursor-link"));
        });
        document.querySelectorAll(".cursor-view-target").forEach((el) => {
          el.addEventListener("mouseenter", () => document.body.classList.add("cursor-view"));
          el.addEventListener("mouseleave", () => document.body.classList.remove("cursor-view"));
        });
      }

      window.addEventListener("keydown", (event) => {
        if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
        const stage = document.getElementById("portfolio");
        if (Math.abs(stage.getBoundingClientRect().top) > window.innerHeight) return;
        window.scrollBy({ top: ["ArrowRight", "ArrowDown"].includes(event.key) ? 260 : -260, behavior: "smooth" });
      });

      async function handleContact(event) {
        event.preventDefault();
        const box = document.getElementById("contactMessage");
        try {
          const response = await fetch("/api/public/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: document.getElementById("name").value.trim(),
              email: document.getElementById("email").value.trim(),
              phone: document.getElementById("phone").value.trim(),
              organization: document.getElementById("subject").value.trim(),
              message: document.getElementById("message").value.trim(),
            }),
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || "Message non envoyé");
          box.textContent = data.message || "Message reçu.";
          box.className = "message show success";
          event.target.reset();
        } catch (error) {
          box.textContent = error.message;
          box.className = "message show error";
        }
      }
      document.getElementById("contactForm")?.addEventListener("submit", handleContact);
      document.body.dataset.homeReady = "true";
