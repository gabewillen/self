<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Language

* read the STE rules and word replacements in the [violations catalog](../references/violations.md#language-language-gate)
* for each path in `{{target_paths}}`
  * read the file
  * ignore `{{variables}}`, link targets, code spans, code blocks, file paths, commands, and YAML keys
  * count each ignored item as one word
  * for each instruction sentence with more than 20 words
    * append finding `STE-001` P1 with file, heading, line, word count, and fix from the catalog
  * for each descriptive sentence with more than 25 words
    * append finding `STE-001` P1 with file, heading, line, word count, and fix from the catalog
  * for each word in the "Do not use" column of the catalog replacement table
    * append finding `STE-002` P1 with file, line, the word, and its replacement
  * for each instruction in the passive voice
    * append finding `STE-003` P1 with file, heading, line, evidence quote, and fix from the catalog
  * for each `-ing` verb form that is not part of a technical name
    * append finding `STE-004` P2 with file, line, evidence quote, and fix from the catalog
  * for each noun cluster with more than three nouns
    * append finding `STE-005` P2 with file, line, evidence quote, and fix from the catalog
  * for each contraction
    * append finding `STE-006` P2 with file, line, evidence quote, and fix from the catalog
  * for each instruction that puts its condition after the action
    * append finding `STE-007` P2 with file, line, evidence quote, and fix from the catalog
  * for each prose paragraph with more than six sentences
    * append finding `STE-008` P2 with file, line, sentence count, and fix from the catalog
* go back to the caller with the updated `{{findings}}`
