const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');


module.exports = {
    context: src('./demo'),
    mode: 'development',
    devtool: 'source-map',
    entry: './demo.tsx',
    output: {
        filename: 'demo.js',
        path: src('./demoDist')
    },
    resolve: {
        extensions: ['.ts', '.js', '.tsx']
    },
    module: {
        rules: [
            {
                test: /\.tsx?/,
                use: 'ts-loader'
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html',
            inject: 'head',
            scriptLoading: 'defer'
        })
    ]
};


function src(relativePath) {
    return path.resolve(process.cwd(), relativePath);
}