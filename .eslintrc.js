module.exports = {
    extends: 'airbnb/base',

    rules: {
        //'comma-style': "off",
        indent: ['warn', 4, { SwitchCase: 1 }],
        'no-console': 'off',
        'padded-blocks': 'off',
        'no-param-reassign': 'off',
        'no-cond-assign': ['error', 'except-parens'],
    },
}

