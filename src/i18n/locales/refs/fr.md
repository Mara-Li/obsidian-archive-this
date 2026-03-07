La **valeur** des clés trouvées dans les propriétés peuvent subir des transformations selon l'utilisation des *tokens* suivants, sous forme de `{{maclé:montoken}}`

Les *tokens* valides sont les suivants :

|       Key        | Description                                                                                                                                                                                | Input                         | Output                   |
| :--------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- | ------------------------ |
| `slugify_strict` | [Slugify](https://www.npmjs.com/package/slugify) de manière stricte (suppression de tous les caractères spéciaux et unicode) et remplacement des espaces par un caractère (par défaut `-`) | `Music title: アークナイツ`         | `music-title`            |
|    `slugify`     | Moins strict que l'option précédente en conservant certains caractères unicodes.                                                                                                           | `café with unicode: 🦆 & 🖼️` | `cafe-with-unicode:-and` |
|   `lowercase`    | Met simplement le texte en minuscule                                                                                                                                                       | `MON TEXT EN MAJUSCULE`       | `mon text en majuscule`  |
|   `no_accent`    | Remplace les caractères accentuées par leur versions "normales"                                                                                                                            | `café`                        | `cafe`                   |
|   `normalize`    | Met en minuscule et remplace les acccents                                                                                                                                                  | `MON SUPER CAFÉ`              | `mon super cafe`         |
|   `capitalize`   | Met en majuscule chaque première lettre d'un texte                                                                                                                                         | `coucou mon chou`             | `Coucou Mon Chou`        |
|   `uppercase`    | Met en majuscule toute la chaine de caractère                                                                                                                                              | `ma cafetière`                | `MA CAFETIÈRE`           |
|   `transform`    | N'applique pas de transformation, mais permet le remplacement de caractère via la syntaxe `/entrée/sortie`                                                                                 | `**étoile**` (`/*/_`)         | `__étoile__`             |

> [!important] Il n'est pas possible de combiner les transformation

# Remplacement
Il est aussi possible de spécifier des remplacements de textes pour la clé, en plaçant après le nom de la transformation, `/from/to` (le `/from` est à omettre lors de l'utilisation des options de slugify)

> [!danger] Il n'est pas possible de transformer le caractère `/`.

> [!example] Quelques exemples :
>
> | Clé                          | Source                       | Sortie                       |
> | ---------------------------- | ---------------------------- | ---------------------------- |
> | `{{title:slugify_strict/_}}` | `Mon titre avec des espaces` | `mon_titre_avec_des_espaces` |
> | `{{title:transform/*/_/}}`   | `Valeur*à*transformer`       | `Valeur_à_transformer`       |
