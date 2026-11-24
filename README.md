# Web (React + Vite)

## Setup
1. `cd apps/web`
2. `cp .env.example .env`
3. `npm install`
4. `npm run dev`

A app espera o backend Laravel em `http://localhost:8000` por defeito.

## GesBanda

O endereço inicial apresenta o site institucional. A área reservada fica em `/?app=1` e as páginas aceitam `lang=pt` ou `lang=en`. O diretório e as vagas são públicos. As páginas de cada banda mostram apenas o perfil e os eventos que os gestores decidiram publicar.

### Informação legal

Preenche as variáveis `VITE_LEGAL_*` em `.env` com os dados públicos reais do operador, contactos e entidade de resolução de litígios aplicável. Introduz também os fornecedores, os critérios de conservação e as garantias de transferência que correspondem ao ambiente publicado, nas duas línguas. Antes de lançar o serviço, revê o texto jurídico e os dados de contratação com o operador. O site já disponibiliza os termos, a privacidade, a informação sobre armazenamento, a informação legal e os contactos e reclamações.

### Validação

`npm run build` verifica os tipos e compila os ficheiros em `dist`. O Vite usa `VITE_API_BASE_URL` para ligar ao backend.

