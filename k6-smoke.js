import http from 'k6/http';
import { sleep, check } from 'k6';
import { URLSearchParams } from 'https://jslib.k6.io/url/1.0.0/index.js';

import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

export function handleSummary(data) {
  return {
    "Smoke_Test.html": htmlReport(data),
  };
}


// Teste Fumaça
export const options = {
  vus: 1,
  duration: '2m',
  thresholds: {
    http_req_duration: ['p(95)<2000'], //95% das requisicoes devem responder em até 2s
    http_req_failed: ['rate<0.01'] // 1% das requisições podem ocorrer erro
  }
};  

const BASE_URL = 'https://dev-gestao-app.hiper.com.br';
const nomeEntidade = 'HIPER SOFTWARE S.A.';
let Id;

export default function () {

  const url = `${BASE_URL}/Home/Login`

  const login = JSON.stringify({
    Dominio: 'polianaalves',
    Email: 'poliana.alves@hiper.com.br.hiper',
    Password: 'hiper123',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    'Timeout': '600s'
  };

  const res_login = http.post(url, login, params);

  check(res_login, {
    'status should be 200': (r) => r.status === 200
  })

  sleep(10);
  
  //Abertura de venda  
  const abrirVenda = `${BASE_URL}/operacoes/faturamento/api/abrir-venda`
  const ab_venda = JSON.stringify({
    LocalDeEstoqueId: "aa5c199d-471a-403e-ba47-86c2dbceb46b",
    PermancerNoUltimoTurnoValidoDoDiaAnterior: true,
    TabelaDePrecoId: null,
    TipoDeVendaId: 1,
    isOperacao: true
  });

  const res_abvenda = http.post(abrirVenda, ab_venda, params);

  Id = JSON.parse(res_abvenda.body).Id;

  console.log("vendaId: ", Id)

  check(res_abvenda, {
    'status should be 200': (r) => r.status === 200
  })

  sleep(10);

  //Pesquisa Geral Entidade
  const pesquisaGeralEntidade = `${BASE_URL}/operacoes/faturamento/api/pesquisa-geral`
  
  const searchParams = new URLSearchParams([
    ['Pesquisa', `${nomeEntidade}`],
    ['PesquisaEntidades', 'true'],
    ['PesquisaServicos', 'false'],
    ['PesquisaPedidosDeVenda', 'false'],
    ['PesquisaProdutos', 'false'],
    ['QuantidadeDeClientes', '1'],
  ]);

  let res_pgentidade = http.get(`${pesquisaGeralEntidade}?${searchParams.toString()}`, params);

  check(res_pgentidade, {
    'status should be 200': (r) => r.status === 200
  })

  sleep(10);
  
  //Definir Entidade
  const definirEntidade = `${BASE_URL}/operacoes/faturamento/api/${Id}/definir-entidade`

  const d_entidade = JSON.stringify({
    EntidadeId: 'de0718ac-5662-4fd0-90d4-2a01cf40621b',
    ParaUsoEConsumo: false,
    isEntidade: true
  });

  const res_dentidade = http.post(definirEntidade, d_entidade, params)

  check(res_dentidade, {
    'status should be 200': (r) => r.status === 200
  })

  sleep(10);
  
  //Lançar Rápido
  
  const lancarRapido = `${BASE_URL}/operacoes/faturamento/api/${Id}/lancar-rapido`

  const l_rapido = JSON.stringify({
    isLancamentoRapido: true,
    Parametro: "3191",
    VendedorId: null,
    LocalDeEstoqueId: "aa5c199d-471a-403e-ba47-86c2dbceb46b",
    TabelaDePrecoId: null,
    EntidadeId: 'de0718ac-5662-4fd0-90d4-2a01cf40621b',
    TipoDeVendaId: 1,
    ConfiguracaoDeBalanca: {
      IdentificadorDoProdutoPesavel: 1,
      IsReferenciaDoPesoNoCodigoDeBarras: false,
      TamanhoDoCodigoDoProduto: 4
    }
  });

  const res_lrapido = http.post(lancarRapido, l_rapido, params);

  // console.log(JSON.parse(res_lrapido.body));

  check(res_lrapido, {
    'status should be 200': (r) => r.status === 200
  })

  sleep(10);
  
  //Pagamento Dinheiro
  
  const pagDinheiro = `${BASE_URL}/operacoes/faturamento/api/${Id}/lancar-meio-de-pagamento/dinheiro`
    
  const pag_dinheiro = JSON.stringify({
    Valor: 100,
    isDinheiro: true
  });
  
  const res_pagdinheiro = http.post(pagDinheiro, pag_dinheiro, params);

  // console.log(JSON.parse(res_pagdinheiro.body));

  check(res_pagdinheiro, {
    'status should be 200': (r) => r.status === 200
  })

  sleep(10);

  //Consulta dados Emissao Documento Fiscal

  const getDadosEmissaoDocFiscal = `${BASE_URL}/entidade/GetDadosParaEmissaoDeDocumentoFiscal`
  const gd_emissaoDocFiscal = new URLSearchParams([
    ['id', 'de0718ac-5662-4fd0-90d4-2a01cf40621b'],
  ]);

  let res_gdemissaoDocFiscal = http.get(`${getDadosEmissaoDocFiscal}?${gd_emissaoDocFiscal.toString()}`, params);

  // console.log(JSON.parse(res_gdemissaoDocFiscal.body));

  check(res_gdemissaoDocFiscal, { 
    'status should be 200': (r) => r.status === 200
  })

  sleep(10);

  // Gerar nota fiscal
  const gerarNotaFiscal = 'https://dev-gestao-app.hiper.com.br/operacoes/gerar-nota-fiscal'

  const g_notaFiscal = JSON.stringify({
      DataEHoraDeEmissao: new Date().toISOString(),
      DataDeEntradaOuSaida: new Date().toISOString(),
      ConsumidorFinal: false,
      EntidadeId: 'de0718ac-5662-4fd0-90d4-2a01cf40621b',
      IdSerieFiscal: 176604,
      IdModeloDocumentoFiscal: 2,
      InformacoesAdicionais: {
        CidadeDeEmbarqueId: null,
        SomarOutrosValoresNaBaseDeCalculoDoIpi: false,
        TipoDoFrete: null,
        ValorDasDespesasAcessorias: 0,
        ValorDeSeguro: 0,
        ValorDoFrete: 0
      },
      ClienteDaNotaFiscal: {
        EntidadeId: 'de0718ac-5662-4fd0-90d4-2a01cf40621b',
        Cpf: "37177145206",
        Rg: null,
        Cnpj: null,
        InscricaoEstadual: "",
        Cep: "88350480",
        Logradouro: "Rua General Osorio",
        NumeroDoEndereco: "101",
        Bairro: "Guarani",
        Complemento: "",
        UfId: 42,
        CidadeId: 2510,
        TelefoneDdd: null,
        TelefoneNumero: null
      },
      Observacao: "expedita sunt ea",
      TipoDeVenda: 1,
      Transportadora: {
        Especie: null,
        Estado: null,
        Id: null,
        Marca: null,
        Numero: null,
        PesoBruto: null,
        PesoLiquido: null,
        Placa: null,
        Quantidade: null
      },
      VendasIds: [Id],
      UtilizaMarketplace: false,
      MarketplaceId: null,
      DestacaDifal: true
  });

  const res_gnotaFiscal = http.post(gerarNotaFiscal, g_notaFiscal, params);  

  // console.log(JSON.parse(res_gnotaFiscal.body));

  check(res_gnotaFiscal, {
    'status should be 200': (r) => r.status === 200
  })

  sleep(10);
}