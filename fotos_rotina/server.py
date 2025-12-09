"""
INSTRUÇÕES DE USO:

1) Coloque este arquivo (server.py) na MESMA pasta do seu arquivo .html
2) Abra o terminal NESTA pasta.
3) EXECUTE O COMANDO ABAIXO (Não use 'python server.py'):
   
   python server.py

4) No navegador, acesse: http://localhost:8000
"""

import http.server
import socketserver
import os
import json
import time

# Configuração
PORT = 8000
UPLOAD_DIR = 'uploads'

# Garante que a pasta existe
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        """
        Manipula requisições POST para upload de arquivos.
        Compatível com Python 3.13+ (sem uso de cgi).
        """
        if self.path == '/upload.php' or self.path == '/upload':
            try:
                # 1. Verificar Content-Type e obter Boundary
                content_type = self.headers.get('Content-Type', '')
                if 'multipart/form-data' not in content_type:
                    self._send_json(400, "erro", "Content-Type deve ser multipart/form-data")
                    return

                # Extrai o boundary (separador de dados) do cabeçalho
                # Exemplo: multipart/form-data; boundary=----WebKitFormBoundary...
                try:
                    boundary = content_type.split('boundary=')[1].encode()
                except IndexError:
                    self._send_json(400, "erro", "Boundary não encontrado no cabeçalho")
                    return

                # 2. Ler o tamanho do conteúdo e os dados brutos
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length == 0:
                    self._send_json(400, "erro", "Arquivo vazio")
                    return
                
                # Lê o corpo da requisição (bytes)
                body = self.rfile.read(content_length)

                # 3. Processamento manual do Multipart (Simples)
                # Divide o corpo usando o boundary. 
                # Nota: Esta é uma implementação simplificada para fins de teste.
                # Em produção, recomenda-se bibliotecas como 'python-multipart'.
                parts = body.split(b'--' + boundary)

                file_saved = False
                filename = ""

                for part in parts:
                    # Procura a parte que contém o arquivo (name="imagem")
                    # Verifica se tem cabeçalho de Content-Disposition e se é o campo 'imagem'
                    if b'Content-Disposition' in part and b'name="imagem"' in part:
                        
                        # A estrutura da part é: Cabeçalhos \r\n\r\n Dados Binários \r\n
                        header_end = part.find(b'\r\n\r\n')
                        
                        if header_end != -1:
                            # Extrai os dados reais da imagem (pula os cabeçalhos)
                            # Remove o \r\n final que faz parte do protocolo multipart
                            file_data = part[header_end+4:].rstrip(b'\r\n')
                            
                            if len(file_data) > 0:
                                # Gera nome único
                                filename = f"foto_{int(time.time())}.jpg"
                                filepath = os.path.join(UPLOAD_DIR, filename)

                                # Salva no disco
                                with open(filepath, 'wb') as f:
                                    f.write(file_data)
                                
                                file_saved = True
                                break # Arquivo encontrado e salvo, pode parar
                
                if file_saved:
                    self._send_json(200, "sucesso", "Imagem salva com sucesso!", filename)
                else:
                    self._send_json(400, "erro", "Nenhuma imagem válida encontrada no envio.")

            except Exception as e:
                print(f"Erro no servidor: {e}")
                self._send_json(500, "erro", str(e))
            return

        # Para outras requisições (GET), age como servidor de arquivos normal
        super().do_POST()

    def _send_json(self, status_code, status_msg, message, filename=None):
        """Helper para enviar resposta JSON"""
        response = {
            "status": status_msg,
            "mensagem": message
        }
        if filename:
            response["arquivo"] = filename

        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())

    # Adiciona CORS para evitar bloqueios do navegador
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

# Inicialização do Servidor
print(f"--- SERVIDOR INICIADO ---")
print(f"Endereço: http://localhost:{PORT}")
print(f"Pasta de uploads: {os.path.abspath(UPLOAD_DIR)}")
print(f"Para parar, pressione Ctrl+C")
print(f"-------------------------")

# Configura o servidor para permitir reuso da porta rápido em caso de reinício
socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor parado pelo usuário.")
        httpd.server_close()