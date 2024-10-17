import os
import re
import json
from jobs.utils import Utils

class TranslationUpdater:
    def __init__(self):
        self.root_directory = Utils.plugin_dir
        self.translations_file = os.path.join(self.root_directory, "assets" + os.sep + "translations.i18n.json")
        # Patrón para `Translator.translate('<texto>')` o `Translator.translate('<texto>', <object>)`
        self.translate_pattern = re.compile(
            r"Translator\s*\.\s*translate\s*\(\s*['\"](.*?)['\"]\s*(?:,\s*(\{.*?\}))?\s*\)", 
            re.DOTALL
        )

    def update_translations(self):
        """Método público para actualizar el archivo de traducciones."""
        translations = self.__find_translations_in_files()
        self.__update_translation_file(translations)

    def __find_translations_in_files(self):
        """Busca recursivamente las invocaciones a Translator.translate en archivos .ts y .tsx."""
        translations = []
        for subdir, _, files in os.walk(self.root_directory):
            for file in files:
                if file.endswith('.ts') or file.endswith('.tsx'):
                    file_path = os.path.join(subdir, file)
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        matches = re.findall(self.translate_pattern, content)
                        translations.extend(matches)
        return translations

    def __update_translation_file(self, translations):
        if not os.path.exists(self.translations_file):
            print("Missing file '" + self.translations_file + "'")
            return

        with open(self.translations_file, 'r', encoding='utf-8') as f:
            translation_data = json.load(f)

        # Agregar las nuevas traducciones si no existen
        for text, obj in translations:
            if text not in translation_data:
                translation_data[text] = {"en": "", "es": ""}

        # Guardar el archivo de traducciones actualizado
        with open(self.translations_file, 'w', encoding='utf-8') as f:
            json.dump(translation_data, f, ensure_ascii=False, indent=4)

# Ejemplo de uso
if __name__ == '__main__':
    updater = TranslationUpdater()
    updater.update_translations()
