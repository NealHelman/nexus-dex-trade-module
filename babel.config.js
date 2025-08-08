const browserslistQuery = require('nexus-module/lib/browserslistQuery').default;

const reactOptimizePreset = [
    '@babel/plugin-transform-react-constant-elements',
    'babel-plugin-transform-react-remove-prop-types',
    'babel-plugin-transform-react-pure-class-to-function',
];

const devPlugins = [];

const prodPlugins = ['babel-plugin-dev-expression', ...reactOptimizePreset];

module.exports = function (api) {
    const development = process.env.NODE_ENV !== 'production';
    api.cache(true);

    return {
        presets: [
            ['@babel/preset-env', { targets: browserslistQuery }],
            ['@babel/preset-react', { development, runtime: 'automatic' }],
            ['@babel/preset-typescript', {
                allowNamespaces: true,
                allowDeclareFields: true
            }],
        ],
        plugins: [
            [
                'babel-plugin-module-resolver',
                {
                    root: ['./src/'],
                },
            ],
            ['@babel/plugin-proposal-optional-chaining', { loose: false }],
            ["@babel/plugin-proposal-decorators", { "legacy": true }],
            ...(development ? devPlugins : prodPlugins),
        ],
    };
};
