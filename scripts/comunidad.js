// Comunidad de Cocina Rica: muro de publicaciones con me gusta y comentarios.
// Los datos se guardan en el navegador (localStorage).
(function () {
  "use strict";

  var CLAVE_POSTS = "cocinaRica.posts";
  var CLAVE_USUARIO = "cocinaRica.usuario";
  var CLAVE_SIGUIENDO = "cocinaRica.siguiendo";

  var COLORES = ["#d88c51", "#6a8d73", "#7b6ca8", "#c0645a", "#4f86a8", "#a08a3c"];

  var POSTS_INICIALES = [
    {
      id: "p1", autor: "Lucía Fernández", categoria: "Plato principal",
      titulo: "Milanesa napolitana casera",
      texto: "Empanada con pan rallado y perejil, al horno con salsa de tomate, jamón y mozzarella. ¡Un clásico de los domingos!",
      imagen: "../imagenes/imagen_three.webp", fecha: Date.now() - 1000 * 60 * 45,
      likes: ["Martín Gómez", "Sofía Ruiz"],
      comentarios: [{ autor: "Martín Gómez", texto: "¡Qué pinta! ¿Le pones orégano a la salsa?" }]
    },
    {
      id: "p2", autor: "Martín Gómez", categoria: "Plato principal",
      titulo: "Lasaña de carne",
      texto: "Capas de pasta, boloñesa y bechamel. El truco: dejarla reposar 15 minutos antes de cortar.",
      imagen: "../imagenes/imagen_seven.jpg", fecha: Date.now() - 1000 * 60 * 60 * 5,
      likes: ["Lucía Fernández", "Sofía Ruiz", "Diego Paz"],
      comentarios: []
    },
    {
      id: "p3", autor: "Sofía Ruiz", categoria: "Entrada",
      titulo: "Empanadas criollas",
      texto: "Relleno de carne cortada a cuchillo, cebolla, morrón y huevo duro. Repulgue a mano 🙌",
      imagen: "../imagenes/imagen_five.jpg", fecha: Date.now() - 1000 * 60 * 60 * 26,
      likes: ["Lucía Fernández"],
      comentarios: [
        { autor: "Diego Paz", texto: "¿Al horno o fritas?" },
        { autor: "Sofía Ruiz", texto: "¡Al horno! 200 °C unos 20 minutos." }
      ]
    }
  ];

  var SUGERIDOS = ["Diego Paz", "Valentina Ríos", "Andrés Molina"];

  // ---------- Almacenamiento seguro ----------
  function leer(clave, porDefecto) {
    try {
      var valor = localStorage.getItem(clave);
      return valor ? JSON.parse(valor) : porDefecto;
    } catch (e) {
      return porDefecto;
    }
  }

  function guardar(clave, valor) {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
      return true;
    } catch (e) {
      return false;
    }
  }

  // ---------- Estado ----------
  var posts = leer(CLAVE_POSTS, null) || POSTS_INICIALES;
  var usuario = leer(CLAVE_USUARIO, "Invitado");
  var siguiendo = leer(CLAVE_SIGUIENDO, []);
  var filtro = "todas";
  var busqueda = "";
  var imagenNueva = null;
  var comentariosAbiertos = {};

  // ---------- Utilidades ----------
  function $(id) { return document.getElementById(id); }

  function crear(etiqueta, clase, texto) {
    var el = document.createElement(etiqueta);
    if (clase) el.className = clase;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function iniciales(nombre) {
    return nombre.split(/\s+/).filter(Boolean).slice(0, 2)
      .map(function (p) { return p[0].toUpperCase(); }).join("") || "?";
  }

  function colorDe(nombre) {
    var h = 0;
    for (var i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) >>> 0;
    return COLORES[h % COLORES.length];
  }

  function avatar(nombre, extra) {
    var a = crear("div", "avatar" + (extra ? " " + extra : ""), iniciales(nombre));
    a.style.backgroundColor = colorDe(nombre);
    a.setAttribute("aria-hidden", "true");
    return a;
  }

  function hace(fecha) {
    var s = Math.floor((Date.now() - fecha) / 1000);
    if (s < 60) return "ahora";
    var m = Math.floor(s / 60);
    if (m < 60) return "hace " + m + " min";
    var h = Math.floor(m / 60);
    if (h < 24) return "hace " + h + " h";
    var d = Math.floor(h / 24);
    return "hace " + d + (d === 1 ? " día" : " días");
  }

  function persistir() {
    if (!guardar(CLAVE_POSTS, posts)) {
      alert("No se pudo guardar (quizás la imagen es muy grande). La publicación se verá hasta que recargues la página.");
    }
  }

  // ---------- Render ----------
  function renderPerfil() {
    ["perfil-avatar", "composer-avatar"].forEach(function (id) {
      var el = $(id);
      el.textContent = iniciales(usuario);
      el.style.backgroundColor = colorDe(usuario);
    });
    $("perfil-nombre").textContent = usuario;
    var mios = posts.filter(function (p) { return p.autor === usuario; });
    $("stat-posts").textContent = mios.length;
    $("stat-likes").textContent = mios.reduce(function (t, p) { return t + p.likes.length; }, 0);
  }

  function renderPost(p) {
    var art = crear("article", "panel post animate__animated animate__fadeIn");

    var cab = crear("div", "post-cabecera");
    cab.appendChild(avatar(p.autor));
    var info = crear("div");
    info.appendChild(crear("div", "post-autor", p.autor));
    info.appendChild(crear("div", "post-meta", hace(p.fecha)));
    cab.appendChild(info);
    cab.appendChild(crear("span", "etiqueta", p.categoria));
    art.appendChild(cab);

    art.appendChild(crear("h2", "post-titulo", p.titulo));
    if (p.texto) art.appendChild(crear("p", "post-texto", p.texto));
    if (p.imagen) {
      var img = crear("img", "post-imagen");
      img.src = p.imagen;
      img.alt = p.titulo;
      img.loading = "lazy";
      art.appendChild(img);
    }

    var cont = crear("div", "post-contadores");
    cont.appendChild(crear("span", "", "❤ " + p.likes.length));
    cont.appendChild(crear("span", "", p.comentarios.length + " comentario" + (p.comentarios.length === 1 ? "" : "s")));
    art.appendChild(cont);

    var acc = crear("div", "post-acciones");
    var meGusta = p.likes.indexOf(usuario) !== -1;
    var btnLike = crear("button", meGusta ? "activo" : "", meGusta ? "❤ Te gusta" : "♡ Me gusta");
    btnLike.type = "button";
    btnLike.setAttribute("aria-pressed", meGusta);
    btnLike.addEventListener("click", function () {
      var i = p.likes.indexOf(usuario);
      if (i === -1) p.likes.push(usuario); else p.likes.splice(i, 1);
      persistir();
      render();
    });
    acc.appendChild(btnLike);

    var btnCom = crear("button", "", "💬 Comentar");
    btnCom.type = "button";
    btnCom.addEventListener("click", function () {
      comentariosAbiertos[p.id] = true;
      render();
      var input = document.querySelector('[data-comentar="' + p.id + '"]');
      if (input) input.focus();
    });
    acc.appendChild(btnCom);

    if (p.autor === usuario) {
      var btnBorrar = crear("button", "", "🗑 Eliminar");
      btnBorrar.type = "button";
      btnBorrar.addEventListener("click", function () {
        if (!confirm("¿Eliminar esta publicación?")) return;
        posts = posts.filter(function (x) { return x.id !== p.id; });
        persistir();
        render();
      });
      acc.appendChild(btnBorrar);
    }
    art.appendChild(acc);

    if (p.comentarios.length || comentariosAbiertos[p.id]) {
      var zona = crear("div", "comentarios");
      p.comentarios.forEach(function (c) {
        var fila = crear("div", "comentario");
        fila.appendChild(avatar(c.autor));
        var burbuja = crear("div", "burbuja");
        burbuja.appendChild(crear("strong", "", c.autor));
        burbuja.appendChild(document.createTextNode(c.texto));
        fila.appendChild(burbuja);
        zona.appendChild(fila);
      });

      var form = crear("form", "form-comentario");
      form.appendChild(avatar(usuario));
      var input = crear("input");
      input.placeholder = "Escribe un comentario...";
      input.maxLength = 300;
      input.setAttribute("aria-label", "Comentario");
      input.setAttribute("data-comentar", p.id);
      form.appendChild(input);
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var texto = input.value.trim();
        if (!texto) return;
        p.comentarios.push({ autor: usuario, texto: texto });
        comentariosAbiertos[p.id] = true;
        persistir();
        render();
        var nuevo = document.querySelector('[data-comentar="' + p.id + '"]');
        if (nuevo) nuevo.focus();
      });
      zona.appendChild(form);
      art.appendChild(zona);
    }

    return art;
  }

  function renderFeed() {
    var feed = $("feed");
    feed.innerHTML = "";
    var q = busqueda.toLowerCase();
    var visibles = posts
      .filter(function (p) {
        if (filtro === "mias") return p.autor === usuario;
        return filtro === "todas" || p.categoria === filtro;
      })
      .filter(function (p) {
        return !q || (p.titulo + " " + p.texto + " " + p.autor).toLowerCase().indexOf(q) !== -1;
      })
      .sort(function (a, b) { return b.fecha - a.fecha; });

    if (!visibles.length) {
      feed.appendChild(crear("p", "panel vacio", "No hay publicaciones para mostrar. ¡Comparte la primera!"));
      return;
    }
    visibles.forEach(function (p) { feed.appendChild(renderPost(p)); });
  }

  function renderSugeridos() {
    var ul = $("sugeridos");
    ul.innerHTML = "";
    SUGERIDOS.forEach(function (nombre) {
      var li = crear("li");
      li.appendChild(avatar(nombre));
      li.appendChild(crear("span", "", nombre));
      var sigo = siguiendo.indexOf(nombre) !== -1;
      var b = crear("button", sigo ? "siguiendo" : "", sigo ? "Siguiendo" : "Seguir");
      b.type = "button";
      b.addEventListener("click", function () {
        var i = siguiendo.indexOf(nombre);
        if (i === -1) siguiendo.push(nombre); else siguiendo.splice(i, 1);
        guardar(CLAVE_SIGUIENDO, siguiendo);
        renderSugeridos();
      });
      li.appendChild(b);
      ul.appendChild(li);
    });
  }

  function renderTendencias() {
    var ul = $("tendencias");
    ul.innerHTML = "";
    posts.slice()
      .sort(function (a, b) { return b.likes.length - a.likes.length; })
      .slice(0, 4)
      .forEach(function (p) {
        var li = crear("li");
        li.appendChild(crear("span", "", "#" + p.titulo.split(" ")[0]));
        li.appendChild(crear("span", "", p.likes.length + " ❤"));
        ul.appendChild(li);
      });
  }

  function render() {
    renderPerfil();
    renderFeed();
    renderTendencias();
  }

  // ---------- Crear publicación ----------
  function actualizarBoton() {
    $("btn-publicar").disabled = !$("post-titulo").value.trim();
  }

  function quitarImagen() {
    imagenNueva = null;
    $("post-imagen").value = "";
    $("preview").hidden = true;
  }

  // Reduce la imagen para que quepa en localStorage.
  function procesarImagen(archivo) {
    var lector = new FileReader();
    lector.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 900;
        var escala = Math.min(1, max / Math.max(img.width, img.height));
        var canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        imagenNueva = canvas.toDataURL("image/jpeg", 0.75);
        $("preview-img").src = imagenNueva;
        $("preview").hidden = false;
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  }

  function iniciar() {
    $("post-titulo").addEventListener("input", actualizarBoton);
    $("quitar-imagen").addEventListener("click", quitarImagen);
    $("post-imagen").addEventListener("change", function (e) {
      var archivo = e.target.files[0];
      if (archivo && archivo.type.indexOf("image/") === 0) procesarImagen(archivo);
    });

    $("composer").addEventListener("submit", function (e) {
      e.preventDefault();
      var titulo = $("post-titulo").value.trim();
      if (!titulo) return;
      posts.push({
        id: "p" + Date.now(),
        autor: usuario,
        categoria: $("post-categoria").value,
        titulo: titulo,
        texto: $("post-texto").value.trim(),
        imagen: imagenNueva,
        fecha: Date.now(),
        likes: [],
        comentarios: []
      });
      persistir();
      e.target.reset();
      quitarImagen();
      actualizarBoton();
      render();
    });

    $("cambiar-nombre").addEventListener("click", function () {
      var nuevo = prompt("¿Cómo te llamas?", usuario === "Invitado" ? "" : usuario);
      if (!nuevo || !nuevo.trim()) return;
      var anterior = usuario;
      usuario = nuevo.trim().slice(0, 40);
      // Las publicaciones, me gusta y comentarios propios pasan al nuevo nombre.
      posts.forEach(function (p) {
        if (p.autor === anterior) p.autor = usuario;
        p.likes = p.likes.map(function (n) { return n === anterior ? usuario : n; });
        p.comentarios.forEach(function (c) { if (c.autor === anterior) c.autor = usuario; });
      });
      guardar(CLAVE_USUARIO, usuario);
      persistir();
      render();
    });

    $("filtros").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-filtro]");
      if (!b) return;
      filtro = b.getAttribute("data-filtro");
      Array.prototype.forEach.call(this.querySelectorAll("button"), function (x) {
        x.classList.toggle("activo", x === b);
      });
      renderFeed();
    });

    $("buscador").addEventListener("input", function (e) {
      busqueda = e.target.value.trim();
      renderFeed();
    });

    renderSugeridos();
    render();
  }

  iniciar();
})();
