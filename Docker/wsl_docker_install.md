# Instalação do Docker nativo no WSL (Ubuntu/Debian)

Este documento registra os comandos executados para instalar o Docker Engine nativamente no WSL, sem depender do Docker Desktop.

## Comandos Executados com Sucesso:

**1. Atualizar os pacotes e instalar dependências:**
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
```

**2. Adicionar a chave GPG oficial do Docker:**
```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

**3. Adicionar o repositório do Docker:**
```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

**4. Instalar o Docker Engine e complementos:**
```bash
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

**5. Iniciar o serviço e configurar permissões de grupo:**
```bash
sudo service docker start
sudo usermod -aG docker $USER
```

## Próximos passos
Com a instalação concluída, você pode inicializar seu ambiente de desenvolvimento usando o Docker Compose para subir os bancos de dados (como o Postgres que configuramos):

```bash
docker compose up -d postgres
```

> **Nota:** Pode ser necessário fechar e abrir novamente a aba do terminal (ou reiniciar a sessão do WSL) para que a alteração de permissão do grupo `docker` entre em vigor sem usar o `sudo`.
