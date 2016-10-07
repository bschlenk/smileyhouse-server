module.exports = {
    extends: 'airbnb/base',

    rules: {
        //'comma-style': "off",
        indent: ['warn', 4, { SwitchCase: 1 }],
        'no-console': 'off',
        'padded-blocks': 'off',
        'no-param-reassign': 'off',
        'no-cond-assign': ['error', 'except-parens'],
        'no-underscore-dangle': 'off',
        'quotes': [2, 'single', {'allowTemplateLiterals': true}],
        'curly': ['warn', 'all'],
        'class-methods-use-this': 'off',
        'no-plusplus': 'off',
        'no-multi-spaces': ['error', {'exceptions': {'Property': true, 'SwitchStatement': true}}],
    },

    parserOptions: {
        sourceType: 'script',
    }
}

