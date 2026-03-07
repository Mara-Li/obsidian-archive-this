The **value** of keys found in the properties can undergo transformations depending on the use of the following *tokens*, using the syntax `{{mykey:mytoken}}`.

The valid *tokens* are the following:

|       Key        | Description                                                                                                                                                                                | Input                         | Output                   |
| :--------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- | ------------------------ |
| `slugify_strict` | Strict [Slugify](https://www.npmjs.com/package/slugify) (removes all special and Unicode characters) and replaces spaces with a character (default `-`)                                   | `Music title: アークナイツ`         | `music-title`            |
|    `slugify`     | Less strict than the previous option, keeping some Unicode characters.                                                                                                                    | `café with unicode: 🦆 & 🖼️` | `cafe-with-unicode:-and` |
|   `lowercase`    | Simply converts the text to lowercase                                                                                                                                                      | `MON TEXT EN MAJUSCULE`       | `mon text en majuscule`  |
|   `no_accent`    | Replaces accented characters with their "normal" counterparts                                                                                                                             | `café`                        | `cafe`                   |
|   `normalize`    | Converts to lowercase and removes accents                                                                                                                                                  | `MON SUPER CAFÉ`              | `mon super cafe`         |
|   `capitalize`   | Capitalizes the first letter of each word                                                                                                                                                  | `coucou mon chou`             | `Coucou Mon Chou`        |
|   `uppercase`    | Converts the entire string to uppercase                                                                                                                                                    | `ma cafetière`                | `MA CAFETIÈRE`           |
|   `transform`    | Does not apply any transformation but allows character replacement using the syntax `/input/output`                                                                                      | `**étoile**` (`/*/_`)         | `__étoile__`             |

> [!IMPORTANT] Transformations cannot be combined.

# Replacement

It is also possible to specify text replacements for the key by adding `/from/to` after the transformation name (`/from` should be omitted when using slugify options).

> [!DANGER] It is not possible to transform the `/` character.

> [!EXAMPLE] Some examples:
>
> | Key                          | Source                       | Output                       |
> | ---------------------------- | ---------------------------- | ---------------------------- |
> | `{{title:slugify_strict/_}}` | `Mon titre avec des espaces` | `mon_titre_avec_des_espaces` |
> | `{{title:transform/*/_/}}`   | `Valeur*à*transformer`       | `Valeur_à_transformer`       |
