import requests
from bs4 import BeautifulSoup
import json

def requisitar_site(siteUrl):
    conteudoSite = requests.get(siteUrl).content
    return analisar_requisicao(conteudoSite)

def analisar_requisicao(conteudoRequisicao):
    resultadosSite = BeautifulSoup(conteudoRequisicao, "html.parser")

    nome_estabelecimento = resultadosSite.find('div', {'class': 'txtTopo'})
    cnpj_estabelecimento = resultadosSite.find('div', {'class': 'text'})
    nomes_produtos = resultadosSite.select('span.txtTit2')
    preco_produtos = resultadosSite.select('span.valor')

    nome_e = tratamento_dados(nome_estabelecimento.text, "String")
    cnpj_e = tratamento_dados(cnpj_estabelecimento.text, "String")

    produtos = []
    for nome, preco in zip(nomes_produtos, preco_produtos):
        nome_prod = tratamento_dados(nome.text, "String")
        preco_prod = tratamento_dados(preco.text, "Preco")
        produtos.append({
            'nome_produto': nome_prod,
            'preco': preco_prod
        })

    nota_fiscal = {
        'nome_estabelecimento': nome_e,
        'cnpj': cnpj_e.replace("\n\t\t    ", " "),
        'produtos': produtos
    }

    return nota_fiscal

def tratamento_dados(dadoObtido, tipoString):
    if tipoString == 'Preco':
        return str(dadoObtido).replace('R$', '').strip().replace(',', '.')
    else:
        return str(dadoObtido).replace(';', ',').strip()

def start():
    url_notafiscal = "https://www.fazenda.pr.gov.br/nfce/qrcode?p=41250475864728000322650080003214521736334602%7C2%7C1%7C1%7C1758E709911ADD03AF37BB91B96C3D7F4CAB93B4"
    dados = requisitar_site(url_notafiscal)
    
    print(json.dumps(dados, indent=4, ensure_ascii=False))

start()
