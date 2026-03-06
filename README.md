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
3. **Overriding paths** : Allow to change the result path instead of copying the original tree. For folder, it will use the properties of the folder note. Includes:
    - ***Frontmatter key for original path** 
    - **Folder note settings** with behavior (inside, outside, inside with specific name)
    - **Date format** (using moment)
    - And adding new overriding paths

### Overriding path

Allow to change the path in the archive. You can use the frontmatter key to customize this, with encapsulate the value between `{{}}` (ie `{{key}}). Theses keys can have:
- A transformation (see below): At the end, separated from the name with `:`, ie `{{key:transformation}}
- A default value: Before the transformation (if any), separated from the name with `|` like `{{key|default}}`
- A replacement : Useful when you want to replace a specific character in the key by another one. It should be used with the transformation as `{{key:transformation/from/to}}`

It exists also special keys that are taken from the file data instead of the frontmatter :
- `ctime`: file creation time
- `mtime`: file last modification time
- `size`: file size

When archived, the plugin will automatically add a key in the frontmatter that contains the original path. You can customize this with **frontmatter key for original path**.

Only the keys that can be stringified will be used. 

> [!NOTE]
> For list, the value will be joined by `/`

#### Folder note

When moving a folder, you can't get the file stats and frontmatter. To support the overriding, you need to use a folder note, that can be :
- Inside with the same name of the moved folder,
- Outside with the same name of the adjacent folder
- Inside, but with a specific name (for example, `index.md`).

Theses folder notes will also get the `original path` key for restoration.

Disabled, the default tree will be used.

#### Date format

As you maybe want a specific date format (from the frontmatter or special date key), you can customize this using the [moment format](https://momentjs.com/docs/#/parsing/string-format/).
For convainience, you can set the input AND the output, so moment can safely parse the date.

#### Transformation

Only some transformation can be used. Theses transformation are specific value in the key. Valid keys are:
- `slugify_strict` : [slugify](https://www.npmjs.com/package/slugify) strictly the frontmatter value,
- `slugify` : Less strict
- `lowercase`
- `no_accent` : Replace the accent to their "normal" counterpart (`café` -> `cafe`)
- `normalize` : Lowercase + remove accents
- `capitalize` : Uppercase the first letter of a string
- `uppercase` : Uppercase all the string
- `transform` : Do not transform but allow to use a transformation in the form of `/from/to` (ie `transform/ /-` that will replace all space to dash)

### Overriding usage

After click on the "Add override path", a new line is added in the settings, composed by:
- **A trash** : to delete the line
- **An up** and **down** arrow, to change the order of the line
- **A source** input, that is the path of the file to change,
- **Archive** input, that will be the path in the archive
- **Regex flags** input, used if you want to set the source path as a regex.

> [!warning]
> The overriding path is used from up to down, and all overriding are applied in order (if matching)
> If, at the end, a `{{key}}` remains, the default path will be returned.

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

