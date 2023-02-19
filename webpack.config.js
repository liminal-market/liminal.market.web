const path = require('path');

module.exports = {
    mode: "development",
    entry: './src/main.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'app/js'),
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'app')
        },
        liveReload: false,
        hot: false,
        devMiddleware: {
            writeToDisk: true,
        },
        compress: true,
        allowedHosts: ['localhost']
    },
};