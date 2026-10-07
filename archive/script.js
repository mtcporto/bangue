const programacaoCineBangue = [
    {
        "data": "10/04",
        "dia_semana": "Quarta",
        "horario": "19h",
        "filme": "Nada Será Como Antes"
      },
      {
        "data": "11/04",
        "dia_semana": "Quinta",
        "horario": "17h",
        "filme": "A Matéria Noturna"
      },
      {
        "data": "11/04",
        "dia_semana": "Quinta",
        "horario": "19h",
        "filme": "Eu, Capitão"
      },
      {
        "data": "13/04",
        "dia_semana": "Sábado",
        "horario": "15h",
        "filme": "Nada Será Como Antes"
      },
      {
        "data": "13/04",
        "dia_semana": "Sábado",
        "horario": "17h",
        "filme": "O Melhor Está Por Vir"
      },
      {
        "data": "13/04",
        "dia_semana": "Sábado",
        "horario": "19h",
        "filme": "As Bestas"
      },
      {
        "data": "14/04",
        "dia_semana": "Domingo",
        "horario": "15h",
        "filme": "Um filme de Cinema"
      },
      {
        "data": "14/04",
        "dia_semana": "Domingo",
        "horario": "17h",
        "filme": "A Matéria Noturna"
      },
      {
        "data": "14/04",
        "dia_semana": "Domingo",
        "horario": "19h",
        "filme": "Eu, Capitão"
      },
      {
        "data": "15/04",
        "dia_semana": "Segunda",
        "horario": "19h",
        "filme": "As Bestas"
      },
      {
        "data": "16/04",
        "dia_semana": "Terça",
        "horario": "19h",
        "filme": "O Melhor Está Por Vir"
      },
      {
        "data": "17/04",
        "dia_semana": "Quarta",
        "horario": "19h",
        "filme": "Eu, Capitão"
      },
      {
        "data": "18/04",
        "dia_semana": "Quinta",
        "horario": "17h",
        "filme": "Nada Será Como Antes"
      },
      {
        "data": "18/04",
        "dia_semana": "Quinta",
        "horario": "19h",
        "filme": "As Bestas"
      },
      {
        "data": "20/04",
        "dia_semana": "Sábado",
        "horario": "15h",
        "filme": "O Melhor Está Por Vir"
      },
      {
        "data": "20/04",
        "dia_semana": "Sábado",
        "horario": "17h",
        "filme": "A Matéria Noturna"
      },
      {
        "data": "20/04",
        "dia_semana": "Sábado",
        "horario": "19h",
        "filme": "Eu, Capitão"
      },
      {
        "data": "21/04",
        "dia_semana": "Domingo",
        "horario": "15h",
        "filme": "Um filme de Cinema"
      },
      {
        "data": "21/04",
        "dia_semana": "Domingo",
        "horario": "17h",
        "filme": "Nada Será Como Antes"
      },
      {
        "data": "21/04",
        "dia_semana": "Domingo",
        "horario": "19h",
        "filme": "As Bestas"
      },
      {
        "data": "22/04",
        "dia_semana": "Segunda",
        "horario": "19h",
        "filme": "O Melhor Está Por Vir"
      },
      {
        "data": "23/04",
        "dia_semana": "Terça",
        "horario": "19h",
        "filme": "Eu, Capitão"
      },
      {
        "data": "24/04",
        "dia_semana": "Quarta",
        "horario": "19h",
        "filme": "As Bestas"
      },
      {
        "data": "25/04",
        "dia_semana": "Quinta",
        "horario": "17h",
        "filme": "O Melhor Está Por Vir"
      },
      {
        "data": "25/04",
        "dia_semana": "Quinta",
        "horario": "19h",
        "filme": "A Matéria Noturna"
      },
      {
        "data": "27/04",
        "dia_semana": "Sábado",
        "horario": "15h",
        "filme": "A Matéria Noturna"
      },
      {
        "data": "27/04",
        "dia_semana": "Sábado",
        "horario": "17h",
        "filme": "Nada Será Como Antes"
      },
      {
        "data": "27/04",
        "dia_semana": "Sábado",
        "horario": "19h",
        "filme": "As Bestas"
      },
      {
        "data": "28/04",
        "dia_semana": "Domingo",
        "horario": "15h",
        "filme": "Um filme de Cinema"
      },
      {
        "data": "28/04",
        "dia_semana": "Domingo",
        "horario": "17h",
        "filme": "O Melhor Está Por Vir"
      },
      {
        "data": "28/04",
        "dia_semana": "Domingo",
        "horario": "19h",
        "filme": "Eu, Capitão"
      },
      {
        "data": "29/04",
        "dia_semana": "Segunda",
        "horario": "19h",
        "filme": "Nada Será Como Antes"
      },
      {
        "data": "30/04",
        "dia_semana": "Terça",
        "horario": "19h",
        "filme": "A Matéria Noturna"
      }  ];
  
  // Função para renderizar os elementos de data
  function renderizarDatas() {
    const rollerSlider = document.querySelector('.roller-slider');
    rollerSlider.innerHTML = '';
  
    const uniqueDates = [...new Set(programacaoCineBangue.map(item => item.data))];
    uniqueDates.slice(0, 7).forEach(date => {
      const dateLink = document.createElement('span');
      dateLink.classList.add('calendar-date-link', 'roller-item');
      if (date === '10/04') {
        dateLink.classList.add('current');
      }
      dateLink.innerHTML = `
        <div class="day">${obterDiaSemana(date)}</div>
        <div class="num">${obterDia(date)}</div>
        <div class="month">${obterMes(date)}</div>
      `;
      dateLink.addEventListener('click', () => exibirFilmes(date));
      rollerSlider.appendChild(dateLink);
    });
  
    atualizarBotoes(uniqueDates);
  }
  
  function atualizarBotoes(uniqueDates) {
    const rollerBtns = document.querySelectorAll('.roller-btn');
    const firstDate = uniqueDates[0];
    const lastDate = uniqueDates[uniqueDates.length - 1];
  
    rollerBtns.forEach(btn => {
      btn.classList.remove('disabled');
      if (obterDia(firstDate) === '10') {
        btn.classList.add('btn-left', 'disabled');
      }
      if (obterDia(lastDate) === '30') {
        btn.classList.add('btn-right', 'disabled');
      }
    });
  }
  // Função para exibir as informações dos filmes
  function exibirFilmes(data) {
    const movieContainer = document.getElementById('movie-container');
    movieContainer.innerHTML = '';
  
    const filmes = programacaoCineBangue.filter(item => item.data === data);
    filmes.forEach(item => {
      const movieInfo = document.createElement('div');
      movieInfo.classList.add('movie-info');
      movieInfo.innerHTML = `
        <h3>${item.filme}</h3>
        <p>${item.dia_semana}, ${item.data} - ${item.horario}</p>
      `;
      movieContainer.appendChild(movieInfo);
    });
  
    atualizarDataSelecionada(data);
  }
  
  // Função para atualizar a data selecionada no calendário
  function atualizarDataSelecionada(data) {
    const dateLinks = document.querySelectorAll('.calendar-date-link');
    dateLinks.forEach(link => {
      link.classList.remove('current');
      if (link.textContent.includes(obterDia(data))) {
        link.classList.add('current');
      }
    });
  }
  
  // Função para atualizar os botões de navegação
  function atualizarBotoes() {
    const rollerBtns = document.querySelectorAll('.roller-btn');
    const firstDate = programacaoCineBangue[0].data;
    const lastDate = programacaoCineBangue[programacaoCineBangue.length - 1].data;
  
    rollerBtns.forEach(btn => {
      btn.classList.remove('disabled');
      if (obterDia(firstDate) === '10') {
        btn.classList.add('btn-left', 'disabled');
      }
      if (obterDia(lastDate) === '30') {
        btn.classList.add('btn-right', 'disabled');
      }
    });
  }
  
  // Funções auxiliares
  function obterDiaSemana(data) {
    const dias = ['Dom.', 'Seg.', 'Ter.', 'Qua.', 'Qui.', 'Sex.', 'Sáb.'];
    const diaSemana = new Date(data.split('/')[2], data.split('/')[1] - 1, data.split('/')[0]).getDay();
    return dias[diaSemana];
  }
  
  function obterDia(data) {
    return data.split('/')[0];
  }
  
  function obterMes(data) {
    const meses = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
    return meses[parseInt(data.split('/')[1]) - 1];
  }
  
  // Inicialização
  renderizarDatas();
  exibirFilmes('10/04');