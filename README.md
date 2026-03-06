# Archive This

Move files and folders to the archive while keeping the hierarchy.

Some part of the code was taken from [para-shortcuts](https://github.com/gOATiful/para-shortcuts)

## 🗜️ Usage

The plugin adds commands for:
- File menu (right-click menu in the explorer, works for both folders and files)
- File**s** menu (multiple selected files/folders)

The plugin automatically detects if the files or folders are in the archive folder or not:
- If they are, the command allows you to restore from the archive
- If not, the command allows you to archive them.

> [!INFO]
> When multiple files are selected and some are in the archive and others are not, the plugin will intelligently archive or restore on a per-file basis.

## ⚙️ Settings

Some settings are available in the settings tab:
1. **Archive folder**: It will be created if it does not exist when using the archive command.
2. **Delete when empty**: Delete the parent folder(s) of the moved file if they are empty. Separate options for both restore & archiving.
3. **Overriding paths** : Allow to change the result path instead of copying the original tree. For folder, it will use the properties of the folder note.

//@TODO: Write the documentation for overriding path, original_path, folder note and the allowed transformation
//@TODO: Add screenshot

## 📥 Installation

- [ ] From Obsidian's community plugins
- [x] Using BRAT with `https://github.com/Mara-Li/obsidian-archive-this`
- [x] From the release page: 
    - Download the latest release
    - Unzip `archive-this.zip` in `.obsidian/plugins/` path
    - In Obsidian settings, reload the plugin
    - Enable the plugin


### 🎼 Languages

- [x] English
- [ ] French

To add a translation:
1. Fork the repository
2. Add the translation in the `src/i18n/locales` folder with the name of the language (ex: `fr.json`). 
    - You can get your locale language from Obsidian using [obsidian translation](https://github.com/obsidianmd/obsidian-translations) or using the commands (in templater for example) : `<% tp.obsidian.moment.locale() %>`
    - Copy the content of the [`en.json`](./src/i18n/locales/en.json) file in the new file
    - Translate the content
3. Edit `i18n/i18next.ts` :
    - Add `import * as <lang> from "./locales/<lang>.json";`
    - Edit the `ressource` part with adding : `<lang> : {translation: <lang>}`

