from pathlib import Path
import http.client
import json
import os
from jobs.utils import Utils

class Debugger:
    def __init__(self):
        self.plugin_name = Utils.plugin_name

        with open(Utils.deck_settings_json, 'r') as f:
            settings = json.load(f)
            self.deck_ip = settings.get('deckip')
            self.deck_cef_port = settings.get('deckcefport')

    def open(self):
        host = self.deck_ip
        port = self.deck_cef_port

        connection = http.client.HTTPConnection(host, port)
        connection.request("GET", "/json")
        response = connection.getresponse()
    
        if response.status == 200:
            data = json.loads(response.read().decode())
            shared_js_context = next((entry for entry in data if entry.get("title") == "SharedJSContext"), None)

            if shared_js_context:
                full_url = self.deck_ip + ":"+ self.deck_cef_port + shared_js_context.get("devtoolsFrontendUrl")
                os.system(f'xdg-open {full_url}')
            else:
                print('Couldnt find "SharedJSContext" tab.')
        else:
            print(f"Erro getting active tabs: {response.status_code}")
