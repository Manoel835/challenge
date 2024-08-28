# Usar uma imagem base do Node.js
FROM node:18

# Definir o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copiar os arquivos de configuração do package.json e package-lock.json (se existir)
COPY package*.json ./

# Instalar as dependências
RUN npm install

# Copiar o restante do código-fonte
COPY . .

# Gerar o cliente Prisma
RUN npx prisma generate

# Expor a porta que a aplicação usará
EXPOSE 3000

# Definir a variável de ambiente NODE_ENV como production
ENV NODE_ENV=production

# Comando para iniciar a aplicação
CMD ["npm", "start"]
