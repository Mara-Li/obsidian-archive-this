# Archive This

Move files and folders to the archive while keeping the hierarchy.

Some parts of the code were taken from [para-shortcuts](https://github.com/gOATiful/para-shortcuts)

## 🗜️ Usage

The plugin adds commands for:
- File menu (right-click menu in the explorer, works for both folders and files)
- File**s** menu (multiple selected files/folders)

The plugin automatically detects whether the files or folders are in the archive folder or not:
- If they are, the command allows you to restore them from the archive
- If not, the command allows you to archive them.

> [!NOTE]  
> When multiple files are selected and some are in the archive while others are not, the plugin will intelligently archive or restore them on a per-file basis.

## ⚙️ Settings

Some settings are available in the settings tab:
1. **Archive folder**: It will be created if it does not exist when using the archive command.
2. **Delete when empty**: Delete the parent folder(s) of the moved file if they are empty. Separate options are available for both restoring and archiving.
3. **Overriding paths**: Allows changing the resulting path instead of copying the original tree. For folders, it will use the properties of the folder note. Includes:
    - **Frontmatter key for original path**
    - **Folder note settings** with behavior (inside, outside, inside with a specific name)
    - **Date format** (using moment)
    - Adding new overriding paths

### Overriding path

Allows changing the path in the archive. You can use frontmatter keys to customize this by encapsulating the value between `{{}}` (e.g. `{{key}}`). These keys can have:
- A transformation (see below): at the end, separated from the name with `:`, e.g. `{{key:transformation}}`
- A default value: before the transformation (if any), separated from the name with `|`, like `{{key|default}}`
- A replacement: useful when you want to replace a specific character in the key with another one. It should be used with the transformation as `{{key:transformation/from/to}}`

There are also special keys that are taken from the file data instead of the frontmatter:
- `ctime`: file creation time
- `mtime`: file last modification time
- `size`: file size

When archived, the plugin will automatically add a key in the frontmatter that contains the original path. You can customize this with **frontmatter key for original path**.

Only keys that can be stringified will be used.

> [!NOTE]
> For lists, the value will be joined using `/`.

#### Folder note

When moving a folder, you cannot access file stats or frontmatter. To support overriding, you need to use a folder note, which can be:
- Inside the folder with the same name as the moved folder
- Outside the folder with the same name as the adjacent folder
- Inside the folder but with a specific name (for example, `index.md`)

These folder notes will also receive the `original path` key for restoration.

If disabled, the default tree will be used.

#### Date format

If you want a specific date format (from the frontmatter or special date keys), you can customize it using the [moment format](https://momentjs.com/docs/#/parsing/string-format/).

For convenience, you can set both the input AND the output format so that moment can safely parse the date.

#### Transformation

Only certain transformations can be used. These transformations are specific values in the key. Valid values are:
- `slugify_strict`: strictly [slugify](https://www.npmjs.com/package/slugify) the frontmatter value
- `slugify`: less strict
- `lowercase`
- `no_accent`: replace accented characters with their normal counterparts (`café` -> `cafe`)
- `normalize`: lowercase + remove accents
- `capitalize`: uppercase the first letter of the string
- `uppercase`: uppercase the entire string
- `transform`: do not transform but allow using a replacement in the form `/from/to` (e.g. `transform/ /-` replaces all spaces with dashes)

### Overriding usage

After clicking on "Add override path", a new line is added in the settings, composed of:
- **A trash icon**: to delete the line
- **Up** and **down** arrows: to change the order of the line
- **A source** input: the path of the file to change
- **Archive** input: the resulting path in the archive
- **Regex flags** input: used if you want to treat the source path as a regex.

> [!WARNING]
> Overriding paths are applied from top to bottom, and all overrides are applied in order (if matching).
> If, at the end, a `{{key}}` remains, the default path will be returned.

## 📥 Installation

- [ ] From Obsidian's community plugins
- [x] Using BRAT with `https://github.com/Mara-Li/obsidian-archive-this`
- [x] From the release page:
    - Download the latest release
    - Unzip `archive-this.zip` into the `.obsidian/plugins/` folder
    - In Obsidian settings, reload the plugin
    - Enable the plugin

### 🎼 Languages

- [x] English
- [x] French

To add a translation:
1. Fork the repository
2. Add the translation in the `src/i18n/locales` folder with the name of the language (e.g. `fr.json`)
    - You can get your locale language from Obsidian using [obsidian translation](https://github.com/obsidianmd/obsidian-translations) or using commands (in Templater for example): `<% tp.obsidian.moment.locale() %>`
    - Copy the content of the [`en.json`](./src/i18n/locales/en.json) file into the new file
    - Translate the content
3. Edit `i18n/i18next.ts`:
    - Add `import * as <lang> from "./locales/<lang>.json";`
    - Edit the `resource` part by adding: `<lang>: {translation: <lang>}`
