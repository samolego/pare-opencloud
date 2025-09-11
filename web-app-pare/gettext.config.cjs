module.exports = {
  input: {
    path: './src',
    include: ['**/*.js', '**/*.ts', '**/*.vue']
  },
  output: {
    locales: ['sl'],
    path: './l10n/locale',
    potPath: '../template.pot',
    jsonPath: '../translations.json',
    flat: false,
    linguas: false
  }
}
