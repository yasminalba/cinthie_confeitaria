/* =====================================================
   Cinthiê Confeitaria - JavaScript do site
   Cada função só age se encontrar seus elementos na
   página, então o mesmo arquivo serve para todas.
===================================================== */

(function () {
  'use strict';

  /* -----------------------------------------------
     APOIO: preferência de movimento reduzido,
     rolagem otimizada e verificação de links
  ----------------------------------------------- */

  // Quem prefere menos animação no sistema não vê os efeitos de movimento
  var REDUZIR = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Uma única escuta de rolagem, repartida entre os efeitos
  var funcoesRolagem = [];
  var aguardandoQuadro = false;

  function aoRolar(funcao) {
    funcoesRolagem.push(funcao);
  }

  function processarRolagem() {
    aguardandoQuadro = false;
    funcoesRolagem.forEach(function (funcao) { funcao(); });
  }

  function pedirQuadro() {
    if (!aguardandoQuadro) {
      aguardandoQuadro = true;
      window.requestAnimationFrame(processarRolagem);
    }
  }

  window.addEventListener('scroll', pedirQuadro, { passive: true });
  window.addEventListener('resize', pedirQuadro);

  // Devolve a URL se o link leva a outra página do próprio site
  function urlInterna(link) {
    if (!link || !link.href) return null;
    if (link.target && link.target !== '_self') return null;
    if (link.hasAttribute('download')) return null;

    var url;
    try {
      url = new URL(link.href, window.location.href);
    } catch (erro) {
      return null;
    }

    if (url.protocol !== window.location.protocol || url.host !== window.location.host) {
      return null;
    }
    return url;
  }

  function cliqueSimples(evento) {
    return !evento.defaultPrevented && evento.button === 0 &&
      !evento.metaKey && !evento.ctrlKey && !evento.shiftKey && !evento.altKey;
  }

  /* -----------------------------------------------
     1. STATUS DA LOJA (index.html)
     Mostra "Aberto agora" ou "Fechado" conforme o
     horário real de São Paulo. Atualiza a cada minuto.
  ----------------------------------------------- */

  // Horários de funcionamento em horas [abre, fecha]; null = fechado
  var HORARIOS = {
    0: null,        // domingo
    1: [9, 19],     // segunda
    2: [9, 19],     // terça
    3: [9, 19],     // quarta
    4: [9, 19],     // quinta
    5: [9, 19],     // sexta
    6: [9, 19]      // sábado
  };

  var NOMES_DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  var SIGLAS_DIAS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function formatarHora(h) {
    return String(h).padStart(2, '0') + ':00';
  }

  function agoraEmSaoPaulo() {
    var partes = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(new Date());

    function valor(tipo) {
      return partes.find(function (p) { return p.type === tipo; }).value;
    }

    return {
      dia: SIGLAS_DIAS.indexOf(valor('weekday')),
      minutos: parseInt(valor('hour'), 10) * 60 + parseInt(valor('minute'), 10)
    };
  }

  function calcularStatus() {
    var agora = agoraEmSaoPaulo();
    var hoje = HORARIOS[agora.dia];

    if (hoje) {
      var abre = hoje[0] * 60;
      var fecha = hoje[1] * 60;

      if (agora.minutos >= abre && agora.minutos < fecha) {
        return { aberto: true, texto: 'Aberto agora · fecha às ' + formatarHora(hoje[1]) };
      }
      if (agora.minutos < abre) {
        return { aberto: false, texto: 'Fechado · abre hoje às ' + formatarHora(hoje[0]) };
      }
    }

    for (var i = 1; i <= 7; i++) {
      var dia = (agora.dia + i) % 7;
      if (HORARIOS[dia]) {
        var quando = i === 1 ? 'amanhã' : NOMES_DIAS[dia];
        return { aberto: false, texto: 'Fechado · abre ' + quando + ' às ' + formatarHora(HORARIOS[dia][0]) };
      }
    }

    return { aberto: false, texto: 'Fechado' };
  }

  function iniciarStatusLoja() {
    var elemento = document.getElementById('status-loja');
    if (!elemento) return;

    function atualizar() {
      var status = calcularStatus();
      elemento.textContent = status.texto;
      elemento.classList.toggle('status-aberto', status.aberto);
      elemento.classList.toggle('status-fechado', !status.aberto);
    }

    atualizar();
    setInterval(atualizar, 60000);
  }

  /* -----------------------------------------------
     2. LINK ATIVO NO MENU (todas as páginas)
     Marca a página atual para leitores de tela.
  ----------------------------------------------- */

  function iniciarLinkAtivo() {
    document.querySelectorAll('.menu a.ativo').forEach(function (link) {
      link.setAttribute('aria-current', 'page');
    });
  }

  /* -----------------------------------------------
     3. MENU RESPONSIVO (todas as páginas)
     Cria o botão de menu para telas pequenas.
     Fecha com Esc, ao escolher um link ou ao clicar fora.
  ----------------------------------------------- */

  function iniciarMenu() {
    var nav = document.querySelector('header nav');
    var menu = nav ? nav.querySelector('.menu') : null;
    if (!menu) return;

    if (!menu.id) menu.id = 'menu-principal';

    var botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'menu-toggle';
    botao.textContent = '☰';
    botao.setAttribute('aria-label', 'Abrir menu');
    botao.setAttribute('aria-expanded', 'false');
    botao.setAttribute('aria-controls', menu.id);
    nav.appendChild(botao);

    function definirAberto(aberto) {
      menu.classList.toggle('aberto', aberto);
      botao.textContent = aberto ? '✕' : '☰';
      botao.setAttribute('aria-expanded', String(aberto));
      botao.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    }

    botao.addEventListener('click', function () {
      definirAberto(!menu.classList.contains('aberto'));
    });

    menu.addEventListener('click', function (evento) {
      if (evento.target.closest('a')) definirAberto(false);
    });

    document.addEventListener('click', function (evento) {
      if (menu.classList.contains('aberto') && !nav.contains(evento.target)) {
        definirAberto(false);
      }
    });

    document.addEventListener('keydown', function (evento) {
      if (evento.key === 'Escape') definirAberto(false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) definirAberto(false);
    });
  }

  /* -----------------------------------------------
     4. BARRA DE NAVEGAÇÃO FLUTUANTE (todas as páginas)
     Ao rolar para cima, o menu reaparece no topo da
     tela. Ao rolar para baixo, ele se esconde.
  ----------------------------------------------- */

  function iniciarBarraFlutuante() {
    var nav = document.querySelector('header nav');
    var menu = nav ? nav.querySelector('.menu') : null;
    if (!menu) return;

    var barra = document.createElement('nav');
    barra.className = 'barra-flutuante';
    barra.setAttribute('aria-label', 'Navegação rápida');

    var inicio = menu.querySelector('a');
    var logo = nav.querySelector('.logo img');

    if (inicio && logo) {
      var linkLogo = document.createElement('a');
      linkLogo.className = 'flutuante-logo';
      linkLogo.href = inicio.getAttribute('href');
      linkLogo.setAttribute('aria-label', 'Ir para o início');

      var imagemLogo = logo.cloneNode(true);
      imagemLogo.alt = '';
      linkLogo.appendChild(imagemLogo);
      barra.appendChild(linkLogo);
    }

    var links = document.createElement('div');
    links.className = 'flutuante-links';
    menu.querySelectorAll('a').forEach(function (link) {
      links.appendChild(link.cloneNode(true));
    });
    barra.appendChild(links);

    var whatsapp = nav.querySelector('.botao-whatsapp');
    if (whatsapp) barra.appendChild(whatsapp.cloneNode(true));

    document.body.appendChild(barra);

    var ultimoY = window.scrollY;

    aoRolar(function () {
      var y = window.scrollY;
      if (Math.abs(y - ultimoY) < 6) return;

      // Aparece só quando a pessoa rola para cima, longe do topo
      barra.classList.toggle('visivel', y > 150 && y < ultimoY);
      ultimoY = y;
    });
  }

  /* -----------------------------------------------
     5. BARRA DE PROGRESSO DE LEITURA (todas as páginas)
     Linha dourada no topo que mostra quanto da página
     já foi percorrido.
  ----------------------------------------------- */

  function iniciarProgresso() {
    var barra = document.createElement('div');
    barra.className = 'barra-progresso';
    barra.setAttribute('aria-hidden', 'true');
    document.body.appendChild(barra);

    aoRolar(function () {
      var total = document.documentElement.scrollHeight - window.innerHeight;
      var porcentagem = total > 0 ? Math.min((window.scrollY / total) * 100, 100) : 0;
      barra.style.width = porcentagem + '%';
    });
  }

  /* -----------------------------------------------
     6. BOTÃO VOLTAR AO TOPO (todas as páginas)
  ----------------------------------------------- */

  function iniciarVoltarTopo() {
    var botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'voltar-topo';
    botao.textContent = '↑';
    botao.setAttribute('aria-label', 'Voltar ao topo');
    document.body.appendChild(botao);

    botao.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: REDUZIR ? 'auto' : 'smooth' });
    });

    aoRolar(function () {
      botao.classList.toggle('visivel', window.scrollY > 500);
    });
  }

  /* -----------------------------------------------
     7. ROLAGEM SUAVE PARA ÂNCORAS (todas as páginas)
     Links como #formulario deslizam até a seção,
     deixando espaço para a barra flutuante.
  ----------------------------------------------- */

  function iniciarRolagemSuave() {
    document.addEventListener('click', function (evento) {
      if (!cliqueSimples(evento) || !evento.target.closest) return;

      var url = urlInterna(evento.target.closest('a'));
      if (!url || url.hash.length < 2 || url.pathname !== window.location.pathname) return;

      var alvo;
      try {
        alvo = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      } catch (erro) {
        return;
      }
      if (!alvo) return;

      evento.preventDefault();
      var topo = alvo.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: topo, behavior: REDUZIR ? 'auto' : 'smooth' });

      try {
        history.pushState(null, '', url.hash);
      } catch (erro) {
        /* sem problema: a rolagem já aconteceu */
      }
    });
  }

  /* -----------------------------------------------
     8. TRANSIÇÃO ENTRE PÁGINAS (todas as páginas)
     A página entra com fade e sai com fade antes de
     abrir o próximo link do site.
  ----------------------------------------------- */

  function iniciarTransicaoPaginas() {
    if (REDUZIR) return;

    document.body.classList.add('pagina-entrando');

    document.addEventListener('click', function (evento) {
      if (!cliqueSimples(evento) || !evento.target.closest) return;

      var url = urlInterna(evento.target.closest('a'));
      if (!url) return;

      // Mesma página (incluindo âncoras): deixa o navegador agir
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      evento.preventDefault();
      document.body.classList.add('saindo');
      setTimeout(function () { window.location.href = url.href; }, 250);
    });

    // Ao voltar pelo botão do navegador, a página não fica apagada
    window.addEventListener('pageshow', function (evento) {
      if (evento.persisted) document.body.classList.remove('saindo');
    });
  }

  /* -----------------------------------------------
     9. CARREGAMENTO ANTECIPADO (todas as páginas)
     Ao passar o mouse (ou tocar) num link, a página
     de destino já começa a carregar.
  ----------------------------------------------- */

  function iniciarPrefetch() {
    var jaPedidos = {};

    function antecipar(evento) {
      if (!evento.target.closest) return;

      var url = urlInterna(evento.target.closest('a'));
      if (!url || jaPedidos[url.href]) return;
      if (url.pathname === window.location.pathname) return;

      jaPedidos[url.href] = true;

      var dica = document.createElement('link');
      dica.rel = 'prefetch';
      dica.href = url.href;
      document.head.appendChild(dica);
    }

    document.addEventListener('mouseover', antecipar);
    document.addEventListener('touchstart', antecipar, { passive: true });
  }

  /* -----------------------------------------------
     10. APARECER AO ROLAR (todas as páginas)
     Cards e blocos surgem com fade e subida suave
     quando entram na tela, em sequência.
  ----------------------------------------------- */

  function iniciarRevelar() {
    if (REDUZIR || !('IntersectionObserver' in window)) return;

    var alvos = document.querySelectorAll(
      '.card, .categorias, .info, .card-info, .comentarios, .item-galeria, ' +
      '.foto-galeria, .card-imagem, .cards, .novidade-conteudo, .encomenda, ' +
      '.cartao-fidelidade, .formulario-contato, .informacoes-contato, .mapa, ' +
      '.valores, .termo li, .texto-sobre, .entrevista-audio'
    );
    if (!alvos.length) return;

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;

        var elemento = entrada.target;
        observador.unobserve(elemento);
        elemento.classList.add('visivel');

        // Depois da animação, devolve o elemento ao estado normal
        setTimeout(function () {
          elemento.classList.remove('reveal', 'visivel');
          elemento.style.transitionDelay = '';
        }, 1300);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    alvos.forEach(function (elemento) {
      var posicao = elemento.parentElement
        ? Array.prototype.indexOf.call(elemento.parentElement.children, elemento)
        : 0;

      elemento.classList.add('reveal');
      elemento.style.transitionDelay = (posicao % 4) * 90 + 'ms';
      observador.observe(elemento);
    });
  }

  /* -----------------------------------------------
     11. CONTADORES ANIMADOS (quem-somos.html)
     Os números 5,0 / 18 / 100% sobem até o valor final
     quando aparecem na tela.
  ----------------------------------------------- */

  function iniciarContadores() {
    var alvos = document.querySelectorAll('.cards h2');
    if (!alvos.length || REDUZIR || !('IntersectionObserver' in window)) return;

    function animar(elemento, final) {
      var correspondencia = final.match(/^(\d+(?:,\d+)?)(.*)$/);
      if (!correspondencia) {
        elemento.textContent = final;
        return;
      }

      var numero = parseFloat(correspondencia[1].replace(',', '.'));
      var casas = correspondencia[1].indexOf(',') !== -1 ? correspondencia[1].split(',')[1].length : 0;
      var sufixo = correspondencia[2];
      var duracao = 1200;
      var inicio = null;

      function passo(momento) {
        if (inicio === null) inicio = momento;

        var progresso = Math.min((momento - inicio) / duracao, 1);
        var suavizado = 1 - Math.pow(1 - progresso, 3);

        elemento.textContent = (numero * suavizado).toFixed(casas).replace('.', ',') + sufixo;

        if (progresso < 1) {
          window.requestAnimationFrame(passo);
        } else {
          elemento.textContent = final;
        }
      }

      window.requestAnimationFrame(passo);
    }

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;

        observador.unobserve(entrada.target);
        animar(entrada.target, entrada.target.getAttribute('data-final'));
      });
    }, { threshold: 0.6 });

    alvos.forEach(function (elemento) {
      var final = elemento.textContent.trim();
      var correspondencia = final.match(/^(\d+(?:,\d+)?)(.*)$/);
      if (!correspondencia) return;

      elemento.setAttribute('data-final', final);
      elemento.textContent = '0' + correspondencia[2];
      observador.observe(elemento);
    });
  }

  /* -----------------------------------------------
     12. BUSCA NO CARDÁPIO (cardapio.html)
     Campo de busca que filtra itens e categorias.
  ----------------------------------------------- */

  function normalizar(texto) {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function iniciarBuscaCardapio() {
    var secao = document.querySelector('.cardapio-tabela');
    if (!secao) return;

    var titulo = secao.querySelector('h2');
    var cards = Array.prototype.slice.call(secao.querySelectorAll('.card'));
    if (!titulo || !cards.length) return;

    var caixa = document.createElement('div');
    caixa.className = 'busca-cardapio';

    var rotulo = document.createElement('label');
    rotulo.setAttribute('for', 'busca-cardapio');
    rotulo.textContent = 'Buscar no cardápio';

    var campo = document.createElement('input');
    campo.type = 'search';
    campo.id = 'busca-cardapio';
    campo.placeholder = 'Ex.: brigadeiro, ninho, morango...';
    campo.autocomplete = 'off';

    caixa.appendChild(rotulo);
    caixa.appendChild(campo);

    var vazio = document.createElement('p');
    vazio.className = 'busca-vazia';
    vazio.setAttribute('role', 'status');
    vazio.textContent = 'Nenhum item encontrado. Tente outra palavra.';
    vazio.hidden = true;

    titulo.after(caixa);
    caixa.after(vazio);

    campo.addEventListener('input', function () {
      var termo = normalizar(campo.value.trim());
      var totalVisiveis = 0;

      cards.forEach(function (card) {
        var categoria = card.querySelector('h3');
        var categoriaCombina = termo !== '' && categoria && normalizar(categoria.textContent).indexOf(termo) !== -1;
        var visiveisNoCard = 0;

        card.querySelectorAll('li').forEach(function (item) {
          var combina = termo === '' || categoriaCombina || normalizar(item.textContent).indexOf(termo) !== -1;
          item.hidden = !combina;
          if (combina) visiveisNoCard++;
        });

        card.hidden = visiveisNoCard === 0;
        totalVisiveis += visiveisNoCard;
      });

      vazio.hidden = totalVisiveis !== 0;
    });
  }

  /* -----------------------------------------------
     13. CARTÃO DE FIDELIDADE (fidelidade.html)
     Clique (ou Enter/Espaço) para carimbar um selo.
  ----------------------------------------------- */

  function iniciarFidelidade() {
    var contagem = document.querySelector('.contagem');
    var selos = Array.prototype.slice.call(document.querySelectorAll('.selo, .selo-ok'));
    if (!contagem || !selos.length) return;

    var legenda = document.querySelector('.cartao-fidelidade .legenda');
    var mensagem = document.createElement('p');
    mensagem.className = 'mensagem-fidelidade';
    mensagem.setAttribute('role', 'status');
    if (legenda) legenda.before(mensagem);

    function atualizar() {
      var carimbados = selos.filter(function (s) { return s.classList.contains('selo-ok'); }).length;
      contagem.textContent = carimbados + ' / ' + selos.length + ' SELOS';
      mensagem.textContent = carimbados === selos.length
        ? 'Cartela completa! Troque por 1 bolo caseiro na loja.'
        : '';
    }

    function alternar(selo) {
      var carimbado = selo.classList.contains('selo-ok');
      selo.classList.toggle('selo-ok', !carimbado);
      selo.classList.toggle('selo', carimbado);
      selo.setAttribute('aria-pressed', String(!carimbado));
      atualizar();
    }

    selos.forEach(function (selo, indice) {
      selo.tabIndex = 0;
      selo.setAttribute('role', 'button');
      selo.setAttribute('aria-label', 'Selo ' + (indice + 1));
      selo.setAttribute('aria-pressed', String(selo.classList.contains('selo-ok')));

      selo.addEventListener('click', function () { alternar(selo); });
      selo.addEventListener('keydown', function (evento) {
        if (evento.key === 'Enter' || evento.key === ' ') {
          evento.preventDefault();
          alternar(selo);
        }
      });
    });

    atualizar();
  }

  /* -----------------------------------------------
     14. GALERIA COM AMPLIAÇÃO (galeria.html)
     Clique na foto para ver em tamanho maior.
  ----------------------------------------------- */

  function iniciarLightbox() {
    var imagens = document.querySelectorAll('.foto-galeria img');
    if (!imagens.length) return;

    var sobreposicao = document.createElement('div');
    sobreposicao.className = 'lightbox';
    sobreposicao.hidden = true;
    sobreposicao.setAttribute('role', 'dialog');
    sobreposicao.setAttribute('aria-modal', 'true');
    sobreposicao.setAttribute('aria-label', 'Imagem ampliada');

    var fechar = document.createElement('button');
    fechar.type = 'button';
    fechar.className = 'lightbox-fechar';
    fechar.textContent = '✕';
    fechar.setAttribute('aria-label', 'Fechar imagem');

    var ampliada = document.createElement('img');
    var legenda = document.createElement('p');

    sobreposicao.appendChild(fechar);
    sobreposicao.appendChild(ampliada);
    sobreposicao.appendChild(legenda);
    document.body.appendChild(sobreposicao);

    var ultimaFoto = null;

    function abrir(imagem) {
      ultimaFoto = imagem;
      ampliada.src = imagem.src;
      ampliada.alt = imagem.alt;
      legenda.textContent = imagem.alt;
      sobreposicao.hidden = false;
      document.body.classList.add('lightbox-aberto');
      fechar.focus();
    }

    function encerrar() {
      sobreposicao.hidden = true;
      ampliada.removeAttribute('src');
      document.body.classList.remove('lightbox-aberto');
      if (ultimaFoto) ultimaFoto.focus();
    }

    imagens.forEach(function (imagem) {
      imagem.tabIndex = 0;
      imagem.setAttribute('role', 'button');

      imagem.addEventListener('click', function () { abrir(imagem); });
      imagem.addEventListener('keydown', function (evento) {
        if (evento.key === 'Enter' || evento.key === ' ') {
          evento.preventDefault();
          abrir(imagem);
        }
      });
    });

    sobreposicao.addEventListener('click', function (evento) {
      if (evento.target !== ampliada) encerrar();
    });

    document.addEventListener('keydown', function (evento) {
      if (evento.key === 'Escape' && !sobreposicao.hidden) encerrar();
    });
  }

  /* -----------------------------------------------
     15. FORMULÁRIOS (contato.html e orcamento.html)
     - Máscara de telefone: (11) 93935-9449
     - Data do orçamento: não aceita datas passadas
  ----------------------------------------------- */

  function formatarTelefone(valor) {
    var d = valor.replace(/\D/g, '').slice(0, 11);

    if (d.length === 0) return '';
    if (d.length <= 2) return '(' + d;
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  function iniciarFormularios() {
    document.querySelectorAll('input[type="tel"]').forEach(function (campo) {
      campo.maxLength = 15;

      campo.addEventListener('input', function () {
        campo.value = formatarTelefone(campo.value);

        var digitos = campo.value.replace(/\D/g, '').length;
        if (digitos > 0 && digitos < 10) {
          campo.setCustomValidity('Informe o DDD e o número completo.');
        } else {
          campo.setCustomValidity('');
        }
      });
    });

    var data = document.querySelector('form input[type="date"]');
    if (data) {
      var hoje = new Date();
      var ano = hoje.getFullYear();
      var mes = String(hoje.getMonth() + 1).padStart(2, '0');
      var dia = String(hoje.getDate()).padStart(2, '0');
      data.min = ano + '-' + mes + '-' + dia;
    }
  }

  /* -----------------------------------------------
     INICIALIZAÇÃO
  ----------------------------------------------- */

  iniciarStatusLoja();
  iniciarLinkAtivo();
  iniciarMenu();
  iniciarBarraFlutuante();
  iniciarProgresso();
  iniciarVoltarTopo();
  iniciarRolagemSuave();
  iniciarTransicaoPaginas();
  iniciarPrefetch();
  iniciarRevelar();
  iniciarContadores();
  iniciarBuscaCardapio();
  iniciarFidelidade();
  iniciarLightbox();
  iniciarFormularios();

  // Primeira leitura da posição de rolagem
  processarRolagem();
})();
